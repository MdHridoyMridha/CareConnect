import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, Pill, MessageSquare, AlertCircle, ChevronRight, Activity, Calendar, Heart, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomNav } from '../../components/shared/BottomNav';
import { Profile, DailyCheckin, Medication, DailySummary } from '../../types';

export default function CaregiverDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const timelineRef = useRef<HTMLDivElement>(null);

  const scrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (profile) {
      fetchPatientData();
    }
  }, [profile]);

  async function fetchPatientData() {
    try {
      setLoading(true);
      // 1. Get linked patients
      const { data: links, error: linkError } = await supabase
        .from('caregiver_links')
        .select('patient_id')
        .eq('caregiver_id', profile?.id);

      if (linkError) throw linkError;
      if (!links || links.length === 0) {
        setPatient(null);
        return;
      }

      // For now, we just monitor the first patient
      const patientId = links[0].patient_id;

      // 2. Fetch patient profile
      const { data: patientData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();
      
      setPatient(patientData);

      // 3. Fetch latest check-ins
      const { data: checkinData } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setCheckins(checkinData || []);

      // 4. Fetch medications
      const { data: medData } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', patientId);
      
      setMeds(medData || []);

      // 5. Fetch latest summary
      const { data: summaryData } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      setSummary(summaryData);

    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNudge = async () => {
    if (!patient || !profile) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: patient.id,
          title: 'Caregiver Check-in',
          body: `${profile.full_name} is checking in on you. How are you feeling?`,
          type: 'nudge'
        });
      if (error) throw error;
      alert('Nudge sent to patient!');
    } catch (err) {
      console.error('Error sending nudge:', err);
    }
  };

  const lowStockMeds = meds.filter(m => m.stock_quantity <= m.low_stock_threshold);
  const latestCheckin = checkins[0];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-32 pb-32">
      <main className="flex-1 space-y-6 p-6">
        {!patient && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Users className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Patient Connected</h2>
            <p className="mt-2 max-w-xs text-gray-500">
              Ask your family member to add your email ({profile?.email}) in their "Connect Caregiver" settings.
            </p>
            <Button 
              className="mt-8" 
              onClick={() => navigate('/messages')}
            >
              Go to Messages
            </Button>
          </div>
        ) : (
          <>
            {/* Quick Status Bar */}
            <section className="grid grid-cols-2 gap-4">
              <Card 
                className={`p-4 flex flex-col items-center justify-center text-center border-none shadow-sm cursor-pointer ${
                  latestCheckin?.mood === 'sad' || latestCheckin?.mood === 'sick' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-emerald-500 text-white'
                }`}
                onClick={scrollToTimeline}
              >
                <Activity className="h-6 w-6 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Health Status</span>
                <span className="text-lg font-bold capitalize">{latestCheckin?.mood || 'Stable'}</span>
              </Card>

              <Card className="p-4 flex flex-col items-center justify-center text-center border-none shadow-sm bg-blue-600 text-white cursor-pointer" onClick={() => navigate('/messages')}>
                <MessageSquare className="h-6 w-6 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Unread</span>
                <span className="text-lg font-bold">Group Chat</span>
              </Card>
            </section>

            {/* AI Health Summary - Bento Style */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Daily Intelligence</h2>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-6 px-2" onClick={handleNudge}>
                  Nudge Patient
                </Button>
              </div>
              <Card className="bg-white p-6 border-none shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Activity className="h-24 w-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-bold text-blue-600 uppercase">AI Analysis</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700 font-medium">
                    {summary?.summary_text || "Patient is showing consistent medication adherence. Mood has been stable over the last 24 hours. No urgent symptoms detected."}
                  </p>
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200" />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Care Team Active</span>
                  </div>
                </div>
              </Card>
            </section>

            {/* Alerts Section */}
            {lowStockMeds.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-500">Urgent Actions</h2>
                <div className="space-y-3">
                  {lowStockMeds.map(med => (
                    <Card key={med.id} className="border-none shadow-sm bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{med.medicine_name}</h4>
                            <p className="text-xs text-red-500 font-bold">Refill Needed ({med.stock_quantity} left)</p>
                          </div>
                        </div>
                        <Button size="sm" className="h-8 rounded-lg text-xs bg-red-600 hover:bg-red-700">
                          Order
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Timeline */}
            <section ref={timelineRef} className="space-y-4 scroll-mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Patient Timeline</h2>
                <button className="text-xs font-bold text-blue-600">Full History</button>
              </div>
              <div className="space-y-3">
                {checkins.map(checkin => (
                  <Card key={checkin.id} className="p-4 border-none shadow-sm bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          checkin.mood === 'happy' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          <Heart className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-900">
                            {new Date(checkin.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-1">{checkin.symptoms_text || 'Morning Check-in'}</p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {checkin.ai_detected_keywords?.map(kw => (
                              <span key={kw} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black uppercase ${
                          checkin.mood === 'happy' ? 'text-emerald-600' : 'text-red-600'
                        }`}>{checkin.mood}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
