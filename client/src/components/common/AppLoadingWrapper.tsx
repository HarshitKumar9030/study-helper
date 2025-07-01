"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "./LoadingScreen";

interface AppLoadingWrapperProps {
  children: React.ReactNode;
}

const AppLoadingWrapper: React.FC<AppLoadingWrapperProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Simple timeout-based loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return <div className="min-h-screen bg-white dark:bg-neutral-950" />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 0.95,
              transition: { duration: 0.5, ease: "easeInOut" }
            }}
          >
            <LoadingScreen message="Initializing your study environment..." />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" }
            }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppLoadingWrapper;
