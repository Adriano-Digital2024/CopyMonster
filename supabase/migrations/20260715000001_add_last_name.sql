ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';
UPDATE profiles SET last_name = '' WHERE last_name IS NULL;
