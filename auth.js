import { supabase } from './supabase.js';

// Authentication middleware to protect routes
export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from session or headers
    const token = req.session?.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.redirect('/auth/signin');
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.redirect('/auth/signin');
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.redirect('/auth/signin');
    }

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.redirect('/auth/signin');
  }
};

// Role-based access middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).send('Access denied');
    }
    next();
  };
};

// Helper function to check if user is authenticated
export const isAuthenticated = (req) => {
  return req.user && req.profile;
};
