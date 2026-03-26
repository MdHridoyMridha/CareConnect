import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Pill, MessageSquare, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'motion/react';

export const BottomNav = () => {
  const { profile } = useAuth();
  const dashboardPath = profile?.role === 'caregiver' ? '/caregiver-dashboard' : '/dashboard';

  const navItems = [
    { icon: Home, label: 'Home', path: dashboardPath },
    { icon: Pill, label: 'Meds', path: '/medications' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 flex h-16 items-center justify-around rounded-2xl border-b-4 border-gray-200 bg-white px-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'relative flex h-12 flex-1 flex-col items-center justify-center space-y-0.5 rounded-xl transition-all duration-200 active:translate-y-[2px]',
              isActive ? 'text-blue-600' : 'text-gray-400 hover:bg-gray-50'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-blue-50/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                />
              )}
              <item.icon className={cn("h-5 w-5 relative z-10", isActive && "drop-shadow-[0_2px_2px_rgba(37,99,235,0.2)]")} />
              <span className="relative z-10 text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
