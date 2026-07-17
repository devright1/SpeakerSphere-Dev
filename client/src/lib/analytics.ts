// ============================================
// GOOGLE ANALYTICS - General traffic tracking
// ============================================

declare global {
  interface Window {
    gtag?: (command: string, targetId: string | Date, config?: Record<string, any>) => void;
    dataLayer?: any[];
    GA_MEASUREMENT_ID?: string;
  }
}

export const isGAEnabled = (): boolean => {
  return typeof window.gtag === 'function' && !!window.GA_MEASUREMENT_ID;
};

export const trackGAEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!isGAEnabled()) return;
  window.gtag?.('event', eventName, parameters);
};

export const trackPageView = (path: string, title?: string) => {
  if (!isGAEnabled()) return;
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
};

// ============================================
// INTERNAL DB TRACKING + GA (dual-fire)
// Every function below sends to both our DB
// and Google Analytics simultaneously.
// ============================================

const postToDb = (speakerId: number, eventType: string, metadata?: any) => {
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speakerId, eventType, metadata }),
  }).catch(() => {});
};

export const trackEvent = async (speakerId: number, eventType: string, metadata?: any) => {
  postToDb(speakerId, eventType, metadata);
};

export const trackSpeakerView = (speakerId: number, metadata?: any) => {
  postToDb(speakerId, 'profile_view', metadata);
  trackGAEvent('view_speaker_profile', {
    speaker_id: speakerId,
    source: metadata?.source || 'direct',
  });
};

export const trackEmailClick = (speakerId: number) => {
  postToDb(speakerId, 'email_click');
  trackGAEvent('speaker_email_click', { speaker_id: speakerId });
};

export const trackPhoneClick = (speakerId: number) => {
  postToDb(speakerId, 'phone_click');
  trackGAEvent('speaker_phone_click', { speaker_id: speakerId });
};

export const trackWebsiteClick = (speakerId: number) => {
  postToDb(speakerId, 'website_click');
  trackGAEvent('speaker_website_click', { speaker_id: speakerId });
};

export const trackSocialClick = (speakerId: number, platform: string) => {
  postToDb(speakerId, 'social_click', { platform });
  trackGAEvent('speaker_social_click', {
    speaker_id: speakerId,
    platform,
  });
};

export const trackInquiryClick = (speakerId: number) => {
  postToDb(speakerId, 'inquiry_click');
  trackGAEvent('speaker_inquiry_click', { speaker_id: speakerId });
};

export const trackVideoView = (speakerId: number, videoId?: number) => {
  postToDb(speakerId, 'video_view', { videoId });
  trackGAEvent('video_start', {
    speaker_id: speakerId,
    video_id: videoId,
  });
};

export const trackShare = (speakerId: number, method: string) => {
  postToDb(speakerId, 'share', { method });
  trackGAEvent('share', {
    method,
    content_type: 'speaker_profile',
    content_id: String(speakerId),
  });
};

export const trackSearch = (speakerId: number, query: string) => {
  postToDb(speakerId, 'search_appearance', { query });
};

export const trackSearchClick = (speakerId: number, query: string, position: number) => {
  postToDb(speakerId, 'search_click', { query, position });
  trackGAEvent('select_search_result', {
    speaker_id: speakerId,
    search_term: query,
    list_position: position,
  });
};

export const trackFavorite = (speakerId: number, added: boolean) => {
  const eventType = added ? 'favorite_add' : 'favorite_remove';
  postToDb(speakerId, eventType);
  trackGAEvent(added ? 'add_to_wishlist' : 'remove_from_wishlist', {
    speaker_id: speakerId,
    item_category: 'speaker',
  });
};

export const trackDownload = (speakerId: number, fileName: string) => {
  postToDb(speakerId, 'content_download', { fileName });
  trackGAEvent('file_download', {
    speaker_id: speakerId,
    file_name: fileName,
    link_text: fileName,
  });
};

export const trackEngagementClick = (speakerId: number, element: string) => {
  postToDb(speakerId, 'engagement_click', { elementClicked: element });
  trackGAEvent('engagement_click', {
    speaker_id: speakerId,
    element,
  });
};

// ============================================
// PREDEFINED GA EVENTS for platform actions
// ============================================

export const GA_EVENTS = {
  viewSpeaker: (speakerId: number, speakerName: string) =>
    trackGAEvent('view_speaker', { speaker_id: speakerId, speaker_name: speakerName }),

  contactSpeaker: (speakerId: number, speakerName: string) =>
    trackGAEvent('contact_speaker', { speaker_id: speakerId, speaker_name: speakerName }),

  websiteClick: (speakerId: number, speakerName: string) =>
    trackGAEvent('speaker_website_click', { speaker_id: speakerId, speaker_name: speakerName }),

  socialClick: (speakerId: number, speakerName: string, platform: string) =>
    trackGAEvent('speaker_social_click', { speaker_id: speakerId, speaker_name: speakerName, platform }),

  inquiryClick: (speakerId: number, speakerName: string) =>
    trackGAEvent('speaker_inquiry_click', { speaker_id: speakerId, speaker_name: speakerName }),

  favoriteAdd: (speakerId: number, speakerName: string) =>
    trackGAEvent('add_to_wishlist', { speaker_id: speakerId, speaker_name: speakerName, item_category: 'speaker' }),

  favoriteRemove: (speakerId: number, speakerName: string) =>
    trackGAEvent('remove_from_wishlist', { speaker_id: speakerId, speaker_name: speakerName, item_category: 'speaker' }),

  searchAppearance: (speakerId: number, speakerName: string, query: string, position: number) =>
    trackGAEvent('view_item_list', { speaker_id: speakerId, speaker_name: speakerName, search_term: query, list_position: position }),

  downloadContent: (speakerId: number, speakerName: string, fileName: string) =>
    trackGAEvent('file_download', { speaker_id: speakerId, speaker_name: speakerName, file_name: fileName }),

  search: (searchTerm: string, resultsCount: number) =>
    trackGAEvent('search', { search_term: searchTerm, results_count: resultsCount }),

  filterByCategory: (categoryName: string) =>
    trackGAEvent('filter_category', { category: categoryName }),

  filterByLocation: (location: string) =>
    trackGAEvent('filter_location', { location }),

  startApplication: () =>
    trackGAEvent('begin_application', { event_category: 'speaker_application' }),

  submitApplication: (success: boolean) =>
    trackGAEvent(success ? 'application_submitted' : 'application_failed', { event_category: 'speaker_application' }),

  login: (method: string) =>
    trackGAEvent('login', { method }),

  logout: () =>
    trackGAEvent('logout'),

  viewPricing: () =>
    trackGAEvent('view_pricing', { event_category: 'subscription' }),

  initiateCheckout: (tier: string, interval: string, price: number) =>
    trackGAEvent('begin_checkout', { event_category: 'subscription', tier, billing_interval: interval, value: price, currency: 'USD' }),

  completePurchase: (tier: string, interval: string, price: number) =>
    trackGAEvent('purchase', { event_category: 'subscription', tier, billing_interval: interval, value: price, currency: 'USD' }),

  cancelSubscription: (tier: string) =>
    trackGAEvent('cancel_subscription', { event_category: 'subscription', tier }),

  share: (method: string, contentType: string, contentId?: string) =>
    trackGAEvent('share', { method, content_type: contentType, content_id: contentId }),

  playVideo: (videoId: number, speakerId: number) =>
    trackGAEvent('video_start', { video_id: videoId, speaker_id: speakerId }),

  submitReview: (speakerId: number, rating: number) =>
    trackGAEvent('submit_review', { speaker_id: speakerId, rating }),

  clickCategory: (categoryName: string) =>
    trackGAEvent('select_category', { category: categoryName }),

  clickSpeakerCard: (speakerId: number, listPosition: number) =>
    trackGAEvent('select_speaker', { speaker_id: speakerId, list_position: listPosition }),
};
