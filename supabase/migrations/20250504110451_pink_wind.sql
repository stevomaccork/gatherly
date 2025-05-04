-- Function to delete a user account and all related data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID
  user_id := auth.uid();
  
  -- Delete user's data
  DELETE FROM profiles WHERE id = user_id;
  
  -- The rest of the data will be deleted automatically due to CASCADE constraints
  
  -- Delete the user's auth account
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;