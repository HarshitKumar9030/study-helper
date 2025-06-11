'use client';

import React from 'react';
import { Circle, Waves, Zap } from 'lucide-react';

interface ListeningAnimationProps {
  animation: 'pulse' | 'wave' | 'ripple' | 'glow';
  theme?: string;
}

export function ListeningAnimation({ animation, theme }: ListeningAnimationProps) {
  const isDark = theme === 'dark';
  const baseClass = "w-16 h-16 mx-auto rounded-full flex items-center justify-center";
  
  switch (animation) {
    case 'wave':
      return (
        <div className={`${baseClass} ${isDark ? 'bg-blue-900' : 'bg-blue-100'} relative overflow-hidden`}>
          <div className={`absolute inset-0 ${isDark ? 'bg-blue-400' : 'bg-blue-500'} opacity-20 animate-ping rounded-full`}></div>
          <div className={`absolute inset-2 ${isDark ? 'bg-blue-400' : 'bg-blue-500'} opacity-40 animate-ping rounded-full`} style={{ animationDelay: '0.5s' }}></div>
          <Waves className={`h-8 w-8 z-10 ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-bounce`} />
        </div>
      );
    case 'ripple':
      return (
        <div className={`${baseClass} ${isDark ? 'bg-purple-900' : 'bg-purple-100'} relative`}>
          <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-10"></div>
          <div className="absolute inset-1 rounded-full animate-ping bg-current opacity-20" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute inset-2 rounded-full animate-ping bg-current opacity-30" style={{ animationDelay: '0.6s' }}></div>
          <Circle className={`h-8 w-8 z-10 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
      );
    case 'glow':
      return (
        <div className={`${baseClass} ${isDark ? 'bg-green-900' : 'bg-green-100'} relative`}>
          <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'} opacity-30 animate-pulse`}></div>
          <div className={`absolute inset-0 rounded-full ${isDark ? 'shadow-green-400/50' : 'shadow-green-500/50'} shadow-lg animate-pulse`}></div>
          <Zap className={`h-8 w-8 z-10 ${isDark ? 'text-green-400' : 'text-green-600'} animate-pulse`} />
        </div>
      );
    default: // pulse
      return (
        <div className={`${baseClass} ${isDark ? 'bg-red-900' : 'bg-red-100'} ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          <Circle className="h-8 w-8 animate-pulse" />
        </div>
      );
  }
}
