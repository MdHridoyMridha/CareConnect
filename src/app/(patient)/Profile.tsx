import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BottomNav } from '../../components/shared/BottomNav';
import { User, Settings, Shield, Bell, LogOut, ChevronRight, Phone, Mail, Globe, Users, RefreshCcw, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSwitchRole = async () => {
    if (!profile) return;
    
    const newRole = profile.role === 'patient' ? 'caregiver' : 'patient';
    setSwitching(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);

      if (error) throw error;
      
      // Refresh profile in context to trigger immediate UI update
      await refreshProfile();
      
      // Navigate to the new dashboard
      navigate(newRole === 'caregiver' ? '/caregiver-dashboard' : '/dashboard');
      setShowConfirm(false);
    } catch (err) {
      console.error('Error switching role:', err);
      alert('Failed to switch role. Please try again.');
      setSwitching(false);
      setShowConfirm(false);
    } finally {
      setSwitching(false);
    }
  };

  const menuItems = [
    { icon: User, label: 'Personal Information', color: 'text-blue-600', bg: 'bg-blue-50' },
    { 
      icon: Users, 
      label: 'Connect Caregiver', 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      onClick: () => navigate('/connect-caregiver'),
      show: profile?.role === 'patient'
    },
    { 
      icon: RefreshCcw, 
      label: `Switch to ${profile?.role === 'patient' ? 'Caregiver' : 'Patient'}`, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      onClick: () => setShowConfirm(true),
      loading: switching
    },
    { icon: Bell, label: 'Notification Settings', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Shield, label: 'Privacy & Security', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Globe, label: 'Language & Timezone', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Settings, label: 'App Settings', color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-32 pb-32">
      <main className="space-y-6 p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm border-b-2 border-gray-100 mb-6">
          <div className="relative mx-auto h-24 w-24">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} 
              alt="Avatar" 
              className="h-full w-full rounded-full border-4 border-white shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-1.5 text-white shadow-sm">
              <Settings className="h-4 w-4" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{profile?.full_name}</h1>
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">{profile?.role}</p>
          
          <div className="mt-6 flex justify-center space-x-8 border-t border-gray-50 pt-6">
            <div className="text-center">
              <span className="block text-lg font-bold text-gray-900">12</span>
              <span className="text-xs text-gray-400">Check-ins</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-gray-900">92%</span>
              <span className="text-xs text-gray-400">Adherence</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-gray-900">3</span>
              <span className="text-xs text-gray-400">Meds</span>
            </div>
          </div>
        </div>
        {/* Contact Info */}
        <Card className="space-y-4 p-5">
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Email Address</p>
              <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Phone Number</p>
              <p className="text-sm font-medium text-gray-900">{profile?.phone || 'Not provided'}</p>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.filter(item => item.show !== false).map((item, i) => (
            <Card 
              key={i} 
              className={`flex items-center justify-between p-4 active:bg-gray-50 ${(item as any).loading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
              onClick={item.onClick}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                  {(item as any).loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </Card>
          ))}
        </div>

        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="w-full border-red-100 py-4 text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !switching && setShowConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Switch Role?</h3>
                <p className="mt-2 text-gray-500">
                  Are you sure you want to switch to the <span className="font-bold text-orange-600">{profile?.role === 'patient' ? 'Caregiver' : 'Patient'}</span> role? 
                  Your dashboard and features will change.
                </p>
                
                <div className="mt-8 flex w-full flex-col space-y-3">
                  <Button 
                    onClick={handleSwitchRole} 
                    isLoading={switching}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Yes, Switch Role
                  </Button>
                  <Button 
                    variant="ghost" 
                    disabled={switching}
                    onClick={() => setShowConfirm(false)}
                    className="w-full text-gray-500"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
