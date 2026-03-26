import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Form';
import { BottomNav } from '../../components/shared/BottomNav';
import { Pill, Plus, ArrowLeft, Trash2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Medication } from '../../types';

export default function MedicationList() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({
    medicine_name: '',
    dosage: '',
    frequency: 'Daily',
    reminder_time: '08:00',
    stock_quantity: 30,
    low_stock_threshold: 5,
  });

  useEffect(() => {
    if (profile) {
      fetchMeds();
    }
  }, [profile]);

  async function fetchMeds() {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMeds(data);
    }
    setLoading(false);
  }

  async function handleAddMed(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('medications')
        .insert({
          ...newMed,
          user_id: profile.id,
          start_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;
      setShowAdd(false);
      fetchMeds();
    } catch (err) {
      console.error('Error adding med:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMed(id: string) {
    if (!confirm('Are you sure you want to delete this medication?')) return;
    
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMeds();
    } catch (err) {
      console.error('Error deleting med:', err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-32 pb-32">
      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          <Button size="icon" onClick={() => setShowAdd(true)} className="h-12 w-12 rounded-2xl shadow-lg active:translate-y-1 transition-all">
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        {loading && !meds.length ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : meds.length > 0 ? (
          meds.map((med) => (
            <Card key={med.id} className="relative overflow-hidden p-5">
              {med.stock_quantity <= med.low_stock_threshold && (
                <div className="absolute top-0 right-0 rounded-bl-xl bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
                  Low Stock
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900">{med.medicine_name}</h3>
                    <p className="text-sm text-gray-500">{med.dosage} • {med.frequency}</p>
                    <div className="flex items-center space-x-3 pt-2">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="mr-1 h-3 w-3" />
                        {med.reminder_time}
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {med.stock_quantity} left
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteMed(med.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
              <Pill className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Medications Yet</h3>
            <p className="mt-2 text-gray-500">Add your first medicine to get reminders.</p>
            <Button onClick={() => setShowAdd(true)} className="mt-6">
              Add Medication
            </Button>
          </div>
        )}
      </main>

      {/* Add Medication Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add Medicine</h2>
                <button onClick={() => setShowAdd(false)} className="text-gray-400">
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddMed} className="space-y-4">
                <Input
                  label="Medicine Name"
                  placeholder="e.g. Paracetamol"
                  value={newMed.medicine_name}
                  onChange={(e) => setNewMed({ ...newMed, medicine_name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Dosage"
                    placeholder="e.g. 500mg"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    required
                  />
                  <Select
                    label="Frequency"
                    options={[
                      { label: 'Daily', value: 'Daily' },
                      { label: 'Twice Daily', value: 'Twice Daily' },
                      { label: 'Weekly', value: 'Weekly' },
                    ]}
                    value={newMed.frequency}
                    onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Reminder Time"
                    type="time"
                    value={newMed.reminder_time}
                    onChange={(e) => setNewMed({ ...newMed, reminder_time: e.target.value })}
                    required
                  />
                  <Input
                    label="Stock Quantity"
                    type="number"
                    value={newMed.stock_quantity}
                    onChange={(e) => setNewMed({ ...newMed, stock_quantity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full py-4 text-lg" isLoading={loading}>
                  Save Medication
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
