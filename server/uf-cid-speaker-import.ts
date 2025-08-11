import { db } from "./db";
import { speakers, categories } from "@shared/schema";
import { eq } from "drizzle-orm";

interface SpeakerData {
  name: string;
  title: string;
  specialty: string;
  bio: string;
  presentation: string;
  email: string;
  imageUrl: string;
  category: string;
}

// New speakers from UF Center for Implant Dentistry 25th Anniversary
const ufCidSpeakers: SpeakerData[] = [
  {
    name: "Dr. Daniel Buser",
    title: "Professor of Oral Surgery",
    specialty: "Implant Surgery and Bone Regeneration",
    bio: "World-renowned expert in implant surgery and bone regeneration with over 25 years of experience in surgical key-factors for successful long-term implant stability.",
    presentation: "Surgical key-factors for successful implants with long-term stability: What did we learn in the past 25 years?",
    email: "dbuser@devrightspeakers.com",
    imageUrl: "https://ce.dental.ufl.edu/wordpress/files/2025/02/Daniel_Buser-1.png",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. German Gallucci",
    title: "Professor of Prosthodontics",
    specialty: "Implant-Restorative Dentistry",
    bio: "Expert in implant-restorative considerations with extensive research and clinical experience in prosthetic rehabilitation of implant-supported restorations.",
    presentation: "Implant-Restorative Considerations",
    email: "ggallucci@devrightspeakers.com",
    imageUrl: "https://ce.dental.ufl.edu/wordpress/files/2025/02/German_Gallucci-1.png",
    category: "Implant Dentistry"
  }
];

export class UFCIDSpeakerImporter {
  async checkSpeakerExists(name: string): Promise<boolean> {
    try {
      const existingSpeakers = await db
        .select()
        .from(speakers)
        .where(eq(speakers.name, name));
      
      return existingSpeakers.length > 0;
    } catch (error) {
      console.error(`Error checking speaker existence for ${name}:`, error);
      return false;
    }
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/^dr\.?\s*/i, '') // Remove "Dr." prefix
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  async importSpeaker(speakerData: SpeakerData): Promise<{ success: boolean; speaker?: any; error?: string }> {
    try {
      // Check if speaker already exists
      const exists = await this.checkSpeakerExists(speakerData.name);
      if (exists) {
        return {
          success: false,
          error: `Speaker already exists in database`
        };
      }

      // Generate slug
      const slug = this.generateSlug(speakerData.name);

      // Create speaker in database
      const [newSpeaker] = await db
        .insert(speakers)
        .values({
          name: speakerData.name,
          title: speakerData.title,
          bio: `${speakerData.bio}\n\nPresentation: ${speakerData.presentation}`,
          slug: slug,
          imageUrl: speakerData.imageUrl,
          email: speakerData.email,
          phone: "",
          website: "",
          location: "United States",
          category: speakerData.category,
          expertise: [speakerData.specialty],
          achievements: [],
          lectures: [speakerData.presentation],
          languages: ["English"],
          medicalSpecialties: [speakerData.specialty],
          speakerType: "keynote",
          featured: false,
          verified: true,
          socialMedia: [],
          hideProfile: false
        })
        .returning();

      return {
        success: true,
        speaker: newSpeaker
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async importAllSpeakers(): Promise<{ success: number; errors: string[] }> {
    const results = {
      success: 0,
      errors: [] as string[]
    };

    console.log(`Starting import of ${ufCidSpeakers.length} UF CID speakers...`);

    for (const speakerData of ufCidSpeakers) {
      try {
        const result = await this.importSpeaker(speakerData);
        
        if (result.success) {
          console.log(`✅ Successfully imported: ${speakerData.name}`);
          results.success++;
        } else {
          const errorMsg = `Failed to import ${speakerData.name}: ${result.error}`;
          console.log(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Failed to import ${speakerData.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.log(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }

      // Add small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`UF CID import completed:`);
    console.log(`✅ Successfully imported: ${results.success} speakers`);
    console.log(`❌ Failed to import: ${results.errors.length} speakers`);
    
    if (results.errors.length > 0) {
      console.log(`Errors:`);
      results.errors.forEach(error => console.log(`- ${error}`));
    }

    return results;
  }
}