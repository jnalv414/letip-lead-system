'use client';

import { useSocketStatus } from '@/providers/socket-provider';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionStatus() {
  const { isConnected, connectionError } = useSocketStatus();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (connectionError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  return (
    <div className="flex items-center space-x-2">
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal shadow-3d-sm border border-orange/30"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`WebSocket connection ${isConnected ? 'established' : 'lost'}`}
      >
        <motion.div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-orange' : 'bg-red-500'
          }`}
          animate={
            isConnected
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }
              : {
                  scale: [1, 1.1, 1],
                  opacity: [1, 0.5, 1],
                }
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        />
        <motion.span
          className={`text-sm font-medium font-sans ${
            isConnected ? 'text-white' : 'text-red-200'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="sr-only">
            {isConnected ? 'Connected to server' : 'Disconnected from server'}
          </span>
          <span aria-hidden="true">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {showError && connectionError && (
          <motion.div
            className="ml-4 text-sm text-red-200 bg-charcoal-light px-4 py-2 rounded-lg shadow-3d-sm border border-red-500/30 font-sans"
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <span className="sr-only">Connection error: </span>
            {connectionError.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}