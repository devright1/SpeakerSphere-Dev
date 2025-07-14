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
  getSpeakerBySlug(slug: string): Promise<Speaker | undefined>;
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
        slug: "larrybrecht",
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
        website: "https://devrightspeakers.com",
        socialMedia: ["linkedin.com/in/drlarrybrecht", "twitter.com/drlarrybrecht", "www.devright.com"],
        instagramHandle: null,
        languages: ["English"],
        medicalSpecialties: ["Prosthodontics", "Maxillofacial Prosthodontics", "Dental Reconstruction"],
        speakerType: "clinical",
        fee: "6000"
      },
      {
        name: "Dr. Phil Walton",
        slug: "philwalton",
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
        website: "https://devrightspeakers.com",
        socialMedia: ["linkedin.com/in/drphilwalton", "twitter.com/drphilwalton", "www.devright.com"],
        instagramHandle: "drphilwalton",
        languages: ["English", "French"],
        medicalSpecialties: ["Emergency Medicine", "Critical Care", "Trauma Surgery"],
        speakerType: "keynote",
        fee: "5000"
      },
      {
        name: "Dr. Will Martin",
        slug: "willmartin",
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
        website: "https://devrightspeakers.com",
        socialMedia: ["linkedin.com/in/drwillmartin", "twitter.com/drwillmartin", "www.devright.com"],
        instagramHandle: "wmartingator",
        languages: ["English", "Spanish"],
        medicalSpecialties: ["Prosthodontics", "Implant Dentistry", "Esthetic Dentistry"],
        speakerType: "academic",
        fee: "7000"
      },
      {
        name: "Marisa Notturno",
        slug: "marisanotturno",
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
        website: "https://devrightspeakers.com",
        socialMedia: ["linkedin.com/in/marisanotturno", "www.devright.com"],
        instagramHandle: "marisanotturno",
        languages: ["English", "Italian"],
        medicalSpecialties: ["Dental Laboratory Technology", "Digital Dentistry", "Prosthodontics"],
        speakerType: "technical",
        fee: "2250"
      },
      {
        name: "Dr. Dean Morton",
        slug: "deanmorton",
        title: "Prosthodontist & Academic Leader",
        bio: "Dr. Dean Morton is a distinguished prosthodontist who completed his dental training at the University of Sydney and advanced training in prosthodontics at the University of Iowa. He serves as the Indiana Dental Association Professor and Chair of the Department of Prosthodontics at the Indiana University School of Dentistry. Dr. Morton concurrently serves as Director of the Center for Implant, Esthetic and Innovative Dentistry and as Assistant Dean for Strategic Partnerships and Innovation. He is a Fellow of the International Team for Implantology (ITI) and serves on the Board of Directors and as Chair of the Section Management Committee. Dr. Morton is a Diplomate of the American Board of Prosthodontics, serving on the Board of Directors and as an examiner. He is a fellow or member of the American College of Prosthodontists, the International College of Dentists, the Academy of Prosthodontics and the Academy of Restorative Dentistry.",
        expertise: ["Prosthodontics", "Implant Dentistry", "Esthetic Dentistry", "Digital Dentistry", "Dental Education"],
        location: "Indianapolis, IN",
        overallRating: "4.9",
        reviewCount: 42,
        imageUrl: "/attached_assets/image_1748648990841.png",
        verified: true,
        featured: true,
        category: "Prosthodontics",
        achievements: [
          "Indiana Dental Association Professor and Chair of Prosthodontics at IU School of Dentistry",
          "Director of Center for Implant, Esthetic and Innovative Dentistry",
          "Assistant Dean for Strategic Partnerships and Innovation",
          "Fellow of International Team for Implantology (ITI)",
          "Board of Directors and Chair of Section Management Committee (ITI)",
          "Diplomate of American Board of Prosthodontics",
          "Board of Directors and Examiner (American Board of Prosthodontics)",
          "Fellow of American College of Prosthodontists",
          "Fellow of International College of Dentists",
          "Member of Academy of Prosthodontics",
          "Member of Academy of Restorative Dentistry"
        ],
        lectures: [
          "Advanced Prosthodontic Treatment Planning",
          "Digital Workflows in Implant Prosthodontics",
          "Esthetic Considerations in Complex Rehabilitation",
          "Innovation in Dental Education",
          "Interdisciplinary Treatment Approaches",
          "Contemporary Materials in Prosthodontics",
          "Leadership in Academic Dentistry"
        ],
        eventPhotos: [
          "https://example.com/morton-event1",
          "https://example.com/morton-event2",
          "https://example.com/morton-event3"
        ],
        speakingVideos: [
          "https://example.com/morton-video1",
          "https://example.com/morton-video2"
        ],
        email: "dmorton@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["linkedin.com/in/drdeanmorton", "www.devright.com"],
        instagramHandle: null,
        languages: ["English"],
        medicalSpecialties: ["Prosthodontics", "Implant Dentistry", "Esthetic Dentistry", "Digital Dentistry"],
        speakerType: "academic",
        fee: "8500"
      },
      // New speakers from DevRight conference website
      {
        name: "Dr. Waldemar Polido",
        slug: "waldemarpolido",
        title: "Oral and Maxillofacial Surgeon",
        bio: "Dr. Waldemar Daudt Polido is a Clinical Professor and Director of the Pre-doctoral Oral and Maxillofacial Surgery Program at the IUPUI – Indiana University School of Dentistry. After 25 years working in Porto Alegre, Brazil, Dr. Polido took a position as Clinical Professor of Oral and Maxillofacial Surgery at the Indiana University School of Dentistry in Indianapolis, USA in 2017. Renowned specialist in zygomatic implants and complex maxillofacial reconstruction. Dr. Polido has extensive experience in full arch rehabilitation for atrophic maxillary patients.",
        expertise: ["Zygomatic Implants", "Maxillofacial Reconstruction", "Full Arch Rehabilitation", "Orthognathic Surgery", "Implant Surgery"],
        location: "Indianapolis, IN",
        overallRating: "4.93",
        reviewCount: 76,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Waldemar-Polido.png",
        verified: true,
        featured: true,
        category: "Maxillofacial Surgery",
        achievements: [
          "Clinical Professor at Indiana University School of Dentistry",
          "Director of Pre-doctoral Oral and Maxillofacial Surgery Program",
          "Acting Chairman, Department of Oral and Maxillofacial Surgery",
          "ITI Fellow and Education Committee Member",
          "ZAGA Network Scientific Partner",
          "851 Citations, 71 Publications"
        ],
        lectures: [
          "Advanced Zygomatic Implant Techniques",
          "Digital Planning in Maxillofacial Surgery",
          "Complex Implant Surgery Solutions",
          "Full Arch Rehabilitation Strategies",
          "Computer-Aided Maxillofacial Surgery"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "wpolido@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/waldemardpolido/", "https://www.facebook.com/waldemar.daudtpolido"],
        instagramHandle: "prof.waldemarpolido",
        languages: ["English", "Portuguese"],
        medicalSpecialties: ["Oral and Maxillofacial Surgery", "Zygomatic Implants", "Orthognathic Surgery"],
        speakerType: "clinical",
        fee: "7500"
      },
      {
        name: "Dr. Kostas Chochlidakis",
        slug: "kostaschochlidakis",
        title: "Prosthodontist and Full Arch Specialist",
        bio: "Dr. Konstantinos Chochlidakis is a Professor and Program Director of the Prosthodontics Postgraduate Training Program at Eastman Institute for Oral Health, University of Rochester Medical Center. Expert in full arch treatment planning and decision matrix protocols. Dr. Chochlidakis specializes in comprehensive prosthodontic rehabilitation and digital workflows.",
        expertise: ["Full Arch Rehabilitation", "Digital Prosthodontics", "Implant Prosthetics", "Zirconia Restorations", "Complete Dentures"],
        location: "Rochester, NY",
        overallRating: "4.91",
        reviewCount: 64,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Kostas-Chochlidakis.png",
        verified: true,
        featured: true,
        category: "Prosthodontics",
        achievements: [
          "Professor and Program Director at University of Rochester",
          "Diplomate, American Board of Prosthodontists",
          "Fellow, American College of Prosthodontists",
          "Fellow, International Team for Implantology",
          "ACP Distinguished Researcher Award 2023",
          "70+ Scientific Publications"
        ],
        lectures: [
          "Digital Workflows for Edentulous Patients",
          "Full-Arch Implant Prostheses",
          "Complete-Arch Implant Rehabilitation",
          "Zirconia in Full-Arch Dentistry",
          "Evidence-Based Prosthodontics"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "kchochlidakis@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/dr-konstantinos-chochlidakis-14457658/", "https://www.facebook.com/konstantinos.chochlidakis"],
        instagramHandle: "kchochlidakis",
        languages: ["English", "Greek"],
        medicalSpecialties: ["Prosthodontics", "Implant Dentistry", "Digital Dentistry"],
        speakerType: "academic",
        fee: "6500"
      },
      {
        name: "Dr. Edmond Bedrossian",
        slug: "edmondbedrossian",
        title: "Oral and Maxillofacial Surgeon",
        bio: "Dr. Edmond Bedrossian is a renowned pioneer in full arch implant rehabilitation and complex surgical procedures. He has extensive experience in immediate loading protocols and advanced surgical techniques. Dr. Bedrossian is recognized as an expert in the field of dental implants and has lectured internationally with Professor Brånemark on various topics, especially the rehabilitation of patients with maxillofacial defects.",
        expertise: ["Immediate Loading Implants", "Zygomatic Implants", "Full Arch Rehabilitation", "Complex Oral Surgery", "Digital Surgery"],
        location: "San Francisco, CA",
        overallRating: "4.94",
        reviewCount: 89,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Edmond-Bedrossian.png",
        verified: true,
        featured: true,
        category: "Oral Surgery",
        achievements: [
          "Diplomate, American Board of Oral & Maxillofacial Surgeons",
          "Fellow, American College of Oral & Maxillofacial Surgeons",
          "Honorary Member, American College of Prosthodontists",
          "Director of Implant Surgical Training, University of the Pacific",
          "Author of 'Understanding Zygoma Implants'",
          "Pioneer in Immediate Loading Protocols"
        ],
        lectures: [
          "Immediate Loading in Full Arch Cases",
          "Zygomatic Implant Techniques",
          "Graftless Approach to Edentulous Patients",
          "Digital Treatment Planning for Surgery",
          "Complex Maxillofacial Reconstruction"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "ebedrossian@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/edmond-bedrossian-9a21201a/"],
        instagramHandle: "dr_bedrossian_sr",
        languages: ["English"],
        medicalSpecialties: ["Oral and Maxillofacial Surgery", "Implant Surgery", "Reconstructive Surgery"],
        speakerType: "clinical",
        fee: "8000"
      },
      {
        name: "Dr. Ghida Lawand",
        slug: "ghidalawand",
        title: "AI and Digital Dentistry Expert",
        bio: "Dr. Ghida Lawand is a pioneer in AI-powered implant rehabilitations and digital smile design. Dr. Lawand leads innovation in technology-driven dental care. She is currently pursuing a Professional Diploma in AI and Data Science at the American University of Beirut and serves as an ITI Scholar at University of Florida, Gainesville, USA.",
        expertise: ["Artificial Intelligence in Dentistry", "Digital Smile Design", "AI-Powered Treatment Planning", "Digital Workflows", "3D Facial Scanning"],
        location: "Gainesville, FL / Beirut, Lebanon",
        overallRating: "4.89",
        reviewCount: 52,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Ghida-Lawand.png",
        verified: true,
        featured: true,
        category: "AI in Dentistry",
        achievements: [
          "ITI Scholar at University of Florida",
          "Master's in Prosthodontics and Esthetic Dentistry",
          "Winner, MENA Regional Finals - Global Clinical Case Contest",
          "Audience Favorite Award - Young ITI World Series Final",
          "221 Citations, 22 Publications",
          "Expert in Smilecloud AI Technology"
        ],
        lectures: [
          "AI-Powered Smile Design Revolution",
          "Digital Workflows in Implant Dentistry",
          "Artificial Intelligence in Treatment Planning",
          "3D Facial Scanning for Virtual Smile Design",
          "Future of AI in Dental Practice"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "glawand@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/ghida-lawand-bds-msc-5b700414b/"],
        instagramHandle: "dr.ghidalawand",
        languages: ["English", "Arabic"],
        medicalSpecialties: ["Prosthodontics", "Digital Dentistry", "AI in Healthcare"],
        speakerType: "research",
        fee: "5500"
      },
      {
        name: "Dr. Wael Att",
        slug: "waelatt",
        title: "Prosthodontist",
        bio: "Dr. Wael Att is a Professor of Prosthodontics at the Department of Prosthodontics at Tufts University School of Dental Medicine and also a Professor of Prosthodontics at the School of Dentistry, University of Freiburg, Germany. Specialist in contemporary workflows for dentofacial rehabilitation. Dr. Att focuses on comprehensive prosthodontic solutions.",
        expertise: ["Contemporary Prosthodontic Workflows", "Dentofacial Rehabilitation", "Digital Dentistry", "3D Engineering", "Reconstructive Dentistry"],
        location: "Boston, MA / Freiburg, Germany",
        overallRating: "4.92",
        reviewCount: 71,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Wael-Att.png",
        verified: true,
        featured: true,
        category: "Prosthodontics",
        achievements: [
          "Professor at Tufts University School of Dental Medicine",
          "Professor at University of Freiburg, Germany",
          "Board-certified Prosthodontist (DGPro)",
          "Past-President, International Academy for Digital Dental Medicine",
          "President, Arabian Academy of Esthetic Dentistry",
          "8,944 Citations, 158 Publications"
        ],
        lectures: [
          "Contemporary Workflows in Dentofacial Rehabilitation",
          "3D Engineering in Reconstructive Dentistry",
          "Digital Technologies in Prosthodontics",
          "Perio-prosthetic Rehabilitation",
          "Multidisciplinary Treatment Planning"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "watt@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/wael-att-69418a29/", "https://www.facebook.com/Waelatt"],
        instagramHandle: "attwael",
        languages: ["English", "German", "Arabic"],
        medicalSpecialties: ["Prosthodontics", "Reconstructive Dentistry", "Digital Dentistry"],
        speakerType: "academic",
        fee: "7000"
      },
      {
        name: "Dr. Sam Bakuri",
        slug: "sambakuri",
        title: "Practice Management Expert",
        bio: "Dr. Sam Bakuri is a specialist in marketing strategies for contemporary dental practices. Dr. Bakuri helps practices grow through effective marketing strategies and innovative practice management approaches.",
        expertise: ["Practice Management", "Dental Marketing", "Business Growth", "Patient Acquisition", "Digital Marketing"],
        location: "Multiple Locations",
        overallRating: "4.86",
        reviewCount: 43,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Sam-Bakuri.png",
        verified: true,
        featured: false,
        category: "Business Management",
        achievements: [
          "Expert in Dental Practice Marketing",
          "Business Growth Consultant",
          "Digital Marketing Strategist",
          "Practice Management Advisor"
        ],
        lectures: [
          "Marketing Strategies for Modern Dental Practices",
          "Patient Acquisition in the Digital Age",
          "Building Successful Dental Businesses",
          "Social Media Marketing for Dentists",
          "Practice Growth and Management"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "sbakuri@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/sam-bakuri-b40a0382/", "https://www.facebook.com/sarmad.bakuri"],
        instagramHandle: "sbakuri",
        languages: ["English"],
        medicalSpecialties: ["Practice Management", "Business Development"],
        speakerType: "business",
        fee: "4500"
      },
      {
        name: "Dr. Edgard El Chaar",
        slug: "edgardelchaar",
        title: "Implant Dentist",
        bio: "Dr. Edgard El Chaar is an expert in the business aspects of immediate implant placement. Dr. El Chaar specializes in efficient implant workflows and innovative approaches to implant dentistry practice management.",
        expertise: ["Immediate Implant Placement", "Implant Workflows", "Business Efficiency", "Practice Optimization", "Implant Dentistry"],
        location: "Multiple Locations",
        overallRating: "4.88",
        reviewCount: 38,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Edgard-El-Chaar.png",
        verified: true,
        featured: false,
        category: "Implant Dentistry",
        achievements: [
          "Expert in Immediate Implant Placement",
          "Implant Workflow Specialist",
          "Business Efficiency Consultant",
          "Practice Optimization Expert"
        ],
        lectures: [
          "Business Aspects of Immediate Implant Placement",
          "Efficient Implant Workflows",
          "Practice Optimization for Implant Dentistry",
          "Revenue Generation in Implant Practice",
          "Streamlined Implant Protocols"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "eelchaar@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/edgardelchaar/", "https://www.facebook.com/dredgardelchaar", "https://x.com/edgardelchaar"],
        instagramHandle: "edgardelchaardds",
        languages: ["English"],
        medicalSpecialties: ["Implant Dentistry", "Practice Management"],
        speakerType: "business",
        fee: "4000"
      },
      {
        name: "Dr. Mark Schlam",
        slug: "markschlam",
        title: "Oral Surgeon",
        bio: "Dr. Mark Schlam is an expert oral surgeon with extensive experience in implant dentistry and full arch rehabilitation. He brings clinical excellence and surgical expertise to complex dental cases.",
        expertise: ["Oral Surgery", "Implant Dentistry", "Full Arch Rehabilitation", "Surgical Techniques", "Complex Cases"],
        location: "Multiple Locations",
        overallRating: "4.90",
        reviewCount: 47,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Mark-Schlam.png",
        verified: true,
        featured: false,
        category: "Oral Surgery",
        achievements: [
          "Expert in Oral Surgery",
          "Implant Dentistry Specialist",
          "Full Arch Rehabilitation Expert",
          "Advanced Surgical Techniques"
        ],
        lectures: [
          "Advanced Oral Surgery Techniques",
          "Implant Dentistry in Complex Cases",
          "Full Arch Rehabilitation Surgery",
          "Surgical Planning and Execution",
          "Complex Case Management"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "mark.schlam@devright.com",
        phone: "214-884-4100",
        website: "https://devright.com",
        socialMedia: ["https://www.linkedin.com/in/mark-schlam-dmd-facs-9ba9328a/"],
        instagramHandle: "surgicalsmile",
        languages: ["English"],
        medicalSpecialties: ["Oral Surgery", "Implant Dentistry"],
        speakerType: "clinical",
        fee: "5500"
      },
      {
        name: "Dr. Curry Leavitt",
        slug: "curryleavitt",
        title: "Periodontist",
        bio: "Dr. Curry Leavitt is a board-certified periodontist and implant surgeon specializing in complex full arch cases. He brings expertise in periodontal therapy and advanced implant surgical techniques.",
        expertise: ["Periodontics", "Implant Surgery", "Full Arch Cases", "Periodontal Therapy", "Complex Surgery"],
        location: "Multiple Locations",
        overallRating: "4.91",
        reviewCount: 55,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Leavitt.png",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Board-Certified Periodontist",
          "Implant Surgery Specialist",
          "Complex Full Arch Expert",
          "Advanced Periodontal Techniques"
        ],
        lectures: [
          "Complex Full Arch Periodontal Cases",
          "Advanced Periodontal Surgery",
          "Implant Surgery in Compromised Sites",
          "Periodontal Therapy Protocols",
          "Tissue Management in Implant Dentistry"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "curry.leavitt@devright.com",
        phone: "214-884-4100",
        website: "https://devright.com",
        socialMedia: ["https://www.linkedin.com/in/curry-leavitt-21280a16/"],
        instagramHandle: "drcurryleavitt",
        languages: ["English"],
        medicalSpecialties: ["Periodontics", "Implant Surgery"],
        speakerType: "clinical",
        fee: "5000"
      },
      {
        name: "Dr. Kimberly Schlam",
        slug: "kimberlyschlam",
        title: "Esthetic Dentistry & Technology Integration Specialist",
        bio: "Dr. Kimberly Schlam is an expert in using technology for predictable dental outcomes. Dr. Schlam focuses on digital workflows and technology-driven patient care in esthetic dentistry.",
        expertise: ["Esthetic Dentistry", "Digital Technology", "Predictable Outcomes", "Technology Integration", "Digital Workflows"],
        location: "Multiple Locations",
        overallRating: "4.87",
        reviewCount: 41,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Kimberly-Schlam.png",
        verified: true,
        featured: false,
        category: "Esthetic Dentistry",
        achievements: [
          "Technology Integration Specialist",
          "Esthetic Dentistry Expert",
          "Digital Workflow Consultant",
          "Predictable Outcome Specialist"
        ],
        lectures: [
          "Technology for Predictable Dental Outcomes",
          "Digital Workflows in Esthetic Dentistry",
          "Technology-Driven Patient Care",
          "Integration of Digital Tools",
          "Modern Esthetic Techniques"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "kschlam@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/kimberly-schlam-dmd-ms-1339a470/"],
        instagramHandle: "dr.skimm",
        languages: ["English"],
        medicalSpecialties: ["Esthetic Dentistry", "Digital Dentistry"],
        speakerType: "clinical",
        fee: "4500"
      },
      {
        name: "Dr. Panos Papaspyridakis",
        slug: "panospapa",
        title: "Prosthodontist & Implant Specialist",
        bio: "Dr. Panos Papaspyridakis is a distinguished prosthodontist and implant specialist with extensive experience in full arch rehabilitation and complex prosthetic reconstruction. He is recognized internationally for his expertise in digital workflows and innovative treatment protocols in implant dentistry.",
        expertise: ["Prosthodontics", "Implant Dentistry", "Full Arch Rehabilitation", "Digital Workflows", "Complex Reconstruction"],
        location: "Multiple Locations",
        overallRating: "4.93",
        reviewCount: 68,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Papaspyridakos.png",
        verified: true,
        featured: true,
        category: "Prosthodontics",
        achievements: [
          "Distinguished Prosthodontist",
          "Implant Specialist",
          "Full Arch Rehabilitation Expert",
          "Digital Workflow Pioneer",
          "International Recognition"
        ],
        lectures: [
          "Full Arch Rehabilitation Protocols",
          "Digital Workflows in Implant Dentistry",
          "Complex Prosthetic Reconstruction",
          "Innovative Treatment Protocols",
          "Evidence-Based Prosthodontics"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "panos.papaspyridakis@devright.com",
        phone: "214-884-4100",
        website: "https://devright.com",
        socialMedia: ["https://linkedin.com/in/panos-papaspyridakis", "https://x.com/panospapa"],
        instagramHandle: "panos__papaspyridakos",
        languages: ["English", "Greek"],
        medicalSpecialties: ["Prosthodontics", "Implant Dentistry"],
        speakerType: "clinical",
        fee: "7500"
      },
      {
        name: "Dr. Armand Bedrossian",
        slug: "armandbedrossian",
        title: "Digital Technology & Full Arch Specialist",
        bio: "Dr. Armand Bedrossian is an expert in applying digital technology in full arch implant therapy with extensive clinical experience. He represents the next generation of digital dentistry specialists.",
        expertise: ["Digital Technology", "Full Arch Implant Therapy", "Digital Workflows", "Advanced Technology", "Clinical Excellence"],
        location: "Multiple Locations",
        overallRating: "4.89",
        reviewCount: 34,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Speaker_Portrait_Armand_Bedrossian_1751049915286.png",
        verified: true,
        featured: false,
        category: "Digital Dentistry",
        achievements: [
          "Digital Technology Expert",
          "Full Arch Specialist",
          "Clinical Experience Leader",
          "Next Generation Specialist"
        ],
        lectures: [
          "Digital Technology in Full Arch Therapy",
          "Advanced Digital Workflows",
          "Technology Integration in Implant Dentistry",
          "Clinical Applications of Digital Tools",
          "Future of Digital Dentistry"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "abedrossian@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English"],
        medicalSpecialties: ["Digital Dentistry", "Implant Dentistry"],
        speakerType: "clinical",
        fee: "5000"
      },
      {
        name: "Dr. Berfin Jacobs",
        slug: "berfinjacobs",
        title: "Implant Dentistry Researcher",
        bio: "Dr. Berfin Jacobs is a specialist in contemporary implant dentistry techniques and clinical research. She brings cutting-edge research insights to clinical practice.",
        expertise: ["Implant Dentistry Research", "Contemporary Techniques", "Clinical Research", "Evidence-Based Practice", "Research Translation"],
        location: "Multiple Locations",
        overallRating: "4.85",
        reviewCount: 28,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/1643679947954%20(1)_1751387734753.jpg",
        verified: true,
        featured: false,
        category: "Implant Dentistry",
        achievements: [
          "Implant Dentistry Researcher",
          "Contemporary Techniques Specialist",
          "Clinical Research Expert",
          "Evidence-Based Practice Advocate"
        ],
        lectures: [
          "Contemporary Implant Dentistry Techniques",
          "Clinical Research in Implant Dentistry",
          "Evidence-Based Implant Practice",
          "Research Translation to Clinical Practice",
          "Advanced Implant Protocols"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "bjacobs@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English"],
        medicalSpecialties: ["Implant Dentistry", "Clinical Research"],
        speakerType: "research",
        fee: "4000"
      },
      {
        name: "Jason Coss",
        slug: "jasoncoss",
        title: "Event Coordinator",
        bio: "Jason Coss is an event coordinator and moderator for the Straumann Full Arch Forum. He brings expertise in event management and coordination for dental conferences.",
        expertise: ["Event Coordination", "Conference Management", "Event Moderation", "Program Development", "Logistics Management"],
        location: "Multiple Locations",
        overallRating: "4.78",
        reviewCount: 22,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Jason_Coss_square_white.png",
        verified: true,
        featured: false,
        category: "Team Development",
        achievements: [
          "Event Coordinator",
          "Conference Moderator",
          "Program Development Specialist",
          "Logistics Expert"
        ],
        lectures: [
          "Event Coordination Best Practices",
          "Conference Management Strategies",
          "Program Development for Dental Events",
          "Logistics and Planning Excellence",
          "Event Moderation Techniques"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "jason.coss@devright.com",
        phone: "214-884-4100",
        website: "https://devright.com",
        socialMedia: ["https://www.linkedin.com/in/jason-coss-bb079472/"],
        instagramHandle: "jasoncoss_straumannnam",
        languages: ["English"],
        medicalSpecialties: ["Event Management", "Conference Coordination"],
        speakerType: "business",
        fee: "3000"
      },
      // Additional Young ITI Day and DevRight speakers
      {
        name: "Dr. Angel Garcia-Cañas",
        slug: "angelgarciacanas",
        title: "Implant Dentistry Specialist",
        bio: "Dr. Angel Garcia-Cañas is a specialist in contemporary implant dentistry techniques and a member of the Young ITI community. He brings cutting-edge approaches to implant rehabilitation and digital workflows.",
        expertise: ["Implant Dentistry", "Contemporary Techniques", "Digital Workflows", "Young ITI Research", "Clinical Innovation"],
        location: "Multiple Locations",
        overallRating: "4.87",
        reviewCount: 31,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/1739552984891_1751050055872.jpg",
        verified: true,
        featured: false,
        category: "Implant Dentistry",
        achievements: [
          "Young ITI Member",
          "Implant Dentistry Specialist",
          "Contemporary Techniques Expert",
          "Digital Workflow Pioneer"
        ],
        lectures: [
          "Contemporary Implant Dentistry Approaches",
          "Young ITI Research and Innovation",
          "Digital Workflows in Implant Practice",
          "Clinical Innovation in Implant Dentistry",
          "Future Perspectives in Implantology"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "agarcia@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Spanish"],
        medicalSpecialties: ["Implant Dentistry", "Digital Dentistry"],
        speakerType: "research",
        fee: "4200"
      },
      {
        name: "Prof. Dr. Bogna Stawarczyk",
        slug: "bognastawarczyk",
        title: "Dental Materials Science Expert",
        bio: "Prof. Dr. Bogna Stawarczyk is a Professor of Dental Material Science and Dental Technology at Ludwig-Maximilians-University (LMU) Munich. She is internationally recognized for her expertise in CAD/CAM materials, zirconia research, and dental ceramics. With over 350 publications and 17,580+ citations, she is a leading authority in dental materials science.",
        expertise: ["Dental Materials Science", "CAD/CAM Materials", "Zirconia Research", "Dental Ceramics", "Materials Testing"],
        location: "Munich, Germany",
        overallRating: "4.95",
        reviewCount: 83,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Bogna_square_white.png",
        verified: true,
        featured: true,
        category: "Digital Dentistry",
        achievements: [
          "Professor at Ludwig-Maximilians-University Munich",
          "Vice President, European Association of Dental Technology",
          "350+ International Publications",
          "17,580+ Research Citations",
          "Expert in CAD/CAM Materials",
          "Zirconia Research Pioneer"
        ],
        lectures: [
          "Advanced CAD/CAM Materials Science",
          "Zirconia Research and Applications",
          "Dental Ceramics Innovation",
          "Materials Testing and Performance",
          "Future of Dental Materials"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "bstawarczyk@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/bogna-stawarczyk-8b406332/"],
        instagramHandle: null,
        languages: ["English", "German", "Polish"],
        medicalSpecialties: ["Dental Materials Science", "CAD/CAM Technology", "Ceramic Materials"],
        speakerType: "academic",
        fee: "8500"
      },
      {
        name: "Vincent Fehmer",
        slug: "vincentfehmer",
        title: "Master Dental Technician & Prosthodontics Specialist",
        bio: "Vincent Fehmer, MDT, is a prominent dental technician and prosthodontics specialist based in Switzerland. He is an ITI Fellow and works at the Division of Fixed Prosthodontics and Biomaterials at the University of Geneva. With 50+ peer-reviewed articles and extensive international recognition, he is a leader in digital dental technology and interdisciplinary treatment planning.",
        expertise: ["Fixed Prosthodontics", "Digital Dental Technology", "CAD/CAM", "Implant Restorative Dentistry", "Esthetic Dentistry"],
        location: "Geneva, Switzerland / Lausanne, Switzerland",
        overallRating: "4.93",
        reviewCount: 67,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Vincent_square_white.png",
        verified: true,
        featured: true,
        category: "Digital Dentistry",
        achievements: [
          "Master Dental Technician (MDT)",
          "ITI Fellow",
          "University of Geneva Faculty",
          "Editor-in-Chief, International Journal of Esthetic Dentistry",
          "Kenneth Rudd Award Winner",
          "50+ Peer-Reviewed Publications"
        ],
        lectures: [
          "Digital Dental Technology Masterclass",
          "Fixed Prosthodontics Excellence",
          "Interdisciplinary Treatment Planning",
          "CAD/CAM Technology Innovation",
          "Esthetic Dentistry Principles"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "vfehmer@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.linkedin.com/in/vincent-fehmer/"],
        instagramHandle: null,
        languages: ["English", "German", "French"],
        medicalSpecialties: ["Prosthodontics", "Digital Dentistry", "Dental Technology"],
        speakerType: "technical",
        fee: "7500"
      },
      {
        name: "Dr. Mutlu Özcan",
        slug: "mutluozcan",
        title: "Dental Materials Research Expert",
        bio: "Dr. Mutlu Özcan is a leading researcher in dental materials science and adhesive dentistry. He has extensive experience in dental materials research and innovation, contributing significantly to the field of restorative dentistry and materials science.",
        expertise: ["Dental Materials Research", "Adhesive Dentistry", "Restorative Dentistry", "Materials Innovation", "Clinical Research"],
        location: "Multiple Locations",
        overallRating: "4.88",
        reviewCount: 45,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Mutlu_square_white.png",
        verified: true,
        featured: false,
        category: "Digital Dentistry",
        achievements: [
          "Dental Materials Research Expert",
          "Adhesive Dentistry Specialist",
          "Restorative Dentistry Authority",
          "Materials Innovation Pioneer"
        ],
        lectures: [
          "Advanced Dental Materials Research",
          "Adhesive Dentistry Innovations",
          "Restorative Materials Science",
          "Clinical Materials Applications",
          "Future Trends in Dental Materials"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "mozcan@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Turkish"],
        medicalSpecialties: ["Dental Materials Science", "Adhesive Dentistry", "Restorative Dentistry"],
        speakerType: "research",
        fee: "6000"
      },
      {
        name: "Dr. Irena Sailer",
        slug: "irenasailer",
        title: "Prosthodontics & Esthetic Dentistry Expert",
        bio: "Prof. Dr. Irena Sailer is a world-renowned expert in prosthodontics and esthetic dentistry. She is a professor at the University of Geneva and has made significant contributions to ceramic dentistry and digital workflows. Her research and clinical work have revolutionized modern prosthodontic treatment protocols.",
        expertise: ["Prosthodontics", "Esthetic Dentistry", "Ceramic Dentistry", "Digital Workflows", "Implant Prosthodontics"],
        location: "Geneva, Switzerland",
        overallRating: "4.96",
        reviewCount: 94,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Irena_square_white.png",
        verified: true,
        featured: true,
        category: "Prosthodontics",
        achievements: [
          "Professor at University of Geneva",
          "World Expert in Ceramic Dentistry",
          "Pioneer in Digital Prosthodontics",
          "Author of Multiple Textbooks",
          "International Lecturer and Researcher"
        ],
        lectures: [
          "Advanced Ceramic Dentistry",
          "Digital Prosthodontic Workflows",
          "Esthetic Dentistry Excellence",
          "Implant Prosthodontics",
          "Contemporary Treatment Protocols"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "isailer@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German", "French"],
        medicalSpecialties: ["Prosthodontics", "Esthetic Dentistry", "Ceramic Dentistry"],
        speakerType: "academic",
        fee: "9000"
      },
      {
        name: "Dr. Marco Pagni",
        slug: "marcopagni",
        title: "Periodontics & Implant Specialist",
        bio: "Dr. Marco Pagni is a specialist in periodontics and implant dentistry with extensive experience in advanced periodontal therapy and implant rehabilitation. He brings clinical excellence and research expertise to complex periodontal and implant cases.",
        expertise: ["Periodontics", "Implant Dentistry", "Periodontal Therapy", "Soft Tissue Management", "Regenerative Procedures"],
        location: "Multiple Locations",
        overallRating: "4.89",
        reviewCount: 56,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Marco_square_white.png",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Periodontics Specialist",
          "Implant Dentistry Expert",
          "Regenerative Procedures Authority",
          "Soft Tissue Management Specialist"
        ],
        lectures: [
          "Advanced Periodontal Therapy",
          "Implant Dentistry Excellence",
          "Soft Tissue Management",
          "Regenerative Periodontal Procedures",
          "Complex Case Management"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "mpagni@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Italian"],
        medicalSpecialties: ["Periodontics", "Implant Dentistry"],
        speakerType: "clinical",
        fee: "5500"
      },
      {
        name: "Dr. Sven Mühlemann",
        slug: "svenmuhlemann",
        title: "Digital Dentistry & Research Specialist",
        bio: "Dr. Sven Mühlemann is a specialist in digital dentistry and dental research. He focuses on innovative digital workflows and evidence-based treatment approaches in modern dental practice.",
        expertise: ["Digital Dentistry", "Dental Research", "Evidence-Based Practice", "Digital Workflows", "Clinical Innovation"],
        location: "Switzerland",
        overallRating: "4.84",
        reviewCount: 39,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Sven_square_white.png",
        verified: true,
        featured: false,
        category: "Digital Dentistry",
        achievements: [
          "Digital Dentistry Specialist",
          "Dental Research Expert",
          "Evidence-Based Practice Advocate",
          "Clinical Innovation Leader"
        ],
        lectures: [
          "Digital Dentistry Innovation",
          "Evidence-Based Treatment Approaches",
          "Digital Workflow Optimization",
          "Clinical Research Applications",
          "Future of Digital Dentistry"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "smuhlemann@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Digital Dentistry", "Dental Research"],
        speakerType: "research",
        fee: "5000"
      },
      {
        name: "Dr. Nicola Pandis",
        slug: "nicolapandis",
        title: "Orthodontics & Research Methodology Expert",
        bio: "Dr. Nicola Pandis is an expert in orthodontics and research methodology. He has made significant contributions to evidence-based orthodontic treatment and research design in dental sciences.",
        expertise: ["Orthodontics", "Research Methodology", "Evidence-Based Practice", "Clinical Research", "Statistical Analysis"],
        location: "Multiple Locations",
        overallRating: "4.91",
        reviewCount: 62,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Nicola_square_white.png",
        verified: true,
        featured: false,
        category: "Orthodontics",
        achievements: [
          "Orthodontics Expert",
          "Research Methodology Specialist",
          "Evidence-Based Practice Leader",
          "Clinical Research Authority"
        ],
        lectures: [
          "Evidence-Based Orthodontics",
          "Research Methodology in Dentistry",
          "Clinical Research Design",
          "Statistical Analysis in Dental Research",
          "Orthodontic Treatment Planning"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "npandis@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Greek"],
        medicalSpecialties: ["Orthodontics", "Research Methodology"],
        speakerType: "academic",
        fee: "6500"
      },
      {
        name: "Dr. Claudia Meller",
        slug: "claudiameller",
        title: "Pediatric Dentistry Specialist",
        bio: "Dr. Claudia Meller is a specialist in pediatric dentistry with extensive experience in treating children and adolescents. She focuses on preventive care and innovative treatment approaches for young patients.",
        expertise: ["Pediatric Dentistry", "Preventive Care", "Child Psychology", "Adolescent Dentistry", "Special Needs Dentistry"],
        location: "Multiple Locations",
        overallRating: "4.87",
        reviewCount: 48,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Claudia_square_white.png",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Pediatric Dentistry Specialist",
          "Preventive Care Expert",
          "Child Psychology Understanding",
          "Special Needs Dentistry Authority"
        ],
        lectures: [
          "Pediatric Dentistry Excellence",
          "Preventive Care Strategies",
          "Managing Young Patients",
          "Special Needs Dentistry",
          "Adolescent Dental Care"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "cmeller@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Pediatric Dentistry", "Preventive Dentistry"],
        speakerType: "clinical",
        fee: "4500"
      },
      {
        name: "Dr. Ramtin Sadid-Zadeh",
        slug: "ramtinsadid",
        title: "Prosthodontics & Digital Dentistry Expert",
        bio: "Dr. Ramtin Sadid-Zadeh is a prosthodontist with expertise in digital dentistry and advanced restorative techniques. He specializes in complex prosthodontic rehabilitation and digital workflow integration.",
        expertise: ["Prosthodontics", "Digital Dentistry", "Restorative Techniques", "Complex Rehabilitation", "Digital Workflows"],
        location: "Multiple Locations",
        overallRating: "4.88",
        reviewCount: 44,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/Ramtin_square_white.png",
        verified: true,
        featured: false,
        category: "Prosthodontics",
        achievements: [
          "Prosthodontics Specialist",
          "Digital Dentistry Expert",
          "Complex Rehabilitation Authority",
          "Digital Workflow Pioneer"
        ],
        lectures: [
          "Advanced Prosthodontic Techniques",
          "Digital Dentistry Integration",
          "Complex Rehabilitation Strategies",
          "Digital Workflow Optimization",
          "Restorative Excellence"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "rsadid@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English"],
        medicalSpecialties: ["Prosthodontics", "Digital Dentistry"],
        speakerType: "clinical",
        fee: "6000"
      },
      // Additional speakers from the DevRight platform
      {
        name: "Dr. Andreas Ender",
        slug: "andreasender",
        title: "Digital Dentistry & CAD/CAM Expert",
        bio: "Dr. Andreas Ender is a leading expert in digital dentistry and CAD/CAM technology. He specializes in digital impression techniques and computer-aided design and manufacturing in dental practice.",
        expertise: ["Digital Dentistry", "CAD/CAM Technology", "Digital Impressions", "Intraoral Scanning", "Digital Workflows"],
        location: "Zurich, Switzerland",
        overallRating: "4.92",
        reviewCount: 58,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Digital Dentistry",
        achievements: [
          "Digital Dentistry Pioneer",
          "CAD/CAM Technology Expert",
          "Digital Impressions Authority",
          "Intraoral Scanning Specialist"
        ],
        lectures: [
          "Advanced CAD/CAM Technology",
          "Digital Impression Techniques",
          "Intraoral Scanning Excellence",
          "Digital Workflow Integration",
          "Future of Digital Dentistry"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "aender@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Digital Dentistry", "CAD/CAM Technology"],
        speakerType: "clinical",
        fee: "6500"
      },
      {
        name: "Dr. Stefan Neumeyer",
        slug: "stefanneumeyer",
        title: "Oral Surgery & Implantology Specialist",
        bio: "Dr. Stefan Neumeyer is a specialist in oral surgery and implantology with extensive experience in complex surgical procedures and implant rehabilitation.",
        expertise: ["Oral Surgery", "Implantology", "Complex Surgery", "Surgical Planning", "Bone Reconstruction"],
        location: "Germany",
        overallRating: "4.89",
        reviewCount: 42,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Oral Surgery",
        achievements: [
          "Oral Surgery Specialist",
          "Implantology Expert",
          "Complex Surgery Authority",
          "Surgical Planning Pioneer"
        ],
        lectures: [
          "Advanced Oral Surgery Techniques",
          "Complex Implantology",
          "Surgical Planning Excellence",
          "Bone Reconstruction Methods",
          "Innovative Surgical Approaches"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "sneumeyer@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Oral Surgery", "Implantology"],
        speakerType: "clinical",
        fee: "5800"
      },
      {
        name: "Dr. Martin Schimmel",
        slug: "martinschimmel",
        title: "Geriatric Dentistry & Prosthodontics",
        bio: "Dr. Martin Schimmel specializes in geriatric dentistry and prosthodontics, focusing on the unique dental needs of elderly patients and complex prosthodontic rehabilitation.",
        expertise: ["Geriatric Dentistry", "Prosthodontics", "Elderly Care", "Complex Rehabilitation", "Removable Prosthetics"],
        location: "Bern, Switzerland",
        overallRating: "4.86",
        reviewCount: 37,
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Prosthodontics",
        achievements: [
          "Geriatric Dentistry Specialist",
          "Prosthodontics Expert",
          "Elderly Care Authority",
          "Complex Rehabilitation Specialist"
        ],
        lectures: [
          "Geriatric Dentistry Excellence",
          "Prosthodontics for Elderly Patients",
          "Complex Rehabilitation Strategies",
          "Removable Prosthetics Innovation",
          "Age-Appropriate Dental Care"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "mschimmel@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German", "French"],
        medicalSpecialties: ["Geriatric Dentistry", "Prosthodontics"],
        speakerType: "clinical",
        fee: "5200"
      },
      {
        name: "Dr. Ronald Jung",
        slug: "ronaldjung",
        title: "Implant Dentistry & Regenerative Medicine",
        bio: "Dr. Ronald Jung is a world-renowned expert in implant dentistry and regenerative medicine. He has made significant contributions to bone and soft tissue regeneration around dental implants.",
        expertise: ["Implant Dentistry", "Regenerative Medicine", "Bone Regeneration", "Soft Tissue Management", "GBR Techniques"],
        location: "Zurich, Switzerland",
        overallRating: "4.95",
        reviewCount: 87,
        imageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Implant Dentistry",
        achievements: [
          "Implant Dentistry World Expert",
          "Regenerative Medicine Pioneer",
          "Bone Regeneration Authority",
          "International Lecturer and Researcher"
        ],
        lectures: [
          "Advanced Implant Dentistry",
          "Regenerative Medicine in Dentistry",
          "Bone and Soft Tissue Regeneration",
          "GBR Techniques Excellence",
          "Contemporary Implant Protocols"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "rjung@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Implant Dentistry", "Regenerative Medicine"],
        speakerType: "academic",
        fee: "8500"
      },
      {
        name: "Dr. Daniel Buser",
        slug: "danielbuser",
        title: "Implant Surgery & Bone Regeneration Pioneer",
        bio: "Prof. Dr. Daniel Buser is a pioneer in implant surgery and bone regeneration. His research and clinical work have fundamentally shaped modern implant dentistry and guided bone regeneration techniques.",
        expertise: ["Implant Surgery", "Bone Regeneration", "GBR Techniques", "Membrane Technology", "Surgical Protocols"],
        location: "Bern, Switzerland",
        overallRating: "4.97",
        reviewCount: 96,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Implant Dentistry",
        achievements: [
          "Pioneer in Implant Surgery",
          "Bone Regeneration Research Leader",
          "GBR Techniques Developer",
          "International Research Authority",
          "Author of Landmark Publications"
        ],
        lectures: [
          "Fundamentals of Implant Surgery",
          "Guided Bone Regeneration Mastery",
          "Membrane Technology Innovation",
          "Surgical Protocol Development",
          "Future of Implant Surgery"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "dbuser@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Implant Surgery", "Bone Regeneration", "Oral Surgery"],
        speakerType: "academic",
        fee: "9500"
      },
      {
        name: "Dr. Niklaus Lang",
        slug: "niklauslang",
        title: "Periodontics & Implant Research Leader",
        bio: "Prof. Dr. Niklaus Lang is a legendary figure in periodontics and implant research. His contributions to the understanding of periodontal and peri-implant diseases have shaped modern dental practice worldwide.",
        expertise: ["Periodontics", "Implant Research", "Peri-implant Disease", "Clinical Research", "Evidence-Based Practice"],
        location: "Bern, Switzerland",
        overallRating: "4.98",
        reviewCount: 102,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Periodontics",
        achievements: [
          "Legendary Periodontics Researcher",
          "Implant Research Pioneer",
          "Peri-implant Disease Authority",
          "Evidence-Based Practice Leader",
          "International Recognition and Awards"
        ],
        lectures: [
          "Fundamentals of Periodontics",
          "Peri-implant Disease Management",
          "Evidence-Based Clinical Practice",
          "Research Methodology in Dentistry",
          "Legacy of Periodontal Research"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "nlang@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Periodontics", "Implant Research", "Clinical Research"],
        speakerType: "academic",
        fee: "9500"
      },
      {
        name: "Dr. Frank Schwarz",
        slug: "frankschwarz",
        title: "Implant Therapy & Peri-implant Disease Expert",
        bio: "Prof. Dr. Frank Schwarz is an expert in implant therapy and peri-implant disease management. His research focuses on the biological and clinical aspects of dental implants and their long-term success.",
        expertise: ["Implant Therapy", "Peri-implant Disease", "Implant Biology", "Surface Technology", "Clinical Research"],
        location: "Düsseldorf, Germany",
        overallRating: "4.93",
        reviewCount: 74,
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Implant Dentistry",
        achievements: [
          "Implant Therapy Expert",
          "Peri-implant Disease Authority",
          "Implant Biology Researcher",
          "Surface Technology Pioneer",
          "Clinical Research Leader"
        ],
        lectures: [
          "Advanced Implant Therapy",
          "Peri-implant Disease Management",
          "Implant Biology and Success",
          "Surface Technology Innovation",
          "Long-term Implant Outcomes"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "fschwarz@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Implant Dentistry", "Periodontics", "Clinical Research"],
        speakerType: "academic",
        fee: "8000"
      },
      {
        name: "Dr. Maurício Araújo",
        slug: "mauricioaraujo",
        title: "Periodontics & Implant Surgery Specialist",
        bio: "Dr. Maurício Araújo is a renowned specialist in periodontics and implant surgery. He has extensive experience in regenerative procedures and complex surgical interventions.",
        expertise: ["Periodontics", "Implant Surgery", "Regenerative Procedures", "Surgical Techniques", "Soft Tissue Management"],
        location: "Maringá, Brazil",
        overallRating: "4.91",
        reviewCount: 65,
        imageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Periodontics Specialist",
          "Implant Surgery Expert",
          "Regenerative Procedures Authority",
          "International Recognition"
        ],
        lectures: [
          "Advanced Periodontal Surgery",
          "Implant Surgery Excellence",
          "Regenerative Procedures",
          "Soft Tissue Management",
          "Complex Case Solutions"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "maraujo@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Portuguese"],
        medicalSpecialties: ["Periodontics", "Implant Surgery"],
        speakerType: "clinical",
        fee: "6500"
      },
      {
        name: "Dr. Giovanni Zucchelli",
        slug: "giovannizucchelli",
        title: "Periodontal Plastic Surgery Expert",
        bio: "Prof. Dr. Giovanni Zucchelli is a world-renowned expert in periodontal plastic surgery. His innovative techniques in mucogingival surgery have revolutionized esthetic periodontal treatment.",
        expertise: ["Periodontal Plastic Surgery", "Mucogingival Surgery", "Root Coverage", "Esthetic Periodontics", "Surgical Innovation"],
        location: "Bologna, Italy",
        overallRating: "4.96",
        reviewCount: 88,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Periodontics",
        achievements: [
          "Periodontal Plastic Surgery Pioneer",
          "Mucogingival Surgery Expert",
          "Root Coverage Authority",
          "Esthetic Periodontics Leader",
          "Surgical Innovation Pioneer"
        ],
        lectures: [
          "Periodontal Plastic Surgery Mastery",
          "Mucogingival Surgery Excellence",
          "Root Coverage Techniques",
          "Esthetic Periodontal Treatment",
          "Surgical Innovation in Periodontics"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "gzucchelli@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Italian"],
        medicalSpecialties: ["Periodontics", "Plastic Surgery", "Esthetic Dentistry"],
        speakerType: "academic",
        fee: "8500"
      },
      {
        name: "Dr. Istvan Urban",
        slug: "istvanurban",
        title: "Bone Regeneration & Complex Surgery Expert",
        bio: "Dr. Istvan Urban is a leading expert in bone regeneration and complex surgical procedures. His innovative techniques in vertical and horizontal bone augmentation have advanced the field of implant surgery.",
        expertise: ["Bone Regeneration", "Complex Surgery", "Vertical Augmentation", "Horizontal Augmentation", "Surgical Innovation"],
        location: "Budapest, Hungary",
        overallRating: "4.94",
        reviewCount: 79,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Oral Surgery",
        achievements: [
          "Bone Regeneration Pioneer",
          "Complex Surgery Expert",
          "Vertical Augmentation Authority",
          "Surgical Innovation Leader",
          "International Recognition"
        ],
        lectures: [
          "Advanced Bone Regeneration",
          "Complex Surgical Procedures",
          "Vertical Bone Augmentation",
          "Horizontal Bone Augmentation",
          "Surgical Innovation Techniques"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "iurban@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Hungarian"],
        medicalSpecialties: ["Oral Surgery", "Bone Regeneration", "Implant Surgery"],
        speakerType: "clinical",
        fee: "8000"
      },
      // Additional international speakers to complete the 50+ roster
      {
        name: "Dr. Stefan Renvert",
        slug: "stefanrenvert",
        title: "Periodontology & Peri-implant Disease Expert",
        bio: "Prof. Dr. Stefan Renvert is a renowned expert in periodontology and peri-implant disease management. His research has significantly contributed to understanding implant complications and their prevention.",
        expertise: ["Periodontology", "Peri-implant Disease", "Implant Complications", "Prevention Protocols", "Clinical Research"],
        location: "Kristianstad, Sweden",
        overallRating: "4.92",
        reviewCount: 69,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Periodontology Expert",
          "Peri-implant Disease Authority",
          "Implant Complications Researcher",
          "Prevention Protocol Developer"
        ],
        lectures: [
          "Peri-implant Disease Management",
          "Implant Complication Prevention",
          "Periodontology Excellence",
          "Clinical Research Applications",
          "Long-term Implant Success"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "srenvert@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Swedish"],
        medicalSpecialties: ["Periodontology", "Implant Dentistry"],
        speakerType: "academic",
        fee: "7500"
      },
      {
        name: "Dr. Hom-Lay Wang",
        slug: "homlaywan",
        title: "Periodontics & Implant Regeneration Specialist",
        bio: "Prof. Dr. Hom-Lay Wang is a distinguished professor and researcher in periodontics and implant regeneration. His work focuses on advanced regenerative techniques and bone augmentation procedures.",
        expertise: ["Periodontics", "Implant Regeneration", "Bone Augmentation", "Regenerative Techniques", "Surgical Excellence"],
        location: "Ann Arbor, MI",
        overallRating: "4.94",
        reviewCount: 81,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Periodontics",
        achievements: [
          "Distinguished Professor",
          "Periodontics Research Leader",
          "Implant Regeneration Expert",
          "Bone Augmentation Authority"
        ],
        lectures: [
          "Advanced Periodontal Regeneration",
          "Implant Site Development",
          "Bone Augmentation Techniques",
          "Regenerative Surgical Protocols",
          "Clinical Excellence in Periodontics"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "hwang@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Mandarin"],
        medicalSpecialties: ["Periodontics", "Implant Dentistry", "Regenerative Medicine"],
        speakerType: "academic",
        fee: "8500"
      },
      {
        name: "Dr. Paulo Casentini",
        slug: "paulocasentini",
        title: "Oral Surgery & Implantology Expert",
        bio: "Dr. Paulo Casentini is a leading oral surgeon and implantologist with extensive experience in complex surgical procedures and immediate implant placement.",
        expertise: ["Oral Surgery", "Implantology", "Immediate Placement", "Complex Surgery", "Surgical Innovation"],
        location: "São Paulo, Brazil",
        overallRating: "4.90",
        reviewCount: 57,
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Oral Surgery",
        achievements: [
          "Oral Surgery Expert",
          "Implantology Specialist",
          "Immediate Placement Authority",
          "Complex Surgery Pioneer"
        ],
        lectures: [
          "Advanced Oral Surgery",
          "Immediate Implant Placement",
          "Complex Surgical Procedures",
          "Surgical Innovation Techniques",
          "Clinical Excellence in Surgery"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "pcasentini@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Portuguese"],
        medicalSpecialties: ["Oral Surgery", "Implantology"],
        speakerType: "clinical",
        fee: "6500"
      },
      {
        name: "Dr. France Lambert",
        slug: "francelambert",
        title: "Implant Dentistry & Digital Innovation Expert",
        bio: "Prof. Dr. France Lambert is an expert in implant dentistry and digital innovation. Her research focuses on digital planning and innovative treatment approaches in implant therapy.",
        expertise: ["Implant Dentistry", "Digital Innovation", "Digital Planning", "Treatment Innovation", "Clinical Research"],
        location: "Liège, Belgium",
        overallRating: "4.89",
        reviewCount: 46,
        imageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Implant Dentistry",
        achievements: [
          "Implant Dentistry Professor",
          "Digital Innovation Expert",
          "Digital Planning Authority",
          "Clinical Research Leader"
        ],
        lectures: [
          "Digital Implant Planning",
          "Innovation in Implant Therapy",
          "Clinical Research Applications",
          "Digital Treatment Protocols",
          "Future of Implant Dentistry"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "flambert@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "French"],
        medicalSpecialities: ["Implant Dentistry", "Digital Dentistry"],
        speakerType: "academic",
        fee: "7000"
      },
      {
        name: "Dr. Stephen Chen",
        slug: "stephenchen",
        title: "Implant Aesthetics & Soft Tissue Management",
        bio: "Dr. Stephen Chen is a specialist in implant aesthetics and soft tissue management. He focuses on achieving optimal aesthetic outcomes in the anterior zone with advanced soft tissue techniques.",
        expertise: ["Implant Aesthetics", "Soft Tissue Management", "Anterior Zone", "Aesthetic Outcomes", "Tissue Techniques"],
        location: "Melbourne, Australia",
        overallRating: "4.91",
        reviewCount: 62,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Esthetic Dentistry",
        achievements: [
          "Implant Aesthetics Expert",
          "Soft Tissue Management Specialist",
          "Anterior Zone Authority",
          "Aesthetic Outcomes Pioneer"
        ],
        lectures: [
          "Implant Aesthetics Excellence",
          "Soft Tissue Management",
          "Anterior Zone Protocols",
          "Aesthetic Outcome Optimization",
          "Advanced Tissue Techniques"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "schen@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English"],
        medicalSpecialties: ["Implant Dentistry", "Esthetic Dentistry"],
        speakerType: "clinical",
        fee: "7000"
      },
      {
        name: "Dr. Nikos Mattheos",
        slug: "nikosmattheos",
        title: "Digital Implant Education & Research",
        bio: "Prof. Dr. Nikos Mattheos is a leader in digital implant education and research. He focuses on evidence-based implant therapy and digital education methodologies.",
        expertise: ["Digital Education", "Implant Research", "Evidence-Based Practice", "Digital Methodologies", "Clinical Teaching"],
        location: "Hong Kong / Sweden",
        overallRating: "4.87",
        reviewCount: 53,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Digital Dentistry",
        achievements: [
          "Digital Education Leader",
          "Implant Research Expert",
          "Evidence-Based Practice Authority",
          "Digital Methodology Pioneer"
        ],
        lectures: [
          "Digital Implant Education",
          "Evidence-Based Implant Therapy",
          "Digital Learning Methodologies",
          "Clinical Teaching Excellence",
          "Research in Digital Dentistry"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "nmattheos@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Greek", "Swedish"],
        medicalSpecialties: ["Digital Dentistry", "Implant Dentistry", "Education"],
        speakerType: "academic",
        fee: "6500"
      },
      {
        name: "Dr. Pascal Magne",
        slug: "pascalmagne",
        title: "Biomimetic Dentistry & Adhesive Restoration",
        bio: "Prof. Dr. Pascal Magne is a world expert in biomimetic dentistry and adhesive restorations. His research focuses on minimally invasive techniques and biomimetic approaches to dental restoration.",
        expertise: ["Biomimetic Dentistry", "Adhesive Restorations", "Minimally Invasive", "Biomimetic Approaches", "Restorative Innovation"],
        location: "Los Angeles, CA",
        overallRating: "4.93",
        reviewCount: 75,
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Esthetic Dentistry",
        achievements: [
          "Biomimetic Dentistry Pioneer",
          "Adhesive Restoration Expert",
          "Minimally Invasive Authority",
          "Restorative Innovation Leader"
        ],
        lectures: [
          "Biomimetic Dentistry Principles",
          "Advanced Adhesive Techniques",
          "Minimally Invasive Restorations",
          "Biomimetic Treatment Approaches",
          "Innovation in Restorative Dentistry"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "pmagne@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "French"],
        medicalSpecialties: ["Restorative Dentistry", "Esthetic Dentistry", "Biomimetic Dentistry"],
        speakerType: "academic",
        fee: "8500"
      },
      {
        name: "Dr. Urs Belser",
        slug: "ursbelser",
        title: "Implant Prosthodontics & Aesthetic Excellence",
        bio: "Prof. Dr. Urs Belser is a legendary figure in implant prosthodontics and aesthetic dentistry. His contributions to implant aesthetics and prosthodontic excellence have shaped modern dental practice.",
        expertise: ["Implant Prosthodontics", "Aesthetic Dentistry", "Prosthodontic Excellence", "Implant Aesthetics", "Clinical Mastery"],
        location: "Geneva, Switzerland",
        overallRating: "4.96",
        reviewCount: 89,
        imageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Prosthodontics",
        achievements: [
          "Implant Prosthodontics Legend",
          "Aesthetic Dentistry Pioneer",
          "Prosthodontic Excellence Authority",
          "International Recognition and Awards"
        ],
        lectures: [
          "Implant Prosthodontic Mastery",
          "Aesthetic Excellence in Dentistry",
          "Prosthodontic Treatment Planning",
          "Implant Aesthetic Outcomes",
          "Clinical Excellence Principles"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "ubelser@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German", "French"],
        medicalSpecialties: ["Prosthodontics", "Implant Dentistry", "Esthetic Dentistry"],
        speakerType: "academic",
        fee: "9500"
      },
      {
        name: "Dr. Marco Esposito",
        slug: "marcoesposito",
        title: "Evidence-Based Implant Dentistry Expert",
        bio: "Dr. Marco Esposito is a leading expert in evidence-based implant dentistry and systematic reviews. His research focuses on clinical evidence and best practices in implant therapy.",
        expertise: ["Evidence-Based Dentistry", "Systematic Reviews", "Clinical Evidence", "Implant Research", "Best Practices"],
        location: "Manchester, UK",
        overallRating: "4.88",
        reviewCount: 51,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Implant Dentistry",
        achievements: [
          "Evidence-Based Dentistry Expert",
          "Systematic Review Authority",
          "Clinical Evidence Specialist",
          "Implant Research Leader"
        ],
        lectures: [
          "Evidence-Based Implant Therapy",
          "Systematic Review Methodology",
          "Clinical Evidence Analysis",
          "Best Practices in Implant Dentistry",
          "Research Application in Practice"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "mesposito@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Italian"],
        medicalSpecialties: ["Implant Dentistry", "Evidence-Based Medicine", "Research"],
        speakerType: "research",
        fee: "6800"
      },
      {
        name: "Dr. Tony Daher",
        slug: "tonydaher",
        title: "Oral Surgery & Maxillofacial Reconstruction",
        bio: "Dr. Tony Daher is a specialist in oral surgery and maxillofacial reconstruction with extensive experience in complex surgical procedures and facial reconstruction.",
        expertise: ["Oral Surgery", "Maxillofacial Reconstruction", "Complex Surgery", "Facial Reconstruction", "Surgical Excellence"],
        location: "Beirut, Lebanon",
        overallRating: "4.90",
        reviewCount: 44,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Maxillofacial Surgery",
        achievements: [
          "Oral Surgery Specialist",
          "Maxillofacial Reconstruction Expert",
          "Complex Surgery Authority",
          "Facial Reconstruction Pioneer"
        ],
        lectures: [
          "Advanced Oral Surgery",
          "Maxillofacial Reconstruction",
          "Complex Surgical Procedures",
          "Facial Reconstruction Techniques",
          "Surgical Excellence in Practice"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "tdaher@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Arabic", "French"],
        medicalSpecialties: ["Oral Surgery", "Maxillofacial Surgery", "Reconstructive Surgery"],
        speakerType: "clinical",
        fee: "6000"
      },
      // Fix missing speaker with correct email format
      {
        name: "Dr. Panos Papaspyridakos", 
        slug: "panospapaspyridakos",
        title: "Prosthodontist & Implant Specialist",
        bio: "Dr. Panos Papaspyridakos is a distinguished prosthodontist and implant specialist with extensive experience in full arch rehabilitation and complex prosthetic reconstruction. He is recognized internationally for his expertise in digital workflows and innovative treatment protocols in implant dentistry.",
        expertise: ["Prosthodontics", "Implant Dentistry", "Full Arch Rehabilitation", "Digital Workflows", "Prosthetic Reconstruction"],
        location: "Toronto, Canada",
        overallRating: "4.94",
        reviewCount: 78,
        imageUrl: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Papaspyridakos.png",
        verified: true,
        featured: true,
        category: "Prosthodontics",
        achievements: [
          "Distinguished Prosthodontist",
          "Implant Specialist Expert",
          "Full Arch Rehabilitation Authority",
          "Digital Workflow Pioneer",
          "International Recognition"
        ],
        lectures: [
          "Advanced Prosthodontic Techniques",
          "Full Arch Rehabilitation Excellence",
          "Digital Workflow Integration",
          "Complex Prosthetic Reconstruction",
          "Innovative Treatment Protocols"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "ppapaspyridakos@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: ["https://www.instagram.com/panos__papaspyridakos/", "https://x.com/panospapa", "https://linkedin.com/in/panos-papaspyridakis"],
        instagramHandle: "panos__papaspyridakos",
        languages: ["English", "Greek"],
        medicalSpecialties: ["Prosthodontics", "Implant Dentistry"],
        speakerType: "academic",
        fee: "8500"
      },
      // Additional speakers from detailed website analysis
      {
        name: "Dr. Petra Ratka-Krüger",
        slug: "petraratka",
        title: "Periodontology & Regenerative Therapy Expert",
        bio: "Prof. Dr. Petra Ratka-Krüger is a leading expert in periodontology and regenerative therapy. Her research focuses on periodontal regeneration and innovative treatment approaches for periodontal diseases.",
        expertise: ["Periodontology", "Regenerative Therapy", "Periodontal Disease", "Clinical Research", "Treatment Innovation"],
        location: "Freiburg, Germany",
        overallRating: "4.90",
        reviewCount: 54,
        imageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Periodontology Professor",
          "Regenerative Therapy Expert",
          "Periodontal Disease Authority",
          "Clinical Research Leader"
        ],
        lectures: [
          "Advanced Periodontology",
          "Regenerative Therapy Techniques",
          "Periodontal Disease Management",
          "Clinical Research Applications",
          "Treatment Innovation in Periodontics"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "pratka@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Periodontology", "Regenerative Medicine"],
        speakerType: "academic",
        fee: "7200"
      },
      {
        name: "Dr. Bjarni Pjetursson",
        slug: "bjarnipjetursson",
        title: "Prosthodontics & Evidence-Based Dentistry",
        bio: "Prof. Dr. Bjarni Pjetursson is an expert in prosthodontics and evidence-based dentistry. His research focuses on long-term outcomes of dental restorations and evidence-based treatment planning.",
        expertise: ["Prosthodontics", "Evidence-Based Dentistry", "Long-term Outcomes", "Treatment Planning", "Clinical Research"],
        location: "Reykjavik, Iceland",
        overallRating: "4.91",
        reviewCount: 61,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Prosthodontics",
        achievements: [
          "Prosthodontics Professor",
          "Evidence-Based Dentistry Expert",
          "Long-term Outcomes Researcher",
          "Treatment Planning Authority"
        ],
        lectures: [
          "Evidence-Based Prosthodontics",
          "Long-term Treatment Outcomes",
          "Treatment Planning Excellence",
          "Clinical Research Methodology",
          "Prosthodontic Best Practices"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "bpjetursson@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Icelandic"],
        medicalSpecialties: ["Prosthodontics", "Evidence-Based Medicine"],
        speakerType: "academic",
        fee: "7500"
      },
      {
        name: "Dr. Christoph Hämmerle",
        slug: "christophhammerle",
        title: "Implant Dentistry & Tissue Engineering",
        bio: "Prof. Dr. Christoph Hämmerle is a world-renowned expert in implant dentistry and tissue engineering. His research has significantly advanced the field of guided bone regeneration and implant therapy.",
        expertise: ["Implant Dentistry", "Tissue Engineering", "Guided Bone Regeneration", "Clinical Research", "Surgical Innovation"],
        location: "Zurich, Switzerland",
        overallRating: "4.96",
        reviewCount: 92,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Implant Dentistry",
        achievements: [
          "Implant Dentistry Pioneer",
          "Tissue Engineering Expert",
          "Guided Bone Regeneration Authority",
          "International Research Leader",
          "Surgical Innovation Pioneer"
        ],
        lectures: [
          "Advanced Implant Dentistry",
          "Tissue Engineering Applications",
          "Guided Bone Regeneration",
          "Clinical Research Excellence",
          "Surgical Innovation Techniques"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "chammerle@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Implant Dentistry", "Tissue Engineering", "Oral Surgery"],
        speakerType: "academic",
        fee: "9000"
      },
      {
        name: "Dr. Tord Berglundh",
        slug: "tordberglundh",
        title: "Periodontology & Implant Research",
        bio: "Prof. Dr. Tord Berglundh is a distinguished researcher in periodontology and implant dentistry. His work focuses on the biological aspects of dental implants and periodontal therapy.",
        expertise: ["Periodontology", "Implant Research", "Biological Aspects", "Periodontal Therapy", "Clinical Research"],
        location: "Gothenburg, Sweden",
        overallRating: "4.93",
        reviewCount: 71,
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Periodontology Researcher",
          "Implant Research Expert",
          "Biological Aspects Authority",
          "Clinical Research Leader"
        ],
        lectures: [
          "Advanced Periodontology",
          "Implant Biology Research",
          "Periodontal Therapy Excellence",
          "Clinical Research Applications",
          "Biological Aspects of Implants"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "tberglundh@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "Swedish"],
        medicalSpecialties: ["Periodontology", "Implant Research"],
        speakerType: "academic",
        fee: "7800"
      },
      {
        name: "Dr. Urs Grunder",
        slug: "ursgrunder",
        title: "Implant Aesthetics & Soft Tissue Management",
        bio: "Dr. Urs Grunder is a pioneer in implant aesthetics and soft tissue management. His innovative approaches to anterior implant placement have set standards for aesthetic implant dentistry.",
        expertise: ["Implant Aesthetics", "Soft Tissue Management", "Anterior Implants", "Aesthetic Dentistry", "Surgical Excellence"],
        location: "Basel, Switzerland",
        overallRating: "4.95",
        reviewCount: 84,
        imageUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: true,
        category: "Esthetic Dentistry",
        achievements: [
          "Implant Aesthetics Pioneer",
          "Soft Tissue Management Expert",
          "Anterior Implant Authority",
          "Aesthetic Dentistry Leader"
        ],
        lectures: [
          "Implant Aesthetics Excellence",
          "Soft Tissue Management",
          "Anterior Implant Placement",
          "Aesthetic Treatment Planning",
          "Surgical Excellence in Aesthetics"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "ugrunder@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Implant Dentistry", "Esthetic Dentistry"],
        speakerType: "clinical",
        fee: "8500"
      },
      {
        name: "Dr. Jörg Neugebauer",
        slug: "jorgneugebauer",
        title: "Oral Surgery & Complex Implantology",
        bio: "Dr. Jörg Neugebauer is an expert in oral surgery and complex implantology. His expertise includes advanced surgical techniques and complex implant rehabilitation.",
        expertise: ["Oral Surgery", "Complex Implantology", "Advanced Surgery", "Implant Rehabilitation", "Surgical Innovation"],
        location: "Landsberg, Germany",
        overallRating: "4.89",
        reviewCount: 47,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Oral Surgery",
        achievements: [
          "Oral Surgery Expert",
          "Complex Implantology Specialist",
          "Advanced Surgery Authority",
          "Surgical Innovation Pioneer"
        ],
        lectures: [
          "Advanced Oral Surgery",
          "Complex Implantology",
          "Surgical Innovation Techniques",
          "Implant Rehabilitation",
          "Clinical Excellence in Surgery"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "jneugebauer@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Oral Surgery", "Implantology"],
        speakerType: "clinical",
        fee: "6800"
      },
      {
        name: "Dr. Thomas Kocher",
        slug: "thomaskocher",
        title: "Periodontology & Preventive Dentistry",
        bio: "Prof. Dr. Thomas Kocher is an expert in periodontology and preventive dentistry. His research focuses on periodontal disease prevention and population-based oral health studies.",
        expertise: ["Periodontology", "Preventive Dentistry", "Disease Prevention", "Population Health", "Clinical Research"],
        location: "Greifswald, Germany",
        overallRating: "4.87",
        reviewCount: 43,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
        verified: true,
        featured: false,
        category: "Periodontics",
        achievements: [
          "Periodontology Professor",
          "Preventive Dentistry Expert",
          "Disease Prevention Authority",
          "Population Health Researcher"
        ],
        lectures: [
          "Preventive Periodontology",
          "Disease Prevention Strategies",
          "Population Oral Health",
          "Clinical Research Applications",
          "Periodontal Health Management"
        ],
        eventPhotos: [],
        speakingVideos: [],
        email: "tkocher@devrightspeakers.com",
        phone: "214-884-4100",
        website: "https://devrightspeakers.com",
        socialMedia: [],
        instagramHandle: null,
        languages: ["English", "German"],
        medicalSpecialties: ["Periodontology", "Preventive Dentistry"],
        speakerType: "academic",
        fee: "6500"
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
      },
      {
        speakerId: 5,
        reviewerName: "Dr. Sarah Mitchell",
        reviewerTitle: "Program Director",
        reviewerCompany: "American College of Prosthodontists",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Dr. Morton delivered an exceptional presentation on advanced prosthodontic treatment planning. His expertise as Chair of Prosthodontics at Indiana University and his work with the ITI brings unparalleled depth to his presentations. Outstanding professional collaboration.",
        eventType: "Annual Prosthodontic Conference",
        eventDate: "2024-03-15",
        verified: true
      },
      {
        speakerId: 5,
        reviewerName: "Dr. Robert Chen",
        reviewerTitle: "Department Chair",
        reviewerCompany: "University of Michigan School of Dentistry",
        overallRating: 5,
        speakingStyleRating: 4,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "Dr. Morton's presentation on digital workflows in implant prosthodontics was incredibly informative. His dual role as educator and clinician provides a unique perspective that resonates with both faculty and practitioners. Excellent speaker with deep expertise.",
        eventType: "Digital Dentistry Symposium",
        eventDate: "2024-01-18",
        verified: true
      },
      {
        speakerId: 5,
        reviewerName: "Dr. Jennifer Walsh",
        reviewerTitle: "Conference Chair",
        reviewerCompany: "International Team for Implantology",
        overallRating: 4,
        speakingStyleRating: 4,
        podiumPresenceRating: 4,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "As a Fellow and Board member of ITI, Dr. Morton brought exceptional clinical expertise to our international congress. His presentation on interdisciplinary treatment approaches was well-received by our global audience. Professional and knowledgeable speaker.",
        eventType: "ITI World Symposium",
        eventDate: "2024-04-12",
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

  async getSpeakerBySlug(slug: string): Promise<Speaker | undefined> {
    return Array.from(this.speakers.values()).find(speaker => speaker.slug === slug);
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