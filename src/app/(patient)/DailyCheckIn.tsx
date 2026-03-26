import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Mic, Square, ArrowLeft, Heart, Smile, Meh, Frown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeDailyCheckin } from '../../services/ai';

const MOODS = [
  { id: 'great', label: 'Great', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'good', label: 'Good', icon: Heart, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'okay', label: 'Okay', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'low', label: 'Low', icon: Frown, color: 'text-red-500', bg: 'bg-red-50' },
];

export default function DailyCheckIn() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  // Web Speech API for STT
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const handleSubmit = async () => {
    if (!profile || !mood) return;
    setLoading(true);

    try {
      // Use AI for keyword detection
      const detected = await analyzeDailyCheckin(transcript, mood);

      const { error } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: profile.id,
          mood,
          symptoms_text: transcript,
          ai_detected_keywords: detected,
        });

      if (error) throw error;
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Error submitting check-in:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pt-24">
      {/* Header */}
      <header className="flex items-center space-x-4 p-6">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Daily Check-in</h1>
      </header>

      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">How are you feeling?</h2>
                <p className="mt-2 text-gray-500">Select the mood that best describes you today.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {MOODS.map((m) => (
                  <motion.div
                    key={m.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMood(m.id)}
                  >
                    <Card className={`flex flex-col items-center justify-center space-y-3 border-2 p-6 transition-all ${
                      mood === m.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100'
                    }`}>
                      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${m.bg} ${m.color}`}>
                        <m.icon className="h-8 w-8" />
                      </div>
                      <span className="font-bold text-gray-900">{m.label}</span>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Button 
                disabled={!mood} 
                onClick={() => setStep(2)} 
                className="w-full py-4 text-lg"
              >
                Next
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Tell me more...</h2>
                <p className="mt-2 text-gray-500">Any symptoms, pain, or stress today? You can speak or type.</p>
              </div>

              <div className="relative">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="I'm feeling a bit tired today..."
                  className="h-48 w-full rounded-2xl border border-gray-200 bg-gray-50 p-6 text-lg focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
                
                <div className="absolute bottom-4 right-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleRecording}
                    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors ${
                      isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </motion.button>
                </div>
              </div>

              {isRecording && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.4s]" />
                  <span className="text-sm font-medium">Listening...</span>
                </div>
              )}

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} isLoading={loading} className="flex-[2]">
                  Complete Check-in
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
