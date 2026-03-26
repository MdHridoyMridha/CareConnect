import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BottomNav } from '../../components/shared/BottomNav';
import { Mic, Bell, Pill, MessageCircle, ChevronRight, AlertCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Medication } from '../../types';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const [caregiver, setCaregiver] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      fetchMeds();
      fetchCaregiver();
    }
  }, [profile]);

  async function fetchCaregiver() {
    const { data } = await supabase
      .from('caregiver_links')
      .select('caregiver:profiles!caregiver_id(*)')
      .eq('patient_id', profile?.id)
      .limit(1)
      .single();
    if (data) setCaregiver(data.caregiver);
  }

  async function fetchMeds() {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', profile?.id)
      .limit(3);

    if (!error && data) {
      setMeds(data);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-32 pb-32">
      <main className="flex-1 space-y-6 p-6">
        {/* Daily Check-in Promo */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/check-in')}
        >
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Daily Health Check-in</h3>
                <p className="text-sm text-blue-100">Talk to your assistant and log your mood.</p>
                <Button variant="secondary" size="sm" className="mt-2 bg-white text-blue-600 hover:bg-blue-50">
                  Start Now
                </Button>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Mic className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Caregiver Connection Prompt */}
        {!caregiver && !loading && (
          <Card className="border-indigo-100 bg-indigo-50/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Connect a Caregiver</h4>
                  <p className="text-[10px] text-gray-500">Share your health status with family.</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 text-xs font-bold text-indigo-600"
                onClick={() => navigate('/connect-caregiver')}
              >
                Connect
              </Button>
            </div>
          </Card>
        )}

        {/* Medication Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Meds</h2>
            <button 
              onClick={() => navigate('/medications')}
              className="text-sm font-medium text-blue-600"
            >
              View All
            </button>
          </div>

          {meds.length > 0 ? (
            <div className="space-y-3">
              {meds.map((med) => (
                <Card key={med.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{med.medicine_name}</h4>
                      <p className="text-xs text-gray-500">{med.dosage} • {med.reminder_time}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                      Mark Taken
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                <Pill className="h-6 w-6" />
              </div>
              <p className="text-sm text-gray-500">No medications scheduled for today.</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-blue-600"
                onClick={() => navigate('/medications')}
              >
                Add Medication
              </Button>
            </Card>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center justify-center space-y-2 p-6 text-center" onClick={() => navigate('/messages')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">Messages</span>
          </Card>
          <Card className="flex flex-col items-center justify-center space-y-2 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold">Emergency</span>
          </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
