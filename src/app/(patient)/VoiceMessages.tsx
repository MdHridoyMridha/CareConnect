import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BottomNav } from '../../components/shared/BottomNav';
import { Mic, Square, Play, Pause, ArrowLeft, Send, MessageCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceMessage, Profile } from '../../types/index';

export default function VoiceMessages() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [linkedUser, setLinkedUser] = useState<Profile | null>(null);

  // Web Speech API for STT
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (profile) {
      console.log('Current profile:', profile);
      fetchMessages();
      fetchLinkedUser();

      // Real-time subscription for group chat
      const channel = supabase
        .channel('voice_messages_group')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'voice_messages',
          },
          (payload) => {
            console.log('New message received via real-time:', payload);
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

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
    }
  }, []);

  async function fetchLinkedUser() {
    if (!profile) return;
    
    try {
      if (profile.role === 'patient') {
        const { data, error } = await supabase
          .from('caregiver_links')
          .select('caregiver:profiles!caregiver_id(*)')
          .eq('patient_id', profile.id);
        
        if (error) throw error;
        if (data && data.length > 0) {
          setLinkedUser(data[0].caregiver as any);
        }
      } else {
        const { data, error } = await supabase
          .from('caregiver_links')
          .select('patient:profiles!patient_id(*)')
          .eq('caregiver_id', profile.id);
        
        if (error) throw error;
        if (data && data.length > 0) {
          // Use the first linked patient for now
          setLinkedUser(data[0].patient as any);
        }
      }
    } catch (err) {
      console.error('Error fetching linked user:', err);
    }
  }

  async function fetchMessages() {
    if (!profile) return;
    
    try {
      let patientId = profile.id;
      
      // If caregiver, we need the patient's ID to see the group chat
      if (profile.role === 'caregiver') {
        const { data: links, error: linkError } = await supabase
          .from('caregiver_links')
          .select('patient_id')
          .eq('caregiver_id', profile.id);
        
        if (linkError) throw linkError;
        if (!links || links.length === 0) {
          console.error('Caregiver not linked to any patient');
          setLoading(false);
          return;
        }
        patientId = links[0].patient_id;
      }

      console.log('Fetching messages for patientId:', patientId);

      const { data, error } = await supabase
        .from('voice_messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url, role)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(data as any);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const handleSendMessage = async () => {
    const isVoice = !!transcript && !textInput;
    const messageContent = textInput || transcript;
    if (!profile || !messageContent) return;
    
    let patientId = profile.id;
    if (profile.role === 'caregiver') {
      if (!linkedUser) {
        alert('No linked patient found. You cannot send messages.');
        return;
      }
      patientId = linkedUser.id;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('voice_messages')
        .insert({
          sender_id: profile.id,
          patient_id: patientId,
          audio_url: isVoice ? 'https://example.com/audio.mp3' : '', // Use empty string for text-only
          transcript: messageContent,
        });

      if (error) throw error;
      setTranscript('');
      setTextInput('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-32 pb-32">
      <main className="flex-1 space-y-4 p-6">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border-b-2 border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Care Group Chat</h1>
          {linkedUser && (
            <p className="text-sm text-blue-600 font-medium">
              {profile?.role === 'patient' ? 'Your Care Team' : `Monitoring: ${linkedUser.full_name}`}
            </p>
          )}
        </div>
        {!linkedUser && !loading && (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-600">
            You need to be connected to a {profile?.role === 'patient' ? 'caregiver' : 'patient'} to use the group chat.
          </div>
        )}
        {loading && !messages.length ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : messages.length > 0 ? (
          <div className="flex flex-col space-y-6">
            {messages.map((msg: any) => {
              const isMe = msg.sender_id === profile?.id;
              const isVoice = msg.audio_url && msg.audio_url !== '';
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
                    isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'
                  }`}>
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt="Avatar" className="h-full w-full rounded-full" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] space-y-1`}>
                    <div className={`flex items-center space-x-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {isMe ? 'You' : msg.sender?.full_name || 'User'}
                      </span>
                      {msg.sender?.role && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter ${
                          msg.sender.role === 'patient' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {msg.sender.role}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-300">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`relative overflow-hidden rounded-2xl p-4 shadow-sm ${
                        isMe 
                          ? msg.sender?.role === 'patient'
                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-none'
                            : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                          : msg.sender?.role === 'patient'
                            ? 'bg-emerald-50 text-emerald-900 rounded-bl-none border border-emerald-100'
                            : 'bg-blue-50 text-blue-900 rounded-bl-none border border-blue-100'
                      }`}
                    >
                      {isVoice ? (
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              isMe ? 'text-white/60' : msg.sender?.role === 'patient' ? 'text-emerald-600' : 'text-blue-600'
                            }`}>
                              Voice Message
                            </span>
                            {playingId === msg.id && (
                              <div className="flex items-center space-x-0.5">
                                {[1, 2, 3, 4].map(i => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                    className={`w-0.5 rounded-full ${isMe ? 'bg-white' : msg.sender?.role === 'patient' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => setPlayingId(playingId === msg.id ? null : msg.id)}
                              className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all active:scale-95 ${
                                isMe 
                                  ? 'bg-white ' + (msg.sender?.role === 'patient' ? 'text-emerald-600' : 'text-blue-600')
                                  : (msg.sender?.role === 'patient' ? 'bg-emerald-600' : 'bg-blue-600') + ' text-white'
                              } ${playingId === msg.id ? 'ring-4 ring-white/30' : ''}`}
                            >
                              {playingId === msg.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                            </button>
                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                              isMe ? 'bg-white/20' : msg.sender?.role === 'patient' ? 'bg-emerald-100' : 'bg-blue-100'
                            }`}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: playingId === msg.id ? '100%' : '0%' }}
                                transition={{ duration: 5, ease: "linear" }}
                                className={`h-full ${isMe ? 'bg-white' : msg.sender?.role === 'patient' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                              />
                            </div>
                          </div>
                          {msg.transcript && (
                            <div className={`mt-2 rounded-lg p-2 text-xs leading-relaxed ${
                              isMe ? 'bg-white/10 text-white/90' : 'bg-white/50 text-gray-600 italic'
                            }`}>
                              "{msg.transcript}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm font-medium leading-relaxed">
                          {msg.transcript}
                        </p>
                      )}
                      
                      {/* Decorative background element */}
                      <div className={`absolute -right-4 -top-4 h-12 w-12 rounded-full opacity-10 ${isMe ? 'bg-white' : 'bg-current'}`} />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Messages</h3>
            <p className="mt-2 text-gray-500">Send a message to your care team.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-20 left-0 right-0 z-20 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col space-y-3">
          {isRecording && (
            <div className="flex items-center space-x-2 text-red-600 px-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
              <span className="text-xs font-medium">Recording: {transcript}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Type a message..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="h-12 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleRecording}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-colors ${
                isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </motion.button>

            {(textInput || transcript) && !isRecording && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSendMessage}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
