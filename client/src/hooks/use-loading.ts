"use client";

import { useState, useEffect } from "react";

interface UseLoadingOptions {
  minLoadingTime?: number; // Minimum loading time in ms
  initialLoading?: boolean;
}

export const useLoading = (options: UseLoadingOptions = {}) => {
  const { minLoadingTime = 1000, initialLoading = true } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (initialLoading) {
      setLoadingStartTime(Date.now());
    }
  }, [initialLoading]);

  const stopLoading = async () => {
    if (loadingStartTime) {
      const elapsed = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    }
    
    setIsLoading(false);
  };

  const startLoading = () => {
    setLoadingStartTime(Date.now());
    setIsLoading(true);
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
};

// For page-level loading
export const usePageLoading = () => {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    // Simulate initial page load
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return isPageLoading;
};
