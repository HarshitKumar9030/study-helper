"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  showProgress = false 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.1, 1],
            opacity: 1,
          }}
          transition={{ 
            duration: 0.6,
            times: [0, 0.6, 1],
            ease: "easeOut"
          }}
          className="relative mx-auto mb-8"
        >
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-16 h-16 border-2 border-gray-200 border-t-blue-500 rounded-full"
            />
            
            {/* Inner logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
              >
                <Zap className="w-4 h-4 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Study Helper
          </h2>
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </motion.div>

        {/* Progress Bar (optional) */}
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 mx-auto max-w-xs"
          >
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center space-x-1 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 bg-gray-400 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
