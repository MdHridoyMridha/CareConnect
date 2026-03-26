import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { Card } from '../../components/ui/Card';
import { UserPlus, Search, ArrowLeft, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Profile } from '../../types';

export default function ConnectCaregiver() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedCaregivers, setLinkedCaregivers] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchLinkedCaregivers();
    }
  }, [profile]);

  async function fetchLinkedCaregivers() {
    const { data, error } = await supabase
      .from('caregiver_links')
      .select(`
        id,
        relationship,
        caregiver:profiles!caregiver_id(*)
      `)
      .eq('patient_id', profile?.id);

    if (!error && data) {
      setLinkedCaregivers(data);
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      console.log('Searching for caregiver with email:', email.trim());
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email.trim())
        .eq('role', 'caregiver')
        .neq('id', profile?.id)
        .single();

      if (error) {
        console.warn('Search query error:', error);
        setError('No caregiver found with this email address.');
      } else {
        console.log('Search result found:', data);
        setSearchResult(data);
      }
    } catch (err) {
      console.error('Search catch error:', err);
      setError('An error occurred during search.');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!searchResult || !profile) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('caregiver_links')
        .insert({
          patient_id: profile.id,
          caregiver_id: searchResult.id,
          relationship: 'Family Member'
        });

      if (error) {
        if (error.code === '23505') {
          setError('You are already connected to this caregiver.');
        } else {
          throw error;
        }
      } else {
        setSearchResult(null);
        setEmail('');
        fetchLinkedCaregivers();
      }
    } catch (err) {
      setError('Failed to link caregiver.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    const { error } = await supabase
      .from('caregiver_links')
      .delete()
      .eq('id', linkId);

    if (!error) {
      fetchLinkedCaregivers();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-32 pb-32">
      <main className="flex-1 space-y-8 p-6">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border-b-2 border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Connect Caregiver</h1>
          <p className="text-sm text-gray-500">Link with your care team</p>
        </div>
        {/* Search Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Find a Caregiver</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Enter caregiver's email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
            <Button type="submit" className="w-full" isLoading={loading}>
              Search Caregiver
            </Button>
          </form>

          {error && (
            <div className="flex items-center space-x-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-blue-100 bg-blue-50/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 p-0.5">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${searchResult.full_name}`} 
                        alt="Avatar" 
                        className="h-full w-full rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{searchResult.full_name}</h4>
                      <p className="text-xs text-gray-500">{searchResult.email}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={handleLink} isLoading={loading}>
                    Connect
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </section>

        {/* Linked Caregivers Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Your Caregivers</h2>
          {linkedCaregivers.length > 0 ? (
            <div className="space-y-3">
              {linkedCaregivers.map((link) => (
                <Card key={link.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-100 p-0.5">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${link.caregiver.full_name}`} 
                          alt="Avatar" 
                          className="h-full w-full rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{link.caregiver.full_name}</h4>
                        <p className="text-xs text-gray-500">{link.relationship}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveLink(link.id)}
                      className="rounded-full p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <UserPlus className="h-8 w-8" />
              </div>
              <p className="text-sm text-gray-500">No caregivers connected yet.</p>
              <p className="mt-1 text-xs text-gray-400 px-8">Invite your family members to help monitor your health.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
