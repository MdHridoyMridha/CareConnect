import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { User, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function RoleSelection() {
  const [role, setRole] = useState<'patient' | 'caregiver' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!role || !user) return;
    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          role,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User'
        });

      if (upsertError) throw upsertError;
      
      // Refresh global auth state
      await refreshProfile();
      
      // Redirect based on role
      if (role === 'patient') {
        navigate('/dashboard');
      } else {
        navigate('/caregiver-dashboard');
      }
    } catch (err: any) {
      console.error('Error setting role:', err);
      setError(err.message || 'Failed to save your selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white p-8">
      <div className="mt-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Who are you?</h1>
        <p className="mt-2 text-gray-500">Select your role to personalize your experience</p>
      </div>

      <div className="mt-12 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setRole('patient')}
        >
          <Card className={`relative cursor-pointer border-2 p-6 transition-all ${
            role === 'patient' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100'
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                role === 'patient' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <User className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Patient / Primary User</h3>
                <p className="text-sm text-gray-500">I want to track my health and medication.</p>
              </div>
              {role === 'patient' && (
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setRole('caregiver')}
        >
          <Card className={`relative cursor-pointer border-2 p-6 transition-all ${
            role === 'caregiver' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100'
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                role === 'caregiver' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Users className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Caregiver / Family</h3>
                <p className="text-sm text-gray-500">I want to support and monitor a loved one.</p>
              </div>
              {role === 'caregiver' && (
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="mt-auto pt-12">
        <Button 
          disabled={!role} 
          onClick={handleConfirm} 
          className="w-full py-4 text-lg"
          isLoading={loading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
