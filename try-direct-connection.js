import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing different key formats...');

// Try with the current key format
const supabase1 = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Try removing sb_secret_ prefix if exists
const cleanKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY.replace('sb_secret_', '');
console.log('Clean key (removed prefix):', cleanKey);

const supabase2 = createClient(
  process.env.VITE_SUPABASE_URL,
  cleanKey
);

async function testConnections() {
  console.log('\n=== Testing with original key ===');
  try {
    const { data, error } = await supabase1.from('meals').select('count').limit(1);
    if (error) {
      console.log('Original key failed:', error.message);
    } else {
      console.log('Original key works!');
    }
  } catch (err) {
    console.log('Original key exception:', err.message);
  }

  console.log('\n=== Testing with cleaned key ===');
  try {
    const { data, error } = await supabase2.from('meals').select('count').limit(1);
    if (error) {
      console.log('Cleaned key failed:', error.message);
    } else {
      console.log('Cleaned key works!');
    }
  } catch (err) {
    console.log('Cleaned key exception:', err.message);
  }

  console.log('\n=== Testing HTTP request directly ===');
  try {
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      }
    });
    console.log('HTTP Status:', response.status);
    const text = await response.text();
    console.log('HTTP Response:', text);
  } catch (err) {
    console.log('HTTP request failed:', err.message);
  }
}

testConnections();
