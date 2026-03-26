import { motion } from 'motion/react';

export const LoadingScreen = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-900">CareConnect</h2>
      <p className="mt-2 text-gray-500">Personalized Healthcare & Connectivity</p>
      
      <div className="mt-8 flex space-x-2">
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          className="h-2 w-2 rounded-full bg-blue-600" 
        />
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          className="h-2 w-2 rounded-full bg-blue-600" 
        />
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          className="h-2 w-2 rounded-full bg-blue-600" 
        />
      </div>
    </div>
  );
};
