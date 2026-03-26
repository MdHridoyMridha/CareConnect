export type Role = 'patient' | 'caregiver';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  phone?: string;
  date_of_birth?: string;
  timezone: string;
  avatar_url?: string;
  created_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  start_date: string;
  end_date?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  status: 'taken' | 'later' | 'skipped';
  taken_at: string;
  notes?: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  mood: string;
  symptoms_text: string;
  voice_url?: string;
  ai_detected_keywords: string[];
  created_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_text: string;
  flagged_keywords: string[];
  medication_adherence_score: number;
  created_at: string;
}

export interface VoiceMessage {
  id: string;
  sender_id: string;
  patient_id: string;
  audio_url: string;
  transcript?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Placeholder for Supabase Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      medications: {
        Row: Medication;
        Insert: Omit<Medication, 'id' | 'created_at'>;
        Update: Partial<Omit<Medication, 'id' | 'created_at'>>;
      };
      daily_checkins: {
        Row: DailyCheckin;
        Insert: Omit<DailyCheckin, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyCheckin, 'id' | 'created_at'>>;
      };
      medication_logs: {
        Row: MedicationLog;
        Insert: Omit<MedicationLog, 'id' | 'taken_at'>;
        Update: Partial<Omit<MedicationLog, 'id' | 'taken_at'>>;
      };
      daily_summaries: {
        Row: DailySummary;
        Insert: Omit<DailySummary, 'id' | 'created_at'>;
        Update: Partial<Omit<DailySummary, 'id' | 'created_at'>>;
      };
      voice_messages: {
        Row: VoiceMessage;
        Insert: Omit<VoiceMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<VoiceMessage, 'id' | 'created_at'>>;
      };
      caregiver_links: {
        Row: any;
        Insert: any;
        Update: any;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
    };
  };
}
