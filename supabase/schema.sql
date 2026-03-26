-- CareConnect Supabase Schema

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('patient', 'caregiver')) NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  timezone TEXT DEFAULT 'UTC',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Caregiver Links Table
CREATE TABLE IF NOT EXISTS caregiver_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  caregiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, caregiver_id)
);

-- 3. Daily Check-ins Table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood TEXT,
  symptoms_text TEXT,
  voice_url TEXT,
  ai_detected_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Medications Table
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  reminder_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Medication Logs Table
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('taken', 'later', 'skipped')) NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 6. Daily Summaries Table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  summary_text TEXT NOT NULL,
  flagged_keywords TEXT[],
  medication_adherence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Voice Messages Table
CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Trigger for Profile Creation
-- This automatically creates a profile entry when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email, 
    'patient'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Trigger to Notify Caregivers on Concerning Check-ins
CREATE OR REPLACE FUNCTION public.notify_caregivers_on_checkin()
RETURNS trigger AS $$
BEGIN
  -- Only notify if mood is concerning
  IF NEW.mood IN ('sad', 'sick') THEN
    INSERT INTO public.notifications (user_id, title, body, type)
    SELECT 
      caregiver_id,
      'Health Alert: ' || (SELECT full_name FROM profiles WHERE id = NEW.user_id),
      'Patient reported feeling ' || NEW.mood || '. Please check in with them.',
      'health_alert'
    FROM caregiver_links
    WHERE patient_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_daily_checkin_created ON daily_checkins;
CREATE TRIGGER on_daily_checkin_created
  AFTER INSERT ON daily_checkins
  FOR EACH ROW EXECUTE PROCEDURE public.notify_caregivers_on_checkin();

-- 11. Trigger to Notify Caregivers on Low Medication Stock
CREATE OR REPLACE FUNCTION public.notify_caregivers_on_low_stock()
RETURNS trigger AS $$
BEGIN
  IF NEW.stock_quantity <= NEW.low_stock_threshold AND (OLD.stock_quantity > NEW.low_stock_threshold OR OLD.stock_quantity IS NULL) THEN
    INSERT INTO public.notifications (user_id, title, body, type)
    SELECT 
      caregiver_id,
      'Low Stock Alert: ' || NEW.medicine_name,
      'Patient ' || (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' is running low on ' || NEW.medicine_name || '. Only ' || NEW.stock_quantity || ' doses left.',
      'low_stock'
    FROM caregiver_links
    WHERE patient_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_medication_stock_update ON medications;
CREATE TRIGGER on_medication_stock_update
  AFTER UPDATE OF stock_quantity ON medications
  FOR EACH ROW EXECUTE PROCEDURE public.notify_caregivers_on_low_stock();

-- RLS POLICIES

-- Profiles: Users can read their own profile, caregivers can read linked patients
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can search for caregivers" ON profiles;
CREATE POLICY "Users can search for caregivers" ON profiles
  FOR SELECT USING (role = 'caregiver');

DROP POLICY IF EXISTS "Caregivers can view linked patient profiles" ON profiles;
CREATE POLICY "Caregivers can view linked patient profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_id = auth.uid() AND patient_id = profiles.id
    )
  );

-- Caregiver Links: Both parties can see the link
ALTER TABLE caregiver_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own links" ON caregiver_links;
CREATE POLICY "Users can view their own links" ON caregiver_links
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Patients can link caregivers" ON caregiver_links;
CREATE POLICY "Patients can link caregivers" ON caregiver_links
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can remove their own links" ON caregiver_links;
CREATE POLICY "Users can remove their own links" ON caregiver_links
  FOR DELETE USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);

-- Daily Check-ins: Owner and linked caregiver
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own checkins" ON daily_checkins;
CREATE POLICY "Patients can manage own checkins" ON daily_checkins
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Caregivers can view linked patient checkins" ON daily_checkins;
CREATE POLICY "Caregivers can view linked patient checkins" ON daily_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_id = auth.uid() AND patient_id = daily_checkins.user_id
    )
  );

-- Medications: Owner and linked caregiver
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own medications" ON medications;
CREATE POLICY "Patients can manage own medications" ON medications
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Caregivers can view/manage linked patient medications" ON medications;
CREATE POLICY "Caregivers can view/manage linked patient medications" ON medications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_id = auth.uid() AND patient_id = medications.user_id
    )
  );

-- Medication Logs: Owner and linked caregiver
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own logs" ON medication_logs;
CREATE POLICY "Patients can manage own logs" ON medication_logs
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Caregivers can view linked patient logs" ON medication_logs;
CREATE POLICY "Caregivers can view linked patient logs" ON medication_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_id = auth.uid() AND patient_id = medication_logs.user_id
    )
  );

-- Daily Summaries: Owner and linked caregiver
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own summaries" ON daily_summaries;
CREATE POLICY "Users can view own summaries" ON daily_summaries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Caregivers can view linked patient summaries" ON daily_summaries;
CREATE POLICY "Caregivers can view linked patient summaries" ON daily_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_id = auth.uid() AND patient_id = daily_summaries.user_id
    )
  );

-- Voice Messages: Sender and Receiver
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON voice_messages;
CREATE POLICY "Users can view group messages" ON voice_messages
  FOR SELECT USING (
    auth.uid() = patient_id OR 
    EXISTS (
      SELECT 1 FROM caregiver_links 
      WHERE caregiver_id = auth.uid() AND patient_id = voice_messages.patient_id
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON voice_messages;
CREATE POLICY "Users can send group messages" ON voice_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid() = patient_id OR 
      EXISTS (
        SELECT 1 FROM caregiver_links 
        WHERE caregiver_id = auth.uid() AND patient_id = voice_messages.patient_id
      )
    )
  );

-- Notifications: Owner only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Caregivers can send notifications to linked patients" ON notifications;
CREATE POLICY "Caregivers can send notifications to linked patients" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregiver_links
      WHERE caregiver_id = auth.uid() AND patient_id = notifications.user_id
    )
  );
