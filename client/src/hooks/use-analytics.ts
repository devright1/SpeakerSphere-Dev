import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Track page views for analytics
export const usePageTracking = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined') {
      // You can add Google Analytics or other tracking here
      console.log(`Page view: ${location}`);
    }
  }, [location]);
};