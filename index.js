import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { supabase } from './supabase.js';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import route modules
import authRoutes from './auth-routes.js';
import kitchenRoutes from './kitchen-routes.js';
import orderRoutes from './order-routes.js';

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = 3000;

// Session configuration
app.use(session({
  secret: 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Make io available to routes
app.set('io', io);

//Step 1: Run the solution.js file without looking at the code.
//Step 2: You can go to the recipe.json file to see the full structure of the recipeJSON below.
const recipeJSON =
  '[{"id": "0001","type": "taco","name": "Chicken Taco","price": 2.99,"ingredients": {"protein": {"name": "Chicken","preparation": "Grilled"},  "salsa": {"name": "Tomato Salsa","spiciness": "Medium"},  "toppings": [{"name": "Lettuce",  "quantity": "1 cup",  "ingredients": ["Iceberg Lettuce"]  },      {"name": "Cheese",  "quantity": "1/2 cup",  "ingredients": ["Cheddar Cheese", "Monterey Jack Cheese"]  },      {"name": "Guacamole",  "quantity": "2 tablespoons",  "ingredients": ["Avocado", "Lime Juice", "Salt", "Onion", "Cilantro"]  },      {"name": "Sour Cream",  "quantity": "2 tablespoons",  "ingredients": ["Sour Cream"]  }      ]    }  },{"id": "0002","type": "taco","name": "Beef Taco","price": 3.49,"ingredients": {"protein": {"name": "Beef","preparation": "Seasoned and Grilled"},  "salsa": {"name": "Salsa Verde","spiciness": "Hot"},  "toppings": [{"name": "Onions",  "quantity": "1/4 cup",  "ingredients": ["White Onion", "Red Onion"]  },      {"name": "Cilantro",  "quantity": "2 tablespoons",  "ingredients": ["Fresh Cilantro"]  },      {"name": "Queso Fresco",  "quantity": "1/4 cup",  "ingredients": ["Queso Fresco"]  }      ]    }  },{"id": "0003","type": "taco","name": "Fish Taco","price": 4.99,"ingredients": {"protein": {"name": "Fish","preparation": "Battered and Fried"},  "salsa": {"name": "Chipotle Mayo","spiciness": "Mild"},  "toppings": [{"name": "Cabbage Slaw",  "quantity": "1 cup",  "ingredients": [    "Shredded Cabbage",    "Carrot",    "Mayonnaise",    "Lime Juice",    "Salt"          ]  },      {"name": "Pico de Gallo",  "quantity": "1/2 cup",  "ingredients": ["Tomato", "Onion", "Cilantro", "Lime Juice", "Salt"]  },      {"name": "Lime Crema",  "quantity": "2 tablespoons",  "ingredients": ["Sour Cream", "Lime Juice", "Salt"]  }      ]    }  }]';

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For JSON API requests

// Register routes
app.use('/auth', authRoutes);
app.use('/kitchen', kitchenRoutes);
app.use('/orders', orderRoutes);

app.get("/", async (req, res) => {
  try {
    // Get all meals to display on main page
    const { data: allMeals, error } = await supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching meals:', error);
      return res.render("index.ejs", { meals: [], error: "Could not load meals" });
    }
    
    // Group meals by type
    const mealsByType = {};
    allMeals.forEach(meal => {
      if (!mealsByType[meal.type]) {
        mealsByType[meal.type] = [];
      }
      mealsByType[meal.type].push(meal);
    });
    
    res.render("index.ejs", { mealsByType, allMeals });
  } catch (error) {
    console.error('Server error:', error);
    res.render("index.ejs", { mealsByType: {}, allMeals: [] });
  }
});

// Route to get meals by type
app.get("/menu/:type", async (req, res) => {
  try {
    const mealType = req.params.type;
    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .eq('type', mealType)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching meals by type:', error);
      return res.status(500).send('Error fetching meals');
    }
    
    res.render("menu-type.ejs", { meals, mealType });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
});

app.post("/recipe", (req, res) => {
  //Step 3: Write your code here to make this behave like the solution website.
  //Step 4: Add code to views/index.ejs to use the recieved recipe object.
  const userChoice = req.body.choice;
  const data = JSON.parse(fs.readFileSync("./recipe.json", "utf-8"));
  if (userChoice === "chicken"){data[0]

  }
  else if (userChoice === "beef"){ data[1]

  }
  else if (userChoice === "fish"){data[2]

  }
});

// Route to display meal form
app.get("/add-meal", (req, res) => {
  res.render("meal-form.ejs");
});

// Route to handle meal submission
app.post("/add-meal", async (req, res) => {
  try {
    console.log('Received meal data:', req.body);
    const { name, type, price, protein_name, protein_preparation, salsa_name, salsa_spiciness } = req.body;
    
    console.log('Attempting to connect to Supabase...');
    console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    
    const { data, error } = await supabase
      .from('meals')
      .insert([{
        name,
        type,
        price: parseFloat(price),
        protein_name,
        protein_preparation,
        salsa_name,
        salsa_spiciness
      }]);
    
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).send(`Error saving meal: ${error.message}`);
    }
    
    console.log('Meal saved successfully:', data);
    res.redirect('/meals');
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send(`Server error: ${error.message}`);
  }
});

// Route to display all meals
app.get("/meals", async (req, res) => {
  try {
    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching meals:', error);
      return res.status(500).send('Error fetching meals');
    }
    
    res.render("meals.ejs", { meals });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
});

// Order tracking page
app.get('/my-orders', (req, res) => {
  res.render('order-tracking.ejs');
});

// Add to cart route (for ordering)
app.post('/add-to-cart', async (req, res) => {
  try {
    const { meal_id, quantity, notes } = req.body;
    
    if (!meal_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid item data' });
    }

    // Get meal details
    const { data: meal, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', meal_id)
      .single();

    if (error || !meal) {
      return res.status(400).json({ error: 'Meal not found' });
    }

    // Initialize cart in session if not exists
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Add to cart
    const cartItem = {
      meal_id,
      name: meal.name,
      price: meal.price,
      quantity: parseInt(quantity),
      notes: notes || '',
      protein_name: meal.protein_name,
      protein_preparation: meal.protein_preparation,
      salsa_name: meal.salsa_name,
      salsa_spiciness: meal.salsa_spiciness
    };

    // Check if item already in cart
    const existingIndex = req.session.cart.findIndex(item => item.meal_id === meal_id);
    if (existingIndex >= 0) {
      req.session.cart[existingIndex].quantity += cartItem.quantity;
    } else {
      req.session.cart.push(cartItem);
    }

    res.json({ success: true, cart: req.session.cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cart API routes
app.get('/api/cart', (req, res) => {
  res.json({ cart: req.session.cart || [] });
});

app.post('/api/cart/clear', (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
});

// Place order from cart
app.post('/place-order', async (req, res) => {
  try {
    const { special_instructions } = req.body;
    
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Check if user is authenticated
    if (!req.session.token) {
      return res.redirect('/auth/signin?message=Please sign in to place an order');
    }

    // Prepare order items
    const orderItems = req.session.cart.map(item => ({
      meal_id: item.meal_id,
      quantity: item.quantity,
      notes: item.notes
    }));

    // Call order placement API
    const response = await fetch('http://localhost:3000/orders/place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.session.token}`
      },
      body: JSON.stringify({
        items: orderItems,
        special_instructions
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(400).json(error);
    }

    const result = await response.json();

    // Clear cart
    req.session.cart = [];

    res.json({ success: true, order: result.order });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO real-time connections
io.on('connection', (socket) => {
  console.log('User connected to real-time updates');
  
  socket.on('disconnect', () => {
    console.log('User disconnected from real-time updates');
  });
});

// Start server with HTTP and Socket.IO
server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
  console.log(`Kitchen dashboard available at: http://localhost:${port}/kitchen/dashboard`);
});
