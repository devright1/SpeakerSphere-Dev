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

// Speakers from Greater New York Academy of Prosthodontics 70th Scientific Meeting
const gnyapSpeakers: SpeakerData[] = [
  {
    name: "Dr. Giacomo Fabbri",
    title: "Prosthodontist",
    specialty: "Zirconia Restorations",
    bio: "Expert in bonded zirconia minimal invasive restoration techniques with over 10 years of clinical experience.",
    presentation: "10-Year Clinical Experience with Bonded Zirconia Minimal Invasive Restoration: The New Normal?",
    email: "gfabbri@devrightspeakers.com",
    imageUrl: "https://www.nobelbiocare.com/sites/g/files/wdvifx201/files/styles/mobile_375_full_width_x1/public/Giacomo%20Fabbri.png.webp?itok=e-Snsspn",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Yu Zhang",
    title: "Professor of Digital Dentistry",
    specialty: "Ceramic Technology",
    bio: "Expert in next-generation ceramic machining and sintering technologies for digital dentistry applications.",
    presentation: "Next-Generation Ceramic Machining and Sintering Technologies for Digital Dentistry",
    email: "yzhang@devrightspeakers.com",
    imageUrl: "https://www.dental.upenn.edu/wp-content/uploads/2020/08/Yu20Zhang-120x120.jpeg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Carlos de Carvalho",
    title: "Prosthodontist",
    specialty: "Adhesive Rehabilitation",
    bio: "Expert in contemporary adhesive rehabilitations with a critical perspective on modern techniques.",
    presentation: "A Critical Perspective on Contemporary Adhesive Rehabilitations",
    email: "cdecarvalho@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752677393017-DF4u1drC.png",
    category: "Restorative Dentistry"
  },
  {
    name: "Dr. Iñaki Gamborena",
    title: "Prosthodontist",
    specialty: "Aesthetic Implant Dentistry",
    bio: "Expert in surgical and prosthetic considerations for achieving optimal esthetic outcomes in the esthetic area.",
    presentation: "Key Surgical and Prosthetic Considerations to Achieve Optimal Esthetic Outcomes in the Esthetic Area",
    email: "igamborena@devrightspeakers.com",
    imageUrl: "https://www.premiumdentalclinics.com/assets/images/people/gamborena.jpg",
    category: "Aesthetic Dentistry"
  },
  {
    name: "Dr. Andrea Ricci",
    title: "Prosthodontist",
    specialty: "Terminal Dentition Restoration",
    bio: "Expert in restoring terminal dentition from esthetic diagnosis to follow-up procedures.",
    presentation: "How to Restore a Terminal Dentition – From Esthetic Diagnosis to Follow-up",
    email: "aricci@devrightspeakers.com",
    imageUrl: "https://www.digitalsmiledesignclinics.com/hubfs/digitalsmiledesign.clinic/13_Studio_Ricci_Firenze/02_Master_Photo/Dr-Andrea-Ricci-v2.jpg",
    category: "Aesthetic Dentistry"
  },
  {
    name: "Dr. Thomas D. Taylor",
    title: "Oral Surgeon",
    specialty: "Implant Dentistry",
    bio: "Expert in implant dentistry with focus on debunking myths and evidence-based practice.",
    presentation: "Myths in Implant Dentistry",
    email: "ttaylor@devrightspeakers.com",
    imageUrl: "https://www.fixedprosthodontics.org/annual_meeting/2025_Annual_Scientific_Session/speakers/dr_thomas_taylor/image.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Marta Revilla León",
    title: "Digital Dentistry Specialist",
    specialty: "Virtual Patient Technology",
    bio: "Expert in working with virtual patients, digital occlusion, and artificial intelligence applications in dentistry.",
    presentation: "Working with the Virtual Patient: Parameters to Improve Its Accuracy, Digital Occlusion and Artificial Intelligence",
    email: "mrevillaleon@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752678208551-DXp_NsLB.png",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. David Norré",
    title: "Prosthodontist",
    specialty: "Full Arch Restoration",
    bio: "Expert in FP1 full arch restoration with predictable clinical approaches and methodologies.",
    presentation: "FP1 Full Arch Restoration: A Predictable Approach",
    email: "dnorre@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752678394606-CoV09D5Z.png",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Algirdas Puisys",
    title: "Periodontist",
    specialty: "Peri-Implantitis Treatment",
    bio: "Expert in prevention and treatment of peri-implantitis with advanced therapeutic approaches.",
    presentation: "Prevention and Treatment of Peri-Implantitis: How Far Can We Go?",
    email: "apuisys@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752678760844-B8ZM37Fb.png",
    category: "Periodontics"
  },
  {
    name: "Dr. Isabella Rocchietta",
    title: "Oral Surgeon",
    specialty: "Ridge Augmentation",
    bio: "Expert in managing vertical ridge deficiencies by means of guided bone regeneration (GBR).",
    presentation: "Managing Vertical Ridge Deficiencies by Means of GBR",
    email: "irocchietta@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752679122658-CsYUdlR6.png",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Howard Gluckman",
    title: "Oral Surgeon",
    specialty: "Partial Extraction Therapy",
    bio: "Expert in the evolution of partial extraction therapies and advanced surgical techniques.",
    presentation: "The Evolution of Partial Extraction Therapies",
    email: "hgluckman@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752679260074-DQe9qRHk.png",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Renato Cocconi",
    title: "Orthodontist",
    specialty: "Interdisciplinary Treatment",
    bio: "Expert in elective interdisciplinary treatment from orthodontics to ortho-facial dentistry.",
    presentation: "Elective Interdisciplinary Treatment: From Orthodontics to Ortho-facial Dentistry",
    email: "rcocconi@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752679490430-DpiH2RVM.png",
    category: "Orthodontics"
  },
  {
    name: "Dr. Oscar González-Martin",
    title: "Periodontist",
    specialty: "Perio-Prostho Treatment",
    bio: "Expert in fundamentals of perio-prostho treatment in the esthetic zone.",
    presentation: "Fundamentals in Perio-Prostho Treatment in the Esthetic Zone",
    email: "ogonzalezmartin@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752679521395-BbnKeTFa.png",
    category: "Periodontics"
  },
  {
    name: "Dr. Stephen J. Chu",
    title: "Prosthodontist",
    specialty: "Esthetic Implant Complications",
    bio: "Expert in esthetic implant complications, strategies to avoid and remediate midfacial recession.",
    presentation: "Esthetic Implant Complications: Strategies to Avoid and Remediate Midfacial Recession",
    email: "schu@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752679559224-CZrH-MdS.png",
    category: "Aesthetic Dentistry"
  },
  {
    name: "Dr. Jim Janakievski",
    title: "Oral Surgeon",
    specialty: "Segmental Osteotomy",
    bio: "Expert in advanced strategies using single-site segmental osteotomy to address specific dental challenges.",
    presentation: "Advanced Strategies Using a Single-site Segmental Osteotomy to Address Specific Dental Challenges",
    email: "jjanakievski@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752679678880-BwK5bIn7.png",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Anthony Sallustio",
    title: "Prosthodontist",
    specialty: "Full Arch Immediate Load",
    bio: "Expert in digital approach to full arch immediate load treatment with advanced methodologies.",
    presentation: "An Evolution of a Digital Approach to Full Arch Immediate Load Treatment",
    email: "asallustio@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752679713683-44NEjvI-.png",
    category: "Digital Dentistry"
  }
];

export class GNYAPSpeakerImporter {
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

    console.log(`Starting import of ${gnyapSpeakers.length} GNYAP speakers...`);

    for (const speakerData of gnyapSpeakers) {
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

    console.log(`GNYAP import completed:`);
    console.log(`✅ Successfully imported: ${results.success} speakers`);
    console.log(`❌ Failed to import: ${results.errors.length} speakers`);
    
    if (results.errors.length > 0) {
      console.log(`Errors:`);
      results.errors.forEach(error => console.log(`- ${error}`));
    }

    return results;
  }
}