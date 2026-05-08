import { supabase } from './supabase.js';

async function createMealsTable() {
  try {
    console.log('Creating meals table...');
    
    // SQL to create the meals table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS meals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        protein_name VARCHAR(255) NOT NULL,
        protein_preparation VARCHAR(255) NOT NULL,
        salsa_name VARCHAR(255) NOT NULL,
        salsa_spiciness VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable Row Level Security (RLS)
      ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
      
      -- Create a policy that allows all operations on the meals table
      CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON meals
        FOR ALL USING (true) WITH CHECK (true);
      
      -- Create an index on created_at for better performance when ordering
      CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at DESC);
    `;
    
    // Execute the SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      
      // Try alternative approach using raw SQL
      console.log('Trying alternative approach...');
      const { data: altData, error: altError } = await supabase
        .from('meals')
        .select('*')
        .limit(1);
      
      if (altError && altError.code === 'PGRST205') {
        console.log('Table does not exist. You need to manually create it.');
        console.log('Please run this SQL in your Supabase SQL Editor:');
        console.log('===============================================');
        console.log(createTableSQL);
        console.log('===============================================');
      } else if (!altError) {
        console.log('Table already exists!');
      }
    } else {
      console.log('Table created successfully!');
    }
    
    // Test the table
    console.log('\nTesting table access...');
    const { data: testData, error: testError } = await supabase
      .from('meals')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Table test failed:', testError);
    } else {
      console.log('Table is ready! ✅');
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

createMealsTable();
