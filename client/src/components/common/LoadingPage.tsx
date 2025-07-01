"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";

interface LoadingPageProps {
  message?: string;
}

export default function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="relative mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center"
          >
            <Zap className="h-8 w-8 text-white" />
          </motion.div>
          
          {/* Sparkles around logo */}
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 12, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute inset-0 -m-4"
          >
            <Sparkles className="absolute top-0 left-0 h-4 w-4 text-blue-500 opacity-60" />
            <Sparkles className="absolute top-0 right-0 h-3 w-3 text-purple-500 opacity-40" />
            <Sparkles className="absolute bottom-0 left-0 h-3 w-3 text-pink-500 opacity-50" />
            <Sparkles className="absolute bottom-0 right-0 h-4 w-4 text-blue-400 opacity-70" />
          </motion.div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-2"
        >
          <h3 className="text-lg font-semibold text-foreground">Study Helper</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-48 mx-auto"
        >
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                repeatType: "loop"
              }}
              className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </motion.div>

        {/* Floating Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex justify-center space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="h-2 w-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// Global Loading Component for Page Transitions
export function GlobalLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex items-center justify-center"
    >
      <LoadingPage message="Getting things ready..." />
    </motion.div>
  );
}

// Skeleton Loading Components
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className={`h-12 bg-muted rounded-2xl animate-pulse ${i % 2 === 0 ? 'w-3/4 ml-auto' : 'w-2/3'}`} />
            <div className="h-3 bg-muted/50 rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
