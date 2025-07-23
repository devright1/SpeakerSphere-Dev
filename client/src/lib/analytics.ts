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