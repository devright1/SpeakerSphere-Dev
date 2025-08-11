import { useCallback, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface TrackingData {
  interactionType: string;
  elementClicked?: string;
  metadata?: any;
  timeOnPage?: number;
  scrollDepth?: number;
}

export function useSpeakerTracking(speakerId: number) {
  const startTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const hasTrackedView = useRef<boolean>(false);

  // Track page scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.pageYOffset;
      const scrollPercentage = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
      
      if (scrollPercentage > maxScrollDepth.current) {
        maxScrollDepth.current = scrollPercentage;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track initial profile view
  useEffect(() => {
    if (!hasTrackedView.current && speakerId > 0) {
      hasTrackedView.current = true;
      trackInteraction('profile_view', 'page_load');
    }
  }, [speakerId]);

  // Main tracking function
  const trackInteraction = useCallback(async (
    interactionType: string,
    elementClicked?: string,
    metadata?: any
  ) => {
    // Only track if we have a valid speaker ID
    if (!speakerId || speakerId === 0) return;

    try {
      const trackingData: TrackingData = {
        interactionType,
        elementClicked,
        metadata,
        timeOnPage: Math.floor((Date.now() - startTime.current) / 1000),
        scrollDepth: maxScrollDepth.current
      };

      await apiRequest('POST', `/api/speakers/${speakerId}/track`, trackingData);
    } catch (error) {
      // Silent fail for tracking - don't disrupt user experience
      console.debug('Tracking failed:', error);
    }
  }, [speakerId]);

  // Specific tracking functions for different interactions
  const trackVideoPlay = useCallback((videoId: string, videoTitle?: string) => {
    trackInteraction('video_play', 'video_player', { 
      videoId, 
      videoTitle,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackVideoComplete = useCallback((videoId: string, duration: number) => {
    trackInteraction('video_complete', 'video_player', { 
      videoId, 
      duration,
      watchTime: duration 
    });
  }, [trackInteraction]);

  const trackContactFormOpen = useCallback(() => {
    trackInteraction('contact_form_open', 'contact_button');
  }, [trackInteraction]);

  const trackInquirySubmit = useCallback((inquiryData?: any) => {
    trackInteraction('inquiry_submit', 'inquiry_form', inquiryData);
  }, [trackInteraction]);

  const trackFavoriteAdd = useCallback(() => {
    trackInteraction('favorite_add', 'heart_button');
  }, [trackInteraction]);

  const trackFavoriteRemove = useCallback(() => {
    trackInteraction('favorite_remove', 'heart_button');
  }, [trackInteraction]);

  const trackSocialClick = useCallback((platform: string, url?: string) => {
    trackInteraction('social_click', `${platform}_link`, { 
      platform, 
      url,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackPhoneClick = useCallback((phoneNumber?: string) => {
    trackInteraction('phone_click', 'phone_button', { 
      phoneNumber,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackEmailClick = useCallback((email?: string) => {
    trackInteraction('email_click', 'email_button', { 
      email,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackWebsiteClick = useCallback((website?: string) => {
    trackInteraction('website_click', 'website_button', { 
      website,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackBioExpand = useCallback(() => {
    trackInteraction('bio_expand', 'bio_toggle');
  }, [trackInteraction]);

  const trackReviewSectionView = useCallback(() => {
    trackInteraction('review_section_view', 'reviews_tab');
  }, [trackInteraction]);

  const trackTagClick = useCallback((tagName: string, tagType?: string) => {
    trackInteraction('tag_click', 'expertise_tag', { 
      tagName, 
      tagType,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackPhotoView = useCallback((photoUrl?: string) => {
    trackInteraction('photo_view', 'profile_photo', { 
      photoUrl,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackShareClick = useCallback((shareMethod?: string) => {
    trackInteraction('share_click', 'share_button', { 
      shareMethod,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackTabSwitch = useCallback((tabName: string) => {
    trackInteraction('tab_switch', `${tabName}_tab`, { 
      tabName,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackDownloadBio = useCallback(() => {
    trackInteraction('download_bio', 'download_button');
  }, [trackInteraction]);

  const trackAchievementClick = useCallback((achievement: string) => {
    trackInteraction('achievement_click', 'achievement_badge', { 
      achievement,
      timestamp: Date.now() 
    });
  }, [trackInteraction]);

  const trackProfileView = useCallback(() => {
    trackInteraction('profile_view', 'page_load');
  }, [trackInteraction]);

  return {
    trackInteraction,
    trackProfileView,
    trackVideoPlay,
    trackVideoComplete,
    trackContactFormOpen,
    trackInquirySubmit,
    trackFavoriteAdd,
    trackFavoriteRemove,
    trackSocialClick,
    trackPhoneClick,
    trackEmailClick,
    trackWebsiteClick,
    trackBioExpand,
    trackReviewSectionView,
    trackTagClick,
    trackPhotoView,
    trackShareClick,
    trackTabSwitch,
    trackDownloadBio,
    trackAchievementClick
  };
}