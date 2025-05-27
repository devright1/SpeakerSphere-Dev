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
      { name: "Digital Dentistry", description: "CAD/CAM, 3D printing, and digital workflow solutions" },
      { name: "Prosthodontics", description: "Restorative dentistry and prosthetic rehabilitation" },
      { name: "Esthetic Dentistry", description: "Cosmetic procedures and smile design" },
      { name: "Orthodontics", description: "Teeth straightening and bite correction" },
      { name: "Implant Dentistry", description: "Dental implants and osseointegration" },
      { name: "Surgical Pathways", description: "Surgical techniques and treatment planning" },
      { name: "TMJ", description: "Temporomandibular joint disorders and treatment" },
      { name: "Periodontics", description: "Gum disease treatment and periodontal therapy" },
      { name: "Oral Surgery", description: "Surgical procedures in the oral cavity" },
      { name: "Maxillofacial Surgery", description: "Complex facial and jaw surgical procedures" },
      { name: "Dental Leadership", description: "Practice management and dental team leadership" },
      { name: "Team Development", description: "Staff training and dental team building" },
      { name: "Business Management", description: "Dental practice operations and business growth" },
      { name: "AI in Dentistry", description: "Artificial intelligence applications in dental practice" },
      { name: "Social Media", description: "Digital marketing and social media for dental practices" },
      { name: "Marketing Strategies", description: "Patient acquisition and practice marketing" },
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
        title: "Prosthodontics & Implant Dentistry",
        bio: "Dr. Will Martin, DMD, MS, FACP, is a Clinical Professor in the Department of Oral and Maxillofacial Surgery at the University of Florida's College of Dentistry and serves as Director of the Center for Implant Dentistry. Board-certified in Prosthodontics and a Diplomate of the American Board of Prosthodontics, Dr. Martin is internationally recognized for his expertise in implant dentistry, esthetic dentistry, and digital workflows. He is one of the original creators of the ITI's Esthetic Risk Assessment and has co-authored influential textbooks including ITI Treatment Guides.",
        expertise: ["Prosthodontics", "Implant Dentistry", "Esthetic Dentistry", "Digital Dentistry", "Implant Biomechanics", "Interdisciplinary Treatment Planning"],
        location: "Gainesville, FL",
        overallRating: "4.92",
        reviewCount: 58,
        imageUrl: "/attached_assets/01667_PHS-319.jpg",
        verified: true,
        featured: true,
        category: "Clinical Excellence",
        achievements: [
          "DMD, MS, FACP - University of Florida College of Dentistry",
          "Clinical Professor & Director of Center for Implant Dentistry at UF",
          "Diplomate, American Board of Prosthodontics",
          "Co-creator of ITI's Esthetic Risk Assessment",
          "Co-author of ITI Treatment Guides Vol. 1 and 10"
        ],
        lectures: [
          "Esthetic Risk Assessment in Implant Dentistry",
          "Digital Workflows in Implant Treatment Planning",
          "Implant Biomechanics and Loading Protocols",
          "Interdisciplinary Treatment Planning for Complex Cases",
          "Advanced Prosthodontic Techniques in Esthetic Dentistry"
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
        website: "https://dental.ufl.edu",
        socialMedia: ["linkedin.com/in/drwillmartin", "twitter.com/drwillmartin"],
        instagramHandle: "wmartingator",
        languages: ["English", "Spanish"],
        medicalSpecialties: ["Prosthodontics", "Implant Dentistry", "Esthetic Dentistry"],
        speakerType: "academic",
        fee: "7000"
      },
      {
        name: "Marisa Notturno",
        title: "Dental Technician",
        bio: "Marisa Notturno is a skilled dental technician based in New York City, specializing in advanced dental laboratory techniques and digital workflows. With extensive experience in prosthodontic laboratory procedures, she brings practical insights into the collaboration between dental technicians and clinicians. Marisa is passionate about educating dental professionals on laboratory processes, quality control, and the integration of traditional craftsmanship with modern digital technologies.",
        expertise: ["Dental Laboratory Techniques", "Digital Dentistry", "Prosthodontic Lab Work", "Quality Control", "CAD/CAM Technology"],
        location: "New York City, NY",
        overallRating: "4.85",
        reviewCount: 32,
        imageUrl: "/attached_assets/1863_FR-1248.jpg",
        verified: true,
        featured: true,
        category: "Digital Dentistry",
        achievements: [
          "Certified Dental Laboratory Technician (CDT)",
          "Expert in CAD/CAM digital workflows",
          "Quality assurance specialist for prosthodontic restorations",
          "Continuing education instructor for dental technicians"
        ],
        lectures: [
          "Digital Integration in Dental Laboratory Workflows",
          "Quality Control in Prosthodontic Fabrication",
          "Collaboration Between Clinicians and Laboratory Technicians",
          "Advanced Materials in Dental Laboratory Applications",
          "Traditional Craftsmanship Meets Digital Innovation"
        ],
        eventPhotos: [
          "/attached_assets/1863_FR-1244.jpg",
          "/attached_assets/1863_FR-1241.jpg"
        ],
        speakingVideos: [
          "https://example.com/video7",
          "https://example.com/video8"
        ],
        email: "mnotturno@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://marisanotturno.com",
        socialMedia: ["linkedin.com/in/marisanotturno"],
        instagramHandle: "marisanotturno",
        languages: ["English", "Italian"],
        medicalSpecialties: ["Dental Laboratory Technology", "Digital Dentistry", "Prosthodontics"],
        speakerType: "technical",
        fee: "2250"
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
        comment: "Dr. Martin's presentation on comprehensive dental care was outstanding. His insights from his practice at Comprehensive Dental Care in Gainesville provided practical solutions that our members could immediately implement. His discussion of Suresmile technology was particularly valuable.",
        eventType: "General Dentistry Conference",
        eventDate: "2024-03-10",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. James Thompson",
        reviewerTitle: "Faculty Member",
        reviewerCompany: "University of Florida College of Dentistry",
        overallRating: 4,
        speakingStyleRating: 4,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 4,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "Dr. Martin brought excellent expertise to our dental education symposium. As a UF College of Dentistry graduate, his presentation on modern general dentistry approaches was well-structured and evidence-based. Great collaboration throughout the planning process.",
        eventType: "Dental Education Symposium",
        eventDate: "2024-01-25",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. Amanda Foster",
        reviewerTitle: "Director of Continuing Education",
        reviewerCompany: "North Florida Dental Society",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 4,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Dr. Martin's session on emergency dental care protocols was exceptional. His real-world experience from Comprehensive Dental Care provided practical insights that our members found invaluable. The audience was highly engaged throughout his presentation.",
        eventType: "Emergency Dentistry Conference",
        eventDate: "2024-02-14",
        verified: true
      },
      {
        speakerId: 3,
        reviewerName: "Dr. Robert Kim",
        reviewerTitle: "Practice Owner",
        reviewerCompany: "Gainesville Family Dentistry",
        overallRating: 4,
        speakingStyleRating: 4,
        podiumPresenceRating: 4,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 4,
        visualDesignRating: 4,
        comment: "Dr. Martin provided valuable insights on patient-centered dental care and modern practice management. His evidence-based approach and practical recommendations from his work in Gainesville were well-received by our dental community. Professional and knowledgeable speaker.",
        eventType: "Practice Management Conference",
        eventDate: "2024-03-05",
        verified: true
      },
      {
        speakerId: 4,
        reviewerName: "Dr. Sarah Chen",
        reviewerTitle: "Prosthodontist",
        reviewerCompany: "Manhattan Dental Specialists",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 4,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Marisa's presentation on digital laboratory workflows was incredibly informative. Her expertise in CAD/CAM technology and quality control processes provided valuable insights for improving our lab partnerships. The hands-on demonstrations were particularly helpful.",
        eventType: "Digital Dentistry Conference",
        eventDate: "2024-01-18",
        verified: true
      },
      {
        speakerId: 4,
        reviewerName: "Dr. Michael Rodriguez",
        reviewerTitle: "Practice Owner",
        reviewerCompany: "Brooklyn Dental Care",
        overallRating: 4,
        speakingStyleRating: 4,
        podiumPresenceRating: 4,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 4,
        visualDesignRating: 4,
        comment: "Marisa brought excellent technical knowledge to our continuing education seminar. Her understanding of laboratory processes and collaboration with clinicians helped bridge the gap between practice and lab. Great practical advice for improving case outcomes.",
        eventType: "Continuing Education Seminar",
        eventDate: "2024-02-28",
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
    // Get all verified and featured speakers
    const verifiedAndFeaturedSpeakers = Array.from(this.speakers.values())
      .filter(s => s.verified && s.featured);
    
    // If we have 6 or fewer, return all of them
    if (verifiedAndFeaturedSpeakers.length <= 6) {
      return verifiedAndFeaturedSpeakers;
    }
    
    // Rotate through speakers - use a simple rotation based on current time
    const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % verifiedAndFeaturedSpeakers.length;
    const rotatedSpeakers = [
      ...verifiedAndFeaturedSpeakers.slice(rotationIndex),
      ...verifiedAndFeaturedSpeakers.slice(0, rotationIndex)
    ];
    
    return rotatedSpeakers.slice(0, 6);
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