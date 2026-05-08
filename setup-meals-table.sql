-- Create meals table for storing meal information
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
-- For production, you might want to restrict this based on user authentication
CREATE POLICY "Enable all operations for all users" ON meals
  FOR ALL USING (true) WITH CHECK (true);

-- Create an index on created_at for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at DESC);
