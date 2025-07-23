import { eq, sql, and, gte, lte, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { 
  speakerAnalytics, 
  dailyAnalytics, 
  clickEvents, 
  demandMetrics,
  speakers,
  inquiries,
  reviews
} from "@shared/schema";

// Analytics service functions
export class AnalyticsService {
  
  // Track a click event
  static async trackClick(
    speakerId: number, 
    eventType: string, 
    metadata?: any,
    userAgent?: string,
    ipAddress?: string,
    referrer?: string,
    sessionId?: string,
    userId?: string
  ) {
    try {
      // Insert click event
      await db.insert(clickEvents).values({
        speakerId,
        eventType,
        userAgent,
        ipAddress,
        referrer,
        sessionId,
        userId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      // Update speaker analytics
      await this.updateSpeakerAnalytics(speakerId, eventType);
      
      // Update daily analytics
      await this.updateDailyAnalytics(speakerId, eventType);
      
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  // Update speaker analytics counters
  static async updateSpeakerAnalytics(speakerId: number, eventType: string) {
    const fieldMap: Record<string, string> = {
      'profile_view': 'profileViews',
      'email_click': 'emailClicks',
      'phone_click': 'phoneClicks',
      'website_click': 'websiteClicks',
      'social_click': 'socialClicks',
      'inquiry_click': 'inquiryClicks',
      'video_view': 'videoViews',
      'share': 'shareCount',
      'favorite': 'favoriteCount',
      'search_appearance': 'searchAppearances',
      'search_click': 'searchClicks',
    };

    const field = fieldMap[eventType];
    if (!field) return;

    // Get or create speaker analytics record
    let analytics = await db.select().from(speakerAnalytics)
      .where(eq(speakerAnalytics.speakerId, speakerId))
      .limit(1);

    if (analytics.length === 0) {
      // Create new analytics record
      const insertData: any = { speakerId };
      insertData[field] = 1;
      await db.insert(speakerAnalytics).values(insertData);
    } else {
      // Update existing record
      const updateData: any = {
        lastUpdated: new Date(),
      };
      updateData[field] = sql`${speakerAnalytics[field as keyof typeof speakerAnalytics]} + 1`;
      
      await db.update(speakerAnalytics)
        .set(updateData)
        .where(eq(speakerAnalytics.speakerId, speakerId));
    }
  }

  // Update daily analytics snapshots
  static async updateDailyAnalytics(speakerId: number, eventType: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const fieldMap: Record<string, string> = {
      'profile_view': 'profileViews',
      'email_click': 'emailClicks',
      'phone_click': 'phoneClicks',
      'website_click': 'websiteClicks',
      'social_click': 'socialClicks',
      'inquiry_click': 'inquiryClicks',
      'video_view': 'videoViews',
      'share': 'shareCount',
      'favorite': 'favoriteCount',
      'search_appearance': 'searchAppearances',
      'search_click': 'searchClicks',
    };

    const field = fieldMap[eventType];
    if (!field) return;

    // Get or create daily analytics record
    let daily = await db.select().from(dailyAnalytics)
      .where(and(
        eq(dailyAnalytics.speakerId, speakerId),
        eq(dailyAnalytics.date, today)
      ))
      .limit(1);

    if (daily.length === 0) {
      // Create new daily record
      const insertData: any = { speakerId, date: today };
      insertData[field] = 1;
      await db.insert(dailyAnalytics).values(insertData);
    } else {
      // Update existing record
      const updateData: any = {};
      updateData[field] = sql`${dailyAnalytics[field as keyof typeof dailyAnalytics]} + 1`;
      
      await db.update(dailyAnalytics)
        .set(updateData)
        .where(and(
          eq(dailyAnalytics.speakerId, speakerId),
          eq(dailyAnalytics.date, today)
        ));
    }
  }

  // Get speaker analytics data
  static async getSpeakerAnalytics(speakerId: number) {
    const analytics = await db.select().from(speakerAnalytics)
      .where(eq(speakerAnalytics.speakerId, speakerId))
      .limit(1);

    return analytics[0] || {
      speakerId,
      profileViews: 0,
      emailClicks: 0,
      phoneClicks: 0,
      websiteClicks: 0,
      socialClicks: 0,
      inquiryClicks: 0,
      videoViews: 0,
      shareCount: 0,
      favoriteCount: 0,
      searchAppearances: 0,
      searchClicks: 0,
    };
  }

  // Get top performing speakers
  static async getTopPerformers(limit = 10, metric = 'profileViews') {
    const orderByColumn = metric === 'profileViews' ? speakerAnalytics.profileViews :
                         metric === 'emailClicks' ? speakerAnalytics.emailClicks :
                         metric === 'phoneClicks' ? speakerAnalytics.phoneClicks :
                         metric === 'websiteClicks' ? speakerAnalytics.websiteClicks :
                         metric === 'socialClicks' ? speakerAnalytics.socialClicks :
                         metric === 'inquiryClicks' ? speakerAnalytics.inquiryClicks :
                         speakerAnalytics.profileViews;

    const results = await db.select({
      speakerId: speakerAnalytics.speakerId,
      name: speakers.name,
      profileViews: speakerAnalytics.profileViews,
      emailClicks: speakerAnalytics.emailClicks,
      phoneClicks: speakerAnalytics.phoneClicks,
      websiteClicks: speakerAnalytics.websiteClicks,
      socialClicks: speakerAnalytics.socialClicks,
      inquiryClicks: speakerAnalytics.inquiryClicks,
      totalClicks: sql<number>`
        COALESCE(${speakerAnalytics.emailClicks}, 0) + 
        COALESCE(${speakerAnalytics.phoneClicks}, 0) + 
        COALESCE(${speakerAnalytics.websiteClicks}, 0) + 
        COALESCE(${speakerAnalytics.socialClicks}, 0) + 
        COALESCE(${speakerAnalytics.inquiryClicks}, 0)
      `,
    })
    .from(speakerAnalytics)
    .innerJoin(speakers, eq(speakers.id, speakerAnalytics.speakerId))
    .orderBy(desc(orderByColumn))
    .limit(limit);

    return results;
  }

  // Get analytics trends over time
  static async getAnalyticsTrends(speakerId: number, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const trends = await db.select().from(dailyAnalytics)
      .where(and(
        eq(dailyAnalytics.speakerId, speakerId),
        gte(dailyAnalytics.date, startDateStr)
      ))
      .orderBy(asc(dailyAnalytics.date));

    return trends;
  }

  // Calculate performance score
  static async calculatePerformanceScore(speakerId: number) {
    const analytics = await this.getSpeakerAnalytics(speakerId);
    const speaker = await db.select().from(speakers)
      .where(eq(speakers.id, speakerId))
      .limit(1);

    if (!speaker[0]) return 0;

    const speakerData = speaker[0];
    
    // Calculate weighted performance score (0-100)
    const weights = {
      profileViews: 0.2,
      engagement: 0.3, // clicks / views
      inquiries: 0.25,
      rating: 0.15,
      reviews: 0.1,
    };

    const totalClicks = (analytics.emailClicks || 0) + (analytics.phoneClicks || 0) + 
                       (analytics.websiteClicks || 0) + (analytics.socialClicks || 0) + 
                       (analytics.inquiryClicks || 0);
    
    const profileViews = analytics.profileViews || 0;
    const engagementRate = profileViews > 0 ? (totalClicks / profileViews) * 100 : 0;

    // Normalize values to 0-100 scale
    const normalizedViews = Math.min((profileViews / 1000) * 100, 100);
    const normalizedEngagement = Math.min(engagementRate, 100);
    const normalizedInquiries = Math.min(((analytics.inquiryClicks || 0) / 10) * 100, 100);
    const normalizedRating = parseFloat(speakerData.overallRating || "0") * 20; // 0-5 to 0-100
    const normalizedReviews = Math.min(((speakerData.reviewCount || 0) / 50) * 100, 100);

    const score = (
      normalizedViews * weights.profileViews +
      normalizedEngagement * weights.engagement +
      normalizedInquiries * weights.inquiries +
      normalizedRating * weights.rating +
      normalizedReviews * weights.reviews
    );

    return Math.round(score);
  }

  // Get demand forecast
  static async getDemandForecast(speakerId: number) {
    // Get recent inquiry patterns
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentInquiries = await db.select().from(inquiries)
      .where(and(
        eq(inquiries.speakerId, speakerId),
        gte(inquiries.createdAt, last30Days)
      ));

    const inquiryVolume = recentInquiries.length;
    const analytics = await this.getSpeakerAnalytics(speakerId);
    
    // Calculate inquiry rate (inquiries per 100 views)
    const profileViews = analytics.profileViews || 0;
    const inquiryRate = profileViews > 0 ? (inquiryVolume / profileViews) * 100 : 0;

    // Analyze event types and locations
    const eventTypes = recentInquiries.map(i => i.eventType);
    const locations = recentInquiries.map(i => i.eventLocation);
    
    const topEventTypes = this.getTopFrequent(eventTypes, 3);
    const topLocations = this.getTopFrequent(locations, 3);

    // Calculate trend direction
    const last60Days = new Date();
    last60Days.setDate(last60Days.getDate() - 60);
    
    const olderInquiries = await db.select().from(inquiries)
      .where(and(
        eq(inquiries.speakerId, speakerId),
        gte(inquiries.createdAt, last60Days),
        lte(inquiries.createdAt, last30Days)
      ));

    const previousVolume = olderInquiries.length;
    let trendDirection = 'stable';
    
    if (inquiryVolume > previousVolume * 1.2) {
      trendDirection = 'up';
    } else if (inquiryVolume < previousVolume * 0.8) {
      trendDirection = 'down';
    }

    // Calculate demand score (0-100)
    const demandScore = Math.min(
      (inquiryVolume * 10) + (inquiryRate * 20) + 
      (profileViews / 10), 100
    );

    return {
      inquiryVolume,
      inquiryRate: Math.round(inquiryRate * 100) / 100,
      topEventTypes,
      topLocations,
      trendDirection,
      demandScore: Math.round(demandScore),
      forecastPeriod: '30 days',
    };
  }

  // Get comprehensive analytics dashboard data
  static async getDashboardData() {
    // Get total system stats
    const totalSpeakers = await db.select({ count: sql<number>`count(*)` })
      .from(speakers);
    
    const totalAnalytics = await db.select({
      totalViews: sql<number>`sum(${speakerAnalytics.profileViews})`,
      totalClicks: sql<number>`sum(
        ${speakerAnalytics.emailClicks} + 
        ${speakerAnalytics.phoneClicks} + 
        ${speakerAnalytics.websiteClicks} + 
        ${speakerAnalytics.socialClicks} + 
        ${speakerAnalytics.inquiryClicks}
      )`,
      totalInquiries: sql<number>`sum(${speakerAnalytics.inquiryClicks})`,
    }).from(speakerAnalytics);

    const topPerformers = await this.getTopPerformers(5);
    
    return {
      overview: {
        totalSpeakers: totalSpeakers[0]?.count || 0,
        totalViews: totalAnalytics[0]?.totalViews || 0,
        totalClicks: totalAnalytics[0]?.totalClicks || 0,
        totalInquiries: totalAnalytics[0]?.totalInquiries || 0,
      },
      topPerformers,
    };
  }

  // Utility function to get most frequent items
  private static getTopFrequent(items: string[], limit: number): string[] {
    const frequency: Record<string, number> = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }
}