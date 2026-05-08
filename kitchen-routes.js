import express from 'express';
import { supabase } from './supabase.js';
import { authenticateUser, requireRole } from './auth.js';

const router = express.Router();

// Apply authentication and role middleware to all kitchen routes
router.use(authenticateUser);
router.use(requireRole(['kitchen_staff']));

// Kitchen Dashboard - Main page
router.get('/dashboard', async (req, res) => {
  try {
    // Fetch all orders with customer details and order items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        status,
        payment_status,
        total_amount,
        special_instructions,
        created_at,
        updated_at,
        profiles!inner (
          full_name,
          email
        ),
        order_items (
          id,
          meal_id,
          quantity,
          unit_price,
          notes,
          meals (
            name,
            type,
            protein_name,
            protein_preparation,
            salsa_name,
            salsa_spiciness
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).send('Error fetching orders');
    }

    // Group order items by order
    const ordersWithItems = orders.map(order => ({
      ...order,
      order_items: order.order_items || []
    }));

    // Calculate statistics
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      preparing: orders.filter(o => o.status === 'Preparing').length,
      ready: orders.filter(o => o.status === 'Ready').length,
      completed: orders.filter(o => o.status === 'Completed').length
    };

    res.render('kitchen-dashboard.ejs', { 
      orders: ordersWithItems, 
      stats,
      user: req.user,
      profile: req.profile 
    });
  } catch (error) {
    console.error('Kitchen dashboard error:', error);
    res.status(500).send('Server error');
  }
});

// Update Order Status
router.post('/orders/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    // Emit real-time update
    req.app.get('io')?.emit('orderStatusUpdate', {
      orderId,
      status,
      updatedOrder: data
    });

    res.json({ success: true, order: data });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Order Details (for real-time updates)
router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        status,
        payment_status,
        total_amount,
        special_instructions,
        created_at,
        updated_at,
        profiles!inner (
          full_name,
          email
        ),
        order_items (
          id,
          meal_id,
          quantity,
          unit_price,
          notes,
          meals (
            name,
            type,
            protein_name,
            protein_preparation,
            salsa_name,
            salsa_spiciness
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order details:', error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
