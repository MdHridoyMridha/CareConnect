import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

// Auth Screens
import Login from './app/(auth)/Login';
import Signup from './app/(auth)/Signup';
import RoleSelection from './app/(auth)/RoleSelection';
import Onboarding from './app/(auth)/Onboarding';

// Patient Screens
import PatientDashboard from './app/(patient)/Dashboard';
import DailyCheckIn from './app/(patient)/DailyCheckIn';
import MedicationList from './app/(patient)/MedicationList';
import VoiceMessages from './app/(patient)/VoiceMessages';
import Profile from './app/(patient)/Profile';
import ConnectCaregiver from './app/(patient)/ConnectCaregiver';

// Caregiver Screens
import CaregiverDashboard from './app/(caregiver)/Dashboard';

// Shared Components
import { LoadingScreen } from './components/shared/LoadingScreen';

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
        <Router>
          <AuthRoutes />
        </Router>
      </div>
    </AuthProvider>
  );
}

const AuthRoutes = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
          <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </>
      ) : (
        <>
          {/* Role Selection if profile not complete */}
          {!profile?.role ? (
            <Route path="/role-selection" element={<PageTransition><RoleSelection /></PageTransition>} />
          ) : (
            <>
              {/* Patient Routes */}
              {profile.role === 'patient' && (
                <>
                  <Route path="/dashboard" element={<PageTransition><PatientDashboard /></PageTransition>} />
                  <Route path="/check-in" element={<PageTransition><DailyCheckIn /></PageTransition>} />
                  <Route path="/medications" element={<PageTransition><MedicationList /></PageTransition>} />
                  <Route path="/messages" element={<PageTransition><VoiceMessages /></PageTransition>} />
                  <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                  <Route path="/connect-caregiver" element={<PageTransition><ConnectCaregiver /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}

              {/* Caregiver Routes */}
              {profile.role === 'caregiver' && (
                <>
                  <Route path="/caregiver-dashboard" element={<PageTransition><CaregiverDashboard /></PageTransition>} />
                  <Route path="/messages" element={<PageTransition><VoiceMessages /></PageTransition>} />
                  <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/caregiver-dashboard" replace />} />
                </>
              )}
            </>
          )}
          {/* Fallback for role selection */}
          {!profile?.role && <Route path="*" element={<Navigate to="/role-selection" replace />} />}
        </>
      )}
    </Routes>
  );
};
