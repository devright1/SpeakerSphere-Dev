import { 
  speakers, 
  reviews, 
  inquiries, 
  categories,
  videos,
  type Speaker, 
  type InsertSpeaker, 
  type Review, 
  type InsertReview,
  type Inquiry,
  type InsertInquiry,
  type Category,
  type InsertCategory,
  type Video,
  type InsertVideo
} from "@shared/schema";

export interface IStorage {
  // Speakers
  getSpeakers(filters?: {
    category?: string;
    location?: string;
    minRating?: number;
    expertise?: string;
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
  
  // Videos
  getVideosBySpeakerId(speakerId: number): Promise<Video[]>;
  getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoViewCount(videoId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private speakers: Map<number, Speaker>;
  private reviews: Map<number, Review>;
  private inquiries: Map<number, Inquiry>;
  private categories: Map<number, Category>;
  private videos: Map<number, Video>;
  private currentSpeakerId: number;
  private currentReviewId: number;
  private currentInquiryId: number;
  private currentCategoryId: number;
  private currentVideoId: number;

  constructor() {
    this.speakers = new Map();
    this.reviews = new Map();
    this.inquiries = new Map();
    this.categories = new Map();
    this.videos = new Map();
    this.currentSpeakerId = 1;
    this.currentReviewId = 1;
    this.currentInquiryId = 1;
    this.currentCategoryId = 1;
    this.currentVideoId = 1;
    
    this.seedData();
    this.seedVideoData();
  }

  private seedData() {
    // Seed categories
    const categoriesData = [
      { name: "Healthcare Leadership", description: "Medical administration and healthcare system leadership" },
      { name: "Clinical Excellence", description: "Advanced clinical practices and patient care innovations" },
      { name: "Medical Education", description: "Teaching and training in medical fields" },
      { name: "Digital Health", description: "Technology integration in healthcare delivery" },
      { name: "Public Health", description: "Population health and preventive medicine" },
      { name: "Healthcare Innovation", description: "Breakthrough medical technologies and practices" },
    ];

    categoriesData.forEach(cat => {
      const category: Category = { ...cat, id: this.currentCategoryId++, speakerCount: 0 };
      this.categories.set(category.id, category);
    });

    // Seed speakers with Dr. Larry Brecht and Dr. Phil Walton
    const speakersData = [
      {
        name: "Dr. Larry Brecht",
        title: "Prosthodontics & Maxillofacial Prosthodontics",
        bio: "Dr. Lawrence (Larry) E. Brecht, DDS, practices dentistry in New York City, specializing in Prosthodontics and Maxillofacial Prosthodontics. These specialties focus on restoring missing teeth, treating jaw disorders, and providing reconstructive and aesthetic dental care, particularly for patients with complex conditions such as cancer or craniofacial anomalies. Dr. Brecht is a sought-after speaker who combines clinical expertise with practical insights on dental innovation, making complex prosthodontic concepts accessible to diverse audiences.",
        expertise: ["Prosthodontics", "Maxillofacial Prosthodontics", "Dental Implants", "Oral Rehabilitation", "Complex Reconstructions"],
        location: "New York City, NY",
        overallRating: "4.95",
        reviewCount: 84,
        imageUrl: "/attached_assets/1863_FR-1221.jpg",
        verified: true,
        featured: true,
        category: "Clinical Excellence",
        achievements: [
          "Director of Prosthodontics at NYU College of Dentistry",
          "Author of 150+ peer-reviewed publications in prosthodontics",
          "Pioneer of advanced maxillofacial prosthetic techniques",
          "American College of Prosthodontists Excellence Award 2023"
        ],
        lectures: [
          "Advanced Techniques in Maxillofacial Prosthodontics",
          "Digital Workflows in Complex Oral Rehabilitation",
          "Interdisciplinary Approach to Facial Reconstruction",
          "Innovation in Dental Implant Prosthodontics",
          "Teaching Excellence in Prosthodontic Education"
        ],
        eventPhotos: [
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        speakingVideos: [
          "https://example.com/video1",
          "https://example.com/video2"
        ],
        email: "lbrecht@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://drlarrybrecht.com",
        socialMedia: ["linkedin.com/in/drlarrybrecht", "twitter.com/drlarrybrecht"],
        instagramHandle: null,
        languages: ["English"],
        medicalSpecialties: ["Prosthodontics", "Maxillofacial Prosthodontics", "Dental Reconstruction"],
        speakerType: "clinical",
        fee: "6000"
      },
      {
        name: "Dr. Phil Walton",
        title: "Periodontics & Implantology",
        bio: "Dr. Philip M. Walton, DDS, from Toronto, specializes in Periodontics and Implantology. His practice includes conventional periodontal therapy for tooth maintenance, periodontal plastic surgery, advanced regenerative techniques, and implant rehabilitation, with a focus on immediate implant placement and temporization for single, multiple, and full arch reconstruction.",
        expertise: ["Periodontics", "Implantology", "Gum Disease Treatment", "Dental Implants", "Bone Regeneration"],
        location: "Toronto, Canada",
        overallRating: "4.88",
        reviewCount: 67,
        imageUrl: "/attached_assets/1951_DVR-830.jpg",
        verified: true,
        featured: true,
        category: "Healthcare Leadership",
        achievements: [
          "Chief of Emergency Medicine at Toronto General Hospital",
          "Healthcare Quality Innovation Award winner",
          "Published researcher in emergency medicine protocols",
          "International speaker at 50+ medical conferences"
        ],
        lectures: [
          "Optimizing Emergency Department Flow and Efficiency",
          "Crisis Leadership in High-Pressure Medical Environments",
          "Building Resilient Healthcare Teams",
          "Quality Improvement in Emergency Care",
          "The Future of Emergency Medicine Technology"
        ],
        eventPhotos: [
          "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        speakingVideos: [
          "https://example.com/video3",
          "https://example.com/video4"
        ],
        email: "pwalton@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://drphilwalton.com",
        socialMedia: ["linkedin.com/in/drphilwalton", "twitter.com/drphilwalton"],
        instagramHandle: "drphilwalton",
        languages: ["English", "French"],
        medicalSpecialties: ["Emergency Medicine", "Critical Care", "Trauma Surgery"],
        speakerType: "keynote",
        fee: "5000"
      },
      {
        name: "Dr. Will Martin",
        title: "Prosthodontics & Advanced Dental Reconstruction",
        bio: "Dr. William (Will) Martin, DDS, is a prosthodontist practicing in Gainesville, Florida. Specializing in advanced dental reconstruction, implant dentistry, and complex oral rehabilitation, Dr. Martin combines cutting-edge prosthodontic techniques with a patient-centered approach. He is a respected speaker in the dental community, known for his expertise in full-mouth rehabilitation, aesthetic dentistry, and innovative prosthetic solutions for challenging clinical cases.",
        expertise: ["Prosthodontics", "Dental Implants", "Full Mouth Rehabilitation", "Aesthetic Dentistry", "Complex Oral Reconstruction"],
        location: "Gainesville, FL",
        overallRating: "4.82",
        reviewCount: 45,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
        verified: true,
        featured: true,
        category: "Clinical Excellence",
        achievements: [
          "Board Certified Prosthodontist",
          "Fellow of the American College of Prosthodontists",
          "Director of Prosthodontics at University of Florida College of Dentistry",
          "Florida Dental Association Clinical Excellence Award 2023"
        ],
        lectures: [
          "Advanced Implant Prosthodontics: From Planning to Delivery",
          "Full Mouth Rehabilitation: A Systematic Approach",
          "Aesthetic Prosthodontics in the Digital Age",
          "Complex Case Management in Prosthodontic Practice",
          "Innovations in Dental Materials and Techniques"
        ],
        eventPhotos: [
          "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        speakingVideos: [
          "https://example.com/video5",
          "https://example.com/video6"
        ],
        email: "wmartin@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://drwillmartin.com",
        socialMedia: ["linkedin.com/in/drwillmartin", "twitter.com/drwillmartin"],
        instagramHandle: "wmartingator",
        languages: ["English", "Spanish"],
        medicalSpecialties: ["Prosthodontics", "Dental Implantology", "Oral Rehabilitation"],
        speakerType: "clinical",
        fee: "4500"
      }
    ];

    speakersData.forEach(speakerData => {
      const speaker: Speaker = { 
        ...speakerData, 
        id: this.currentSpeakerId++,
        overallRating: speakerData.overallRating,
        reviewCount: speakerData.reviewCount,
        verified: speakerData.verified,
        featured: speakerData.featured
      };
      this.speakers.set(speaker.id, speaker);
    });

    // Seed reviews with detailed healthcare-specific ratings
    const reviewsData = [
      {
        speakerId: 1,
        reviewerName: "Dr. Sarah Mitchell",
        reviewerTitle: "Conference Director",
        reviewerCompany: "American College of Cardiology",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "Dr. Brecht delivered an exceptional presentation on minimally invasive cardiac procedures. His technical expertise combined with clear communication made complex concepts accessible to our diverse audience. The visual aids were professional and enhanced the learning experience.",
        eventType: "Medical Conference",
        eventDate: "2024-01-15",
        verified: true
      },
      {
        speakerId: 2,
        reviewerName: "Dr. Michael Chen",
        reviewerTitle: "Emergency Department Director",
        reviewerCompany: "Vancouver General Hospital",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 4,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Dr. Walton's presentation on emergency department optimization was incredibly valuable. His real-world case studies and practical solutions directly addressed our challenges. Excellent speaker who truly understands healthcare operations.",
        eventType: "Healthcare Leadership Summit",
        eventDate: "2024-02-20",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. Lisa Rodriguez",
        reviewerTitle: "Conference Director",
        reviewerCompany: "Florida Dental Association",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 4,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "Dr. Martin's presentation on advanced implant prosthodontics was outstanding. His case studies and step-by-step approach to complex full-mouth rehabilitations provided practical solutions that our members could immediately implement. Highly recommend for any prosthodontic-focused event.",
        eventType: "Dental Implant Conference",
        eventDate: "2024-03-10",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. James Thompson",
        reviewerTitle: "Chair of Prosthodontics",
        reviewerCompany: "University of Florida College of Dentistry",
        overallRating: 4,
        speakingStyleRating: 4,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 4,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "Dr. Martin brought excellent expertise to our dental education symposium. His presentation on aesthetic prosthodontics was well-structured and evidence-based. Great collaboration throughout the planning process and exceptional clinical insights.",
        eventType: "Dental Education Symposium",
        eventDate: "2024-01-25",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. Amanda Foster",
        reviewerTitle: "Director of Continuing Education",
        reviewerCompany: "American College of Prosthodontists",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 4,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Dr. Martin's session on digital prosthodontics was exceptional. His ability to translate complex technical concepts into practical clinical applications was impressive. The audience of prosthodontists was highly engaged throughout his presentation.",
        eventType: "Prosthodontic Excellence Conference",
        eventDate: "2024-02-14",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. Robert Kim",
        reviewerTitle: "Clinical Director",
        reviewerCompany: "Gainesville Oral Surgery Center",
        overallRating: 4,
        speakingStyleRating: 4,
        podiumPresenceRating: 4,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 4,
        visualDesignRating: 4,
        comment: "Dr. Martin provided valuable insights on interdisciplinary treatment planning for complex prosthodontic cases. His evidence-based approach and practical recommendations were well-received by our surgical and restorative teams. Professional and knowledgeable speaker.",
        eventType: "Interdisciplinary Dental Conference",
        eventDate: "2024-03-05",
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
    expertise?: string;
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
        speakers = speakers.filter(s => parseFloat(s.overallRating || "0") >= filters.minRating!);
      }
      if (filters.expertise) {
        speakers = speakers.filter(s => 
          s.expertise.some(e => e.toLowerCase().includes(filters.expertise!.toLowerCase()))
        );
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        speakers = speakers.filter(s => 
          s.name.toLowerCase().includes(searchTerm) ||
          s.title.toLowerCase().includes(searchTerm) ||
          s.bio.toLowerCase().includes(searchTerm) ||
          s.expertise.some(e => e.toLowerCase().includes(searchTerm)) ||
          s.lectures.some(l => l.toLowerCase().includes(searchTerm))
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
      overallRating: "0.00", 
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
      const totalRating = reviews.reduce((sum, r) => sum + r.overallRating, 0);
      const avgRating = totalRating / reviews.length;
      
      const updatedSpeaker = {
        ...speaker,
        overallRating: avgRating.toFixed(2),
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
      createdAt: new Date(),
      budget: insertInquiry.budget || null
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

  private seedVideoData() {
    // Professional video content for healthcare speakers
    const videoData = [
      {
        speakerId: 1,
        title: "Healthcare Leadership Excellence",
        description: "Professional speaking demonstration showcasing leadership insights in healthcare management.",
        videoUrl: "https://www.youtube.com/embed/ZMByI4s-D-Y",
        thumbnailUrl: "https://img.youtube.com/vi/ZMByI4s-D-Y/maxresdefault.jpg",
        duration: 1200,
        videoType: "demo_reel",
        eventName: "Healthcare Leadership Summit",
        eventDate: "2024-01-15",
        topics: ["Healthcare Leadership", "Management", "Innovation"],
        viewCount: 150,
        featured: true
      },
      {
        speakerId: 2,
        title: "Emergency Medicine Expertise",
        description: "Professional presentation on emergency medicine best practices and crisis management.",
        videoUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
        thumbnailUrl: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
        duration: 900,
        videoType: "keynote",
        eventName: "Emergency Medicine Conference",
        eventDate: "2024-02-10",
        topics: ["Emergency Medicine", "Patient Care", "Medical Education"],
        viewCount: 89,
        featured: true
      }
    ];

    videoData.forEach(videoInfo => {
      const video: Video = { 
        ...videoInfo, 
        id: this.currentVideoId++,
        createdAt: new Date()
      };
      this.videos.set(video.id, video);
    });
  }

  // Video methods
  async getVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(video => video.speakerId === speakerId);
  }

  async getFeaturedVideosBySpeakerId(speakerId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.speakerId === speakerId && video.featured);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const video: Video = { 
      ...insertVideo, 
      id: this.currentVideoId++,
      viewCount: 0,
      createdAt: new Date()
    };
    this.videos.set(video.id, video);
    return video;
  }

  async updateVideoViewCount(videoId: number): Promise<void> {
    const video = this.videos.get(videoId);
    if (video) {
      video.viewCount = (video.viewCount || 0) + 1;
      this.videos.set(videoId, video);
    }
  }
}

export const storage = new MemStorage();