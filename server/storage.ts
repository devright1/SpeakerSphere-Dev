import { 
  speakers, 
  reviews, 
  inquiries, 
  categories,
  type Speaker, 
  type InsertSpeaker, 
  type Review, 
  type InsertReview,
  type Inquiry,
  type InsertInquiry,
  type Category,
  type InsertCategory
} from "@shared/schema";

export interface IStorage {
  // Speakers
  getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    maxFee?: number;
    minFee?: number;
    expertise?: string;
    availability?: string;
    search?: string;
  }): Promise<Speaker[]>;
  getSpeaker(id: number): Promise<Speaker | undefined>;
  createSpeaker(speaker: InsertSpeaker): Promise<Speaker>;
  updateSpeaker(id: number, speaker: Partial<InsertSpeaker>): Promise<Speaker | undefined>;
  getFeaturedSpeakers(): Promise<Speaker[]>;
  
  // Reviews
  getReviewsBySpeakerId(speakerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
}

export class MemStorage implements IStorage {
  private speakers: Map<number, Speaker>;
  private reviews: Map<number, Review>;
  private inquiries: Map<number, Inquiry>;
  private categories: Map<number, Category>;
  private currentSpeakerId: number;
  private currentReviewId: number;
  private currentInquiryId: number;
  private currentCategoryId: number;

  constructor() {
    this.speakers = new Map();
    this.reviews = new Map();
    this.inquiries = new Map();
    this.categories = new Map();
    this.currentSpeakerId = 1;
    this.currentReviewId = 1;
    this.currentInquiryId = 1;
    this.currentCategoryId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categoriesData = [
      { name: "Keynote Speakers", description: "Inspirational and thought-provoking main stage presentations" },
      { name: "Technology", description: "Digital transformation, AI, cybersecurity, and innovation" },
      { name: "Leadership", description: "Executive leadership, team building, and organizational development" },
      { name: "Healthcare", description: "Medical innovation, patient care, and healthcare transformation" },
      { name: "Motivational", description: "Personal development, overcoming challenges, and achievement" },
      { name: "Business Strategy", description: "Strategic planning, market analysis, and business growth" },
    ];

    categoriesData.forEach(cat => {
      const category: Category = { ...cat, id: this.currentCategoryId++, speakerCount: 0 };
      this.categories.set(category.id, category);
    });

    // Seed speakers
    const speakersData = [
      {
        name: "Dr. Sarah Chen",
        title: "Technology Innovation & Digital Transformation",
        bio: "Former CTO at Microsoft, now helping organizations navigate digital disruption with practical strategies and proven frameworks. Dr. Chen has over 15 years of experience leading technology teams and driving digital transformation initiatives across Fortune 500 companies.",
        expertise: ["Digital Transformation", "AI & Machine Learning", "Cybersecurity", "Innovation Strategy"],
        location: "San Francisco, CA",
        fee: "15000.00",
        rating: "4.90",
        reviewCount: 127,
        imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        verified: true,
        featured: true,
        category: "Technology",
        achievements: ["Former CTO at Microsoft", "Author of 'Digital Future'", "TEDx Speaker", "MIT Technology Review 35 Under 35"],
        topics: ["AI in Business", "Digital Strategy", "Tech Leadership", "Innovation Culture"],
        availability: "available",
        email: "sarah.chen@speakerconnect.com",
        phone: "+1-555-0101",
        website: "https://sarahchen.com",
        socialMedia: ["linkedin.com/in/sarahchen", "twitter.com/sarahchen"],
        languages: ["English", "Mandarin"],
        travelWillingness: "international",
        speakerType: "keynote"
      },
      {
        name: "Marcus Thompson",
        title: "Leadership & Organizational Excellence",
        bio: "Former Navy SEAL and Fortune 100 executive specializing in high-performance team building and crisis leadership. Marcus brings unique insights from military and corporate leadership to help organizations excel under pressure.",
        expertise: ["Leadership Development", "Team Building", "Crisis Management", "Organizational Culture"],
        location: "New York, NY",
        fee: "12000.00",
        rating: "5.00",
        reviewCount: 89,
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        verified: true,
        featured: true,
        category: "Leadership",
        achievements: ["Former Navy SEAL", "Fortune 100 Executive", "Best-selling Author", "Leadership Institute Faculty"],
        topics: ["High-Performance Teams", "Leadership Under Pressure", "Organizational Resilience", "Change Management"],
        availability: "available",
        email: "marcus.thompson@speakerconnect.com",
        phone: "+1-555-0102",
        website: "https://marcusthompson.com",
        socialMedia: ["linkedin.com/in/marcusthompson"],
        languages: ["English"],
        travelWillingness: "national",
        speakerType: "keynote"
      },
      {
        name: "Dr. Elena Rodriguez",
        title: "Healthcare Innovation & Future Medicine",
        bio: "Renowned surgeon and medical researcher sharing insights on healthcare transformation and patient-centered innovation. Dr. Rodriguez has pioneered several breakthrough medical procedures and led digital health initiatives.",
        expertise: ["Healthcare Innovation", "Medical Technology", "Patient Care", "Digital Health"],
        location: "Boston, MA",
        fee: "18000.00",
        rating: "4.80",
        reviewCount: 156,
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        verified: true,
        featured: true,
        category: "Healthcare",
        achievements: ["Harvard Medical School Faculty", "Medical Innovation Award", "Published Researcher", "Healthcare Technology Pioneer"],
        topics: ["Future of Medicine", "Digital Health", "Patient Experience", "Medical Innovation"],
        availability: "limited",
        email: "elena.rodriguez@speakerconnect.com",
        phone: "+1-555-0103",
        website: "https://elenarodriguez.com",
        socialMedia: ["linkedin.com/in/elenarodriguez", "twitter.com/drelena"],
        languages: ["English", "Spanish"],
        travelWillingness: "international",
        speakerType: "expert"
      },
      {
        name: "James Mitchell",
        title: "Strategic Business Transformation",
        bio: "Former McKinsey partner specializing in digital transformation and change management for Fortune 500 companies. James has led over 100 transformation projects across various industries.",
        expertise: ["Business Strategy", "Digital Transformation", "Change Management", "Organizational Development"],
        location: "Chicago, IL",
        fee: "14000.00",
        rating: "4.90",
        reviewCount: 73,
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        verified: true,
        featured: false,
        category: "Business Strategy",
        achievements: ["Former McKinsey Partner", "Business Transformation Expert", "Strategy Consultant", "Executive Coach"],
        topics: ["Strategic Planning", "Digital Strategy", "Change Leadership", "Business Innovation"],
        availability: "available",
        email: "james.mitchell@speakerconnect.com",
        phone: "+1-555-0104",
        website: "https://jamesmitchell.com",
        socialMedia: ["linkedin.com/in/jamesmitchell"],
        languages: ["English"],
        travelWillingness: "national",
        speakerType: "keynote"
      },
      {
        name: "Rachel Park",
        title: "AI & Machine Learning Innovation",
        bio: "Former Google AI researcher, now helping organizations implement practical AI solutions and navigate ethical considerations. Rachel has published extensively on AI ethics and practical implementation.",
        expertise: ["Artificial Intelligence", "Machine Learning", "AI Ethics", "Technology Implementation"],
        location: "Seattle, WA",
        fee: "16500.00",
        rating: "5.00",
        reviewCount: 91,
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        verified: true,
        featured: false,
        category: "Technology",
        achievements: ["Former Google AI Researcher", "AI Ethics Expert", "Published Author", "Technology Advisor"],
        topics: ["AI in Business", "Machine Learning Applications", "AI Ethics", "Technology Strategy"],
        availability: "available",
        email: "rachel.park@speakerconnect.com",
        phone: "+1-555-0105",
        website: "https://rachelpark.com",
        socialMedia: ["linkedin.com/in/rachelpark", "twitter.com/rachelai"],
        languages: ["English", "Korean"],
        travelWillingness: "international",
        speakerType: "expert"
      }
    ];

    speakersData.forEach(speakerData => {
      const speaker: Speaker = { 
        ...speakerData, 
        id: this.currentSpeakerId++,
        rating: speakerData.rating,
        fee: speakerData.fee
      };
      this.speakers.set(speaker.id, speaker);
    });

    // Seed reviews
    const reviewsData = [
      {
        speakerId: 1,
        reviewerName: "Jennifer Walsh",
        reviewerTitle: "Event Director",
        reviewerCompany: "TechCorp",
        rating: 5,
        comment: "Dr. Chen delivered an exceptional keynote that perfectly captured our audience. Her insights on digital transformation were both practical and inspiring.",
        eventType: "Corporate Conference",
        eventDate: "2024-01-15",
        verified: true
      },
      {
        speakerId: 2,
        reviewerName: "Michael Chen",
        reviewerTitle: "Conference Manager",
        reviewerCompany: "HealthSync",
        rating: 5,
        comment: "Marcus brought incredible energy and actionable insights to our leadership summit. The feedback from attendees was overwhelmingly positive.",
        eventType: "Leadership Summit",
        eventDate: "2024-02-20",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Sarah Johnson",
        reviewerTitle: "VP Events",
        reviewerCompany: "GlobalTech",
        rating: 5,
        comment: "Dr. Rodriguez's presentation on the future of healthcare was both informative and engaging. Exactly what we needed for our medical conference.",
        eventType: "Medical Conference",
        eventDate: "2024-03-10",
        verified: true
      }
    ];

    reviewsData.forEach(reviewData => {
      const review: Review = { 
        ...reviewData, 
        id: this.currentReviewId++,
        createdAt: new Date()
      };
      this.reviews.set(review.id, review);
    });
  }

  async getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    maxFee?: number;
    minFee?: number;
    expertise?: string;
    availability?: string;
    search?: string;
  }): Promise<Speaker[]> {
    let speakers = Array.from(this.speakers.values());

    if (filters) {
      if (filters.category) {
        speakers = speakers.filter(s => s.category === filters.category);
      }
      if (filters.location) {
        speakers = speakers.filter(s => s.location.toLowerCase().includes(filters.location!.toLowerCase()));
      }
      if (filters.minRating) {
        speakers = speakers.filter(s => parseFloat(s.rating || "0") >= filters.minRating!);
      }
      if (filters.maxFee) {
        speakers = speakers.filter(s => parseFloat(s.fee) <= filters.maxFee!);
      }
      if (filters.minFee) {
        speakers = speakers.filter(s => parseFloat(s.fee) >= filters.minFee!);
      }
      if (filters.expertise) {
        speakers = speakers.filter(s => 
          s.expertise.some(e => e.toLowerCase().includes(filters.expertise!.toLowerCase()))
        );
      }
      if (filters.availability) {
        speakers = speakers.filter(s => s.availability === filters.availability);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        speakers = speakers.filter(s => 
          s.name.toLowerCase().includes(searchTerm) ||
          s.title.toLowerCase().includes(searchTerm) ||
          s.bio.toLowerCase().includes(searchTerm) ||
          s.expertise.some(e => e.toLowerCase().includes(searchTerm)) ||
          s.topics.some(t => t.toLowerCase().includes(searchTerm))
        );
      }
    }

    return speakers;
  }

  async getSpeaker(id: number): Promise<Speaker | undefined> {
    return this.speakers.get(id);
  }

  async createSpeaker(insertSpeaker: InsertSpeaker): Promise<Speaker> {
    const id = this.currentSpeakerId++;
    const speaker: Speaker = { 
      ...insertSpeaker, 
      id, 
      rating: "0.00", 
      reviewCount: 0 
    };
    this.speakers.set(id, speaker);
    return speaker;
  }

  async updateSpeaker(id: number, updates: Partial<InsertSpeaker>): Promise<Speaker | undefined> {
    const speaker = this.speakers.get(id);
    if (!speaker) return undefined;
    
    const updatedSpeaker = { ...speaker, ...updates };
    this.speakers.set(id, updatedSpeaker);
    return updatedSpeaker;
  }

  async getFeaturedSpeakers(): Promise<Speaker[]> {
    return Array.from(this.speakers.values()).filter(s => s.featured);
  }

  async getReviewsBySpeakerId(speakerId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(r => r.speakerId === speakerId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { 
      ...insertReview, 
      id, 
      verified: false, 
      createdAt: new Date() 
    };
    this.reviews.set(id, review);

    // Update speaker rating and review count
    const speaker = this.speakers.get(insertReview.speakerId);
    if (speaker) {
      const reviews = await this.getReviewsBySpeakerId(insertReview.speakerId);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;
      
      const updatedSpeaker = {
        ...speaker,
        rating: avgRating.toFixed(2),
        reviewCount: reviews.length
      };
      this.speakers.set(speaker.id, updatedSpeaker);
    }

    return review;
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.currentInquiryId++;
    const inquiry: Inquiry = { 
      ...insertInquiry, 
      id, 
      status: "pending", 
      createdAt: new Date() 
    };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }

  async getInquiriesBySpeakerId(speakerId: number): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(i => i.speakerId === speakerId);
  }

  async getCategories(): Promise<Category[]> {
    const categories = Array.from(this.categories.values());
    
    // Update speaker counts
    for (const category of categories) {
      const speakers = await this.getSpeakers({ category: category.name });
      category.speakerCount = speakers.length;
    }
    
    return categories;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      ...insertCategory, 
      id, 
      speakerCount: 0 
    };
    this.categories.set(id, category);
    return category;
  }
}

export const storage = new MemStorage();
