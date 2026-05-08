import { supabase } from './supabase.js';

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    
    // Test a simple query to check if table exists
    const { data, error } = await supabase
      .from('meals')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('Connection successful! Table exists.');
      console.log('Test data:', data);
    }
  } catch (err) {
    console.error('Test failed with exception:', err);
  }
}

testConnection();
