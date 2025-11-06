// ============================================
// CUSTOM ANALYTICS - Speaker-specific tracking
// ============================================

// Analytics tracking utility for real visitor data
export const trackEvent = async (speakerId: number, eventType: string, metadata?: any) => {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        speakerId,
        eventType,
        metadata,
      }),
    });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
};

// Track different types of interactions
export const trackSpeakerView = (speakerId: number, metadata?: any) => {
  trackEvent(speakerId, 'profile_view', metadata);
};

export const trackEmailClick = (speakerId: number) => {
  trackEvent(speakerId, 'email_click');
};

export const trackPhoneClick = (speakerId: number) => {
  trackEvent(speakerId, 'phone_click');
};

export const trackWebsiteClick = (speakerId: number) => {
  trackEvent(speakerId, 'website_click');
};

export const trackSocialClick = (speakerId: number, platform: string) => {
  trackEvent(speakerId, 'social_click', { platform });
};

export const trackInquiryClick = (speakerId: number) => {
  trackEvent(speakerId, 'inquiry_click');
};

export const trackVideoView = (speakerId: number, videoId?: number) => {
  trackEvent(speakerId, 'video_view', { videoId });
};

export const trackShare = (speakerId: number, method: string) => {
  trackEvent(speakerId, 'share', { method });
};

export const trackSearch = (speakerId: number, query: string) => {
  trackEvent(speakerId, 'search_appearance', { query });
};

export const trackSearchClick = (speakerId: number, query: string, position: number) => {
  trackEvent(speakerId, 'search_click', { query, position });
};

// ============================================
// GOOGLE ANALYTICS - General traffic tracking
// ============================================

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
    GA_MEASUREMENT_ID?: string;
  }
}

// Check if GA is available
export const isGAEnabled = (): boolean => {
  return !!(
    window.gtag &&
    window.GA_MEASUREMENT_ID &&
    window.GA_MEASUREMENT_ID !== '%VITE_GA_MEASUREMENT_ID%'
  );
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (!isGAEnabled()) return;

  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
};

// Track custom events to GA
export const trackGAEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (!isGAEnabled()) return;

  window.gtag?.('event', eventName, parameters);
};

// Predefined GA event trackers for common actions
export const GA_EVENTS = {
  // Speaker interactions
  viewSpeaker: (speakerId: number, speakerName: string) => {
    trackGAEvent('view_speaker', {
      speaker_id: speakerId,
      speaker_name: speakerName,
    });
  },

  contactSpeaker: (speakerId: number, speakerName: string) => {
    trackGAEvent('contact_speaker', {
      speaker_id: speakerId,
      speaker_name: speakerName,
    });
  },

  // Search and filtering
  search: (searchTerm: string, resultsCount: number) => {
    trackGAEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  },

  filterByCategory: (categoryName: string) => {
    trackGAEvent('filter_category', {
      category: categoryName,
    });
  },

  filterByLocation: (location: string) => {
    trackGAEvent('filter_location', {
      location: location,
    });
  },

  // Speaker applications
  startApplication: () => {
    trackGAEvent('begin_application', {
      event_category: 'speaker_application',
    });
  },

  submitApplication: (success: boolean) => {
    trackGAEvent(success ? 'application_submitted' : 'application_failed', {
      event_category: 'speaker_application',
    });
  },

  // Authentication
  login: (method: string) => {
    trackGAEvent('login', {
      method: method,
    });
  },

  logout: () => {
    trackGAEvent('logout');
  },

  // Subscriptions
  viewPricing: () => {
    trackGAEvent('view_pricing', {
      event_category: 'subscription',
    });
  },

  initiateCheckout: (tier: string, interval: string, price: number) => {
    trackGAEvent('begin_checkout', {
      event_category: 'subscription',
      tier: tier,
      billing_interval: interval,
      value: price,
      currency: 'USD',
    });
  },

  completePurchase: (tier: string, interval: string, price: number) => {
    trackGAEvent('purchase', {
      event_category: 'subscription',
      tier: tier,
      billing_interval: interval,
      value: price,
      currency: 'USD',
    });
  },

  cancelSubscription: (tier: string) => {
    trackGAEvent('cancel_subscription', {
      event_category: 'subscription',
      tier: tier,
    });
  },

  // Social sharing
  share: (method: string, contentType: string, contentId?: string) => {
    trackGAEvent('share', {
      method: method,
      content_type: contentType,
      content_id: contentId,
    });
  },

  // Video interactions
  playVideo: (videoId: number, speakerId: number) => {
    trackGAEvent('video_play', {
      video_id: videoId,
      speaker_id: speakerId,
    });
  },

  // Reviews
  submitReview: (speakerId: number, rating: number) => {
    trackGAEvent('submit_review', {
      speaker_id: speakerId,
      rating: rating,
    });
  },

  // Navigation
  clickCategory: (categoryName: string) => {
    trackGAEvent('select_category', {
      category: categoryName,
    });
  },

  clickSpeakerCard: (speakerId: number, listPosition: number) => {
    trackGAEvent('select_speaker', {
      speaker_id: speakerId,
      list_position: listPosition,
    });
  },
};