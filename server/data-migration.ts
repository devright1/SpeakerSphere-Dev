import { DatabaseStorage } from "./database-storage";
import { MemStorage } from "./storage";
import { officialSpeakers } from "./official-speakers";

export class DataMigration {
  private dbStorage: DatabaseStorage;
  private memStorage: MemStorage;

  constructor() {
    this.dbStorage = new DatabaseStorage();
    this.memStorage = new MemStorage();
  }

  async migrateAllData(): Promise<void> {
    console.log("Starting data migration to PostgreSQL...");

    try {
      // Migrate categories first
      await this.migrateCategories();
      
      // Migrate speakers
      await this.migrateSpeakers();
      
      // Migrate reviews and videos
      await this.migrateReviews();
      await this.migrateVideos();
      
      console.log("✅ Data migration completed successfully!");
    } catch (error) {
      console.error("❌ Data migration failed:", error);
      throw error;
    }
  }

  private async migrateCategories(): Promise<void> {
    console.log("Migrating categories...");
    
    const categoriesData = [
      { name: "Digital Dentistry", description: "CAD/CAM, 3D printing, and digital workflow solutions", speakerCount: 0 },
      { name: "Prosthodontics", description: "Restorative dentistry and prosthetic rehabilitation", speakerCount: 0 },
      { name: "Esthetic Dentistry", description: "Cosmetic procedures and smile design", speakerCount: 0 },
      { name: "Orthodontics", description: "Teeth straightening and bite correction", speakerCount: 0 },
      { name: "Implant Dentistry", description: "Dental implants and osseointegration", speakerCount: 0 },
      { name: "Periodontics", description: "Gum disease treatment and periodontal therapy", speakerCount: 0 },
      { name: "Oral Surgery", description: "Surgical procedures in the oral cavity", speakerCount: 0 },
      { name: "Maxillofacial Surgery", description: "Complex facial and jaw surgical procedures", speakerCount: 0 },
      { name: "Practice Management", description: "Dental practice operations and business growth", speakerCount: 0 },
      { name: "Event Management", description: "Professional event coordination and management", speakerCount: 0 },
    ];

    for (const category of categoriesData) {
      try {
        await this.dbStorage.createCategory(category);
      } catch (error) {
        // Category might already exist, continue
        console.log(`Category ${category.name} might already exist, continuing...`);
      }
    }
  }

  private async migrateSpeakers(): Promise<void> {
    console.log("Migrating speakers...");
    
    for (const speakerData of officialSpeakers) {
      try {
        // Check if speaker already exists
        const existingSpeaker = await this.dbStorage.getSpeakerBySlug(speakerData.slug);
        
        if (!existingSpeaker) {
          const speakerToInsert = {
            ...speakerData,
            overallRating: speakerData.overallRating,
            reviewCount: speakerData.reviewCount,
            verified: speakerData.verified,
            featured: speakerData.featured,
            hideProfile: false, // Ensure all migrated speakers are visible
            hideRatings: false,
            hideSocial: false,
            hideContact: false
          };
          
          await this.dbStorage.createSpeaker(speakerToInsert);
          console.log(`✅ Migrated speaker: ${speakerData.name}`);
        } else {
          console.log(`Speaker ${speakerData.name} already exists, skipping...`);
        }
      } catch (error) {
        console.error(`Failed to migrate speaker ${speakerData.name}:`, error);
      }
    }
  }

  private async migrateReviews(): Promise<void> {
    console.log("Migrating reviews...");
    
    const reviewsData = [
      {
        speakerId: 1,
        reviewerName: "Dr. Sarah Mitchell",
        reviewerTitle: "Conference Director",
        reviewerCompany: "American College of Dental Surgeons",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 5,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 4,
        comment: "Dr. Polido delivered an exceptional presentation on zygomatic implant techniques. His technical expertise combined with clear communication made complex surgical concepts accessible to our diverse audience.",
        eventType: "Dental Conference",
        eventDate: "2024-01-15",
        verified: true,
        approvalStatus: "approved" as const,
        createdAt: new Date("2024-01-15")
      },
      {
        speakerId: 2,
        reviewerName: "Dr. Michael Chen",
        reviewerTitle: "Department Chair",
        reviewerCompany: "University of California San Francisco",
        overallRating: 5,
        speakingStyleRating: 5,
        podiumPresenceRating: 5,
        technicalProficiencyRating: 4,
        contentRelevanceRating: 5,
        easeOfWorkingRating: 5,
        visualDesignRating: 5,
        comment: "Dr. Martin's presentation on team-based implant workflows was incredibly valuable. His real-world case studies and practical solutions directly addressed our clinical challenges.",
        eventType: "Prosthodontic Summit",
        eventDate: "2024-02-20",
        verified: true,
        approvalStatus: "approved" as const,
        createdAt: new Date("2024-02-20")
      }
    ];

    for (const reviewData of reviewsData) {
      try {
        await this.dbStorage.createReview(reviewData);
      } catch (error) {
        console.log(`Review might already exist, continuing...`);
      }
    }
  }

  private async migrateVideos(): Promise<void> {
    console.log("Migrating videos...");
    
    const videosData = [
      {
        speakerId: 1,
        title: "Zygomatic Implant Techniques",
        description: "Advanced surgical techniques for zygomatic implant placement",
        videoUrl: "https://example.com/video1",
        thumbnailUrl: "https://example.com/thumb1",
        duration: 1800,
        videoType: "lecture" as const,
        eventName: "Full Arch Forum 2024",
        eventDate: "2024-01-15",
        topics: ["Zygomatic Implants", "Surgical Techniques", "Complex Cases"],
        viewCount: 2500,
        featured: true,
        createdAt: new Date("2024-01-15")
      },
      {
        speakerId: 2,
        title: "Team-Based Implant Workflows",
        description: "Collaborative approaches to implant dentistry",
        videoUrl: "https://example.com/video2",
        thumbnailUrl: "https://example.com/thumb2",
        duration: 2100,
        videoType: "workshop" as const,
        eventName: "Prosthodontic Summit 2024",
        eventDate: "2024-02-20",
        topics: ["Team Collaboration", "Implant Protocols", "Workflow Optimization"],
        viewCount: 1800,
        featured: true,
        createdAt: new Date("2024-02-20")
      }
    ];

    for (const videoData of videosData) {
      try {
        await this.dbStorage.createVideo(videoData);
      } catch (error) {
        console.log(`Video might already exist, continuing...`);
      }
    }
  }

  async checkMigrationStatus(): Promise<boolean> {
    try {
      const speakers = await this.dbStorage.getSpeakers();
      const categories = await this.dbStorage.getCategories();
      
      console.log(`Database contains: ${speakers.length} speakers, ${categories.length} categories`);
      
      return speakers.length > 0 && categories.length > 0;
    } catch (error) {
      console.error("Failed to check migration status:", error);
      return false;
    }
  }
}