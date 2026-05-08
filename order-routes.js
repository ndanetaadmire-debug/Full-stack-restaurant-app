import express from 'express';
import { supabase } from './supabase.js';
import { authenticateUser } from './auth.js';

const router = express.Router();

// Apply authentication to all order routes
router.use(authenticateUser);

// Place Order - Create new order
router.post('/place', async (req, res) => {
  try {
    const { items, special_instructions } = req.body;
    const customer_id = req.user.id;

    // Validate order items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Calculate total amount and validate meal availability
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { meal_id, quantity, notes } = item;
      
      if (!meal_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item data' });
      }

      // Get meal details
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .select('id, name, price')
        .eq('id', meal_id)
        .single();

      if (mealError || !meal) {
        return res.status(400).json({ error: `Meal not found: ${meal_id}` });
      }

      const unitPrice = meal.price;
      totalAmount += unitPrice * quantity;

      orderItems.push({
        meal_id,
        quantity,
        unit_price: unitPrice,
        notes: notes || null
      });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id,
        status: 'Pending',
        payment_status: 'Pending',
        total_amount: totalAmount,
        special_instructions: special_instructions || null
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Clean up the order if items creation failed
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ error: 'Failed to create order items' });
    }

    // Emit real-time notification to kitchen
    req.app.get('io')?.emit('newOrder', {
      orderId: order.id,
      customerName: req.profile.full_name,
      items: orderItems.length,
      totalAmount,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      order: {
        ...order,
        order_items: createdItems
      }
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Customer Orders
router.get('/my-orders', async (req, res) => {
  try {
    const customer_id = req.user.id;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        payment_status,
        total_amount,
        special_instructions,
        created_at,
        updated_at,
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
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({ orders });
  } catch (error) {
    console.error('Customer orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Order Details
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const customer_id = req.user.id;

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
      .eq('customer_id', customer_id)
      .single();

    if (error) {
      console.error('Error fetching order details:', error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
