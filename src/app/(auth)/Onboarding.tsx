import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/Button';
import { Heart, Mic, Bell, ShieldCheck, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: "Welcome to CareConnect",
    description: "Your AI-powered health assistant for personalized care and emotional connectivity.",
    icon: <Heart className="h-12 w-12 text-red-500" />,
    color: "bg-red-50",
  },
  {
    title: "Voice Health Check-ins",
    description: "Simply speak to your assistant daily. We track your mood, symptoms, and well-being.",
    icon: <Mic className="h-12 w-12 text-blue-500" />,
    color: "bg-blue-50",
  },
  {
    title: "Medication Reminders",
    description: "Never miss a dose. Get timely alerts and track your stock levels automatically.",
    icon: <Bell className="h-12 w-12 text-amber-500" />,
    color: "bg-amber-50",
  },
  {
    title: "Caregiver Connectivity",
    description: "Stay connected with family. Share daily summaries and voice messages securely.",
    icon: <ShieldCheck className="h-12 w-12 text-emerald-500" />,
    color: "bg-emerald-50",
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center"
          >
            <div className={`mb-8 flex h-24 w-24 items-center justify-center rounded-3xl ${slides[currentSlide].color} shadow-sm`}>
              {slides[currentSlide].icon}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{slides[currentSlide].title}</h1>
            <p className="mt-4 max-w-xs text-lg text-gray-500">{slides[currentSlide].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8">
        <div className="mb-8 flex justify-center space-x-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        <Button onClick={next} className="w-full py-4 text-lg" size="lg">
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
        
        <button 
          onClick={() => navigate('/login')}
          className="mt-4 w-full text-sm font-medium text-gray-400 hover:text-gray-600"
        >
          Skip to Login
        </button>
      </div>
    </div>
  );
}
