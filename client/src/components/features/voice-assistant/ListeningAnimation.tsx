'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ListeningAnimationProps {
  isListening: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'wave' | 'pulse' | 'ripple' | 'bars';
  className?: string;
}

export function ListeningAnimation({ 
  isListening, 
  size = 'md', 
  variant = 'wave',
  className 
}: ListeningAnimationProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const WaveAnimation = () => (
    <div className={cn(
      'relative flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {/* Outer ripple */}
      <div className={cn(
        'absolute inset-0 rounded-full border-2 border-primary/30',
        isListening && 'animate-ping'
      )} />
      
      {/* Middle ripple */}
      <div className={cn(
        'absolute inset-2 rounded-full border-2 border-primary/50',
        isListening && 'animate-pulse'
      )} />
      
      {/* Center dot */}
      <div className={cn(
        'w-4 h-4 rounded-full bg-primary transition-all duration-300',
        isListening ? 'scale-110 shadow-lg shadow-primary/50' : 'scale-100'
      )} />
    </div>
  );

  const PulseAnimation = () => (
    <div className={cn(
      'relative flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {/* Animated background */}
      <div className={cn(
        'absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 transition-all duration-500',
        isListening ? 'scale-110 opacity-100' : 'scale-100 opacity-60'
      )} />
      
      {/* Center circle */}
      <div className={cn(
        'w-6 h-6 rounded-full bg-primary relative z-10 transition-all duration-300',
        isListening ? 'animate-pulse shadow-lg shadow-primary/50' : ''
      )} />
    </div>
  );

  const RippleAnimation = () => (
    <div className={cn(
      'relative flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {/* Multiple ripples */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'absolute inset-0 rounded-full border border-primary/40',
            isListening && 'animate-ping'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}
      
      {/* Center */}
      <div className={cn(
        'w-4 h-4 rounded-full bg-primary relative z-10 transition-all duration-300',
        isListening ? 'scale-125' : 'scale-100'
      )} />
    </div>
  );

  const BarsAnimation = () => (
    <div className={cn(
      'flex items-end justify-center gap-1',
      sizeClasses[size],
      className
    )}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary rounded-full transition-all duration-200',
            {
              'w-1': size === 'sm',
              'w-1.5': size === 'md', 
              'w-2': size === 'lg',
              'w-3': size === 'xl'
            }
          )}
          style={{
            height: isListening 
              ? `${20 + Math.sin((Date.now() / 200) + i) * 15}%`
              : '20%',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  switch (variant) {
    case 'pulse':
      return <PulseAnimation />;
    case 'ripple':
      return <RippleAnimation />;
    case 'bars':
      return <BarsAnimation />;
    default:
      return <WaveAnimation />;
  }
}
