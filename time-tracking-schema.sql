-- Time tracking schema for employee time in/out functionality

-- Create time_tracking table
CREATE TABLE time_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_in TIMESTAMP WITH TIME ZONE,
  time_out TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4,2) DEFAULT 0,
  break_duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'clocked_out', -- 'clocked_in', 'clocked_out', 'on_break'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one active time tracking record per user per day
  UNIQUE(user_id, date)
);

-- Create function to calculate total hours
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.time_in IS NOT NULL AND NEW.time_out IS NOT NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.time_out - NEW.time_in)) / 3600 - (NEW.break_duration_minutes / 60.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate total hours
CREATE TRIGGER calculate_hours_trigger
  BEFORE INSERT OR UPDATE ON time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_hours();

-- Create updated_at trigger for time_tracking
CREATE TRIGGER update_time_tracking_updated_at
  BEFORE UPDATE ON time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on time_tracking table
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_tracking
CREATE POLICY "Users can view their own time tracking" ON time_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time tracking" ON time_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time tracking" ON time_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Managers can view their team members' time tracking
CREATE POLICY "Managers can view team time tracking" ON time_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role IN ('manager', 'admin') OR id = user_id)
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_time_tracking_user_id ON time_tracking(user_id);
CREATE INDEX idx_time_tracking_date ON time_tracking(date);
CREATE INDEX idx_time_tracking_status ON time_tracking(status);
CREATE INDEX idx_time_tracking_user_date ON time_tracking(user_id, date);

-- Create function to get current time tracking status
CREATE OR REPLACE FUNCTION get_current_time_status(user_uuid UUID)
RETURNS TABLE (
  is_clocked_in BOOLEAN,
  current_time_in TIMESTAMP WITH TIME ZONE,
  today_total_hours DECIMAL(4,2),
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tt.time_in IS NOT NULL AND tt.time_out IS NULL AS is_clocked_in,
    tt.time_in,
    COALESCE(tt.total_hours, 0) AS today_total_hours,
    COALESCE(tt.status, 'clocked_out') AS status
  FROM time_tracking tt
  WHERE tt.user_id = user_uuid 
    AND tt.date = CURRENT_DATE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clock in
CREATE OR REPLACE FUNCTION clock_in(user_uuid UUID, notes_text TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
  existing_record RECORD;
BEGIN
  -- Check if user is already clocked in today
  SELECT * INTO existing_record
  FROM time_tracking 
  WHERE user_id = user_uuid 
    AND date = CURRENT_DATE
    AND time_out IS NULL;
  
  IF existing_record IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'You are already clocked in today',
      'data', null
    );
  END IF;
  
  -- Insert or update time tracking record
  INSERT INTO time_tracking (user_id, date, time_in, status, notes)
  VALUES (user_uuid, CURRENT_DATE, NOW(), 'clocked_in', notes_text)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    time_in = NOW(),
    status = 'clocked_in',
    notes = COALESCE(notes_text, time_tracking.notes),
    updated_at = NOW()
  RETURNING * INTO existing_record;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully clocked in',
    'data', row_to_json(existing_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clock out
CREATE OR REPLACE FUNCTION clock_out(user_uuid UUID, notes_text TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
  existing_record RECORD;
BEGIN
  -- Check if user is clocked in today
  SELECT * INTO existing_record
  FROM time_tracking 
  WHERE user_id = user_uuid 
    AND date = CURRENT_DATE
    AND time_in IS NOT NULL 
    AND time_out IS NULL;
  
  IF existing_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'You are not currently clocked in',
      'data', null
    );
  END IF;
  
  -- Update time tracking record
  UPDATE time_tracking 
  SET 
    time_out = NOW(),
    status = 'clocked_out',
    notes = COALESCE(notes_text, notes),
    updated_at = NOW()
  WHERE user_id = user_uuid 
    AND date = CURRENT_DATE
    AND time_out IS NULL
  RETURNING * INTO existing_record;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully clocked out',
    'data', row_to_json(existing_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
