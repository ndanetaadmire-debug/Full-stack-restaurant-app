import express from 'express';
import { supabase } from './supabase.js';
import { authenticateUser } from './auth.js';

const router = express.Router();

// Sign Up page
router.get('/signup', (req, res) => {
  res.render('auth.ejs', { mode: 'signup', error: null });
});

// Sign In page
router.get('/signin', (req, res) => {
  res.render('auth.ejs', { mode: 'signin', error: null });
});

// Handle Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.render('auth.ejs', { 
        mode: 'signup', 
        error: 'All fields are required' 
      });
    }

    // Validate role
    if (!['customer', 'kitchen_staff'].includes(role)) {
      return res.render('auth.ejs', { 
        mode: 'signup', 
        error: 'Invalid role selected' 
      });
    }

    // Sign up user with Supabase Auth
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.render('auth.ejs', { 
        mode: 'signup', 
        error: error.message 
      });
    }

    // Create user profile with role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        full_name,
        role,
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.render('auth.ejs', { 
        mode: 'signup', 
        error: 'Account created but profile setup failed' 
      });
    }

    res.redirect('/auth/signin?message=Account created successfully');
  } catch (error) {
    console.error('Signup error:', error);
    res.render('auth.ejs', { 
      mode: 'signup', 
      error: 'Server error during signup' 
    });
  }
});

// Handle Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth.ejs', { 
        mode: 'signin', 
        error: 'Email and password are required' 
      });
    }

    // Sign in user with Supabase Auth
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.render('auth.ejs', { 
        mode: 'signin', 
        error: error.message 
      });
    }

    // Store session token
    req.session.token = session.access_token;
    req.session.user = user;

    // Redirect based on user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'kitchen_staff') {
      res.redirect('/kitchen/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Signin error:', error);
    res.render('auth.ejs', { 
      mode: 'signin', 
      error: 'Server error during signin' 
    });
  }
});

// Sign Out
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    req.session.destroy();
    res.redirect('/auth/signin');
  } catch (error) {
    console.error('Signout error:', error);
    res.redirect('/');
  }
});

export default router;
