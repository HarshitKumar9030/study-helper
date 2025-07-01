"use client";

import AIChat from '@/components/ai/AIChat';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatPage = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div className="h-[calc(100vh-4rem)] w-full bg-white dark:bg-neutral-950" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      className="h-[calc(100vh-4rem)] w-full flex"
    >
      <AIChat />
    </motion.div>
  );
};

export default ChatPage;