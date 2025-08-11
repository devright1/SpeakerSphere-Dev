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

// Speakers from American Academy of Esthetic Dentistry 50th Annual Meeting
const aaedSpeakers: SpeakerData[] = [
  {
    name: "Dr. John C. Kois",
    title: "Prosthodontist",
    specialty: "Bruxism Management",
    bio: "Expert in bruxism management and occlusal therapy with extensive clinical experience in treating complex cases.",
    presentation: "Bruxism Revisited: Manageable, Treatable, or Inevitable?",
    email: "jkois@devrightspeakers.com",
    imageUrl: "https://www.estheticacademy.org/resource/resmgr/2025_annual_meeting/speakers/Kois_Headshot.jpg",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Marianna Evans",
    title: "Orthodontist",
    specialty: "Midfacial Expansion",
    bio: "Expert in midfacial non-surgical expansion with MARPE, focusing on esthetic and systemic benefits.",
    presentation: "Midfacial Non-Surgical Expansion with MARPE: From Esthetic to Systemic Benefits",
    email: "mevans@devrightspeakers.com",
    imageUrl: "https://www.estheticacademy.org/resource/resmgr/2025_annual_meeting/Evans_Headshot.jpg",
    category: "Orthodontics"
  },
  {
    name: "Dr. Eric Van Dooren",
    title: "Periodontist",
    specialty: "Perio-Prosthodontics",
    bio: "Expert in sequencing perio-prosthodontic treatment with healing guided by design principles.",
    presentation: "Sequencing Perio-Pros: Healing Guided by Design",
    email: "evandooren@devrightspeakers.com",
    imageUrl: "https://cdn.ymaws.com/estheticacademy.site-ym.com/resource/resmgr/2025_annual_meeting/speakers/van-dooren_headshot.jpg",
    category: "Periodontics"
  },
  {
    name: "Dr. Nitzan Bichacho",
    title: "Prosthodontist",
    specialty: "Cervical Contouring",
    bio: "Expert in cervical contouring concepts with 40 years of clinical experience and research insights.",
    presentation: "Cervical Contouring Concepts - 40 years - What did we learn?",
    email: "nbichacho@devrightspeakers.com",
    imageUrl: "https://www.estheticacademy.org/resource/resmgr/2025_annual_meeting/Nitzan-Bichacho_Headshot.png",
    category: "Aesthetic Dentistry"
  },
  {
    name: "Dr. Gonzalo Blasi",
    title: "Prosthodontist",
    specialty: "Complex Esthetic Cases",
    bio: "Expert in interdisciplinary approach for complex esthetic cases with comprehensive treatment planning.",
    presentation: "Interdisciplinary Approach for Complex Esthetic Cases",
    email: "gblasi@devrightspeakers.com",
    imageUrl: "https://cdn.ymaws.com/estheticacademy.site-ym.com/resource/resmgr/2025_annual_meeting/speakers/gonzalo-blasi_headshot.jpg",
    category: "Aesthetic Dentistry"
  },
  {
    name: "Dr. Alvaro Blasi",
    title: "Orthodontist",
    specialty: "Interdisciplinary Treatment",
    bio: "Expert in interdisciplinary approach for complex esthetic cases with advanced orthodontic techniques.",
    presentation: "Interdisciplinary Approach for Complex Esthetic Cases",
    email: "ablasi@devrightspeakers.com",
    imageUrl: "https://www.estheticacademy.org/resource/resmgr/2025_annual_meeting/speakers/Alvaro-Blasi-scaled.jpg",
    category: "Orthodontics"
  },
  {
    name: "Dr. Didier Dietschi",
    title: "Prosthodontist",
    specialty: "Adhesive Protocols",
    bio: "Expert in modern adhesive protocols for indirect bonded posterior restorations with 25 years of clinical success.",
    presentation: "25 Years of Clinical Success and Scientific Evidence with Modern Adhesive Protocols for Indirect Bonded Posterior Restorations",
    email: "ddietschi@devrightspeakers.com",
    imageUrl: "https://cdn.ymaws.com/estheticacademy.site-ym.com/resource/resmgr/2025_annual_meeting/speakers/dietschi_headshot.jpg",
    category: "Restorative Dentistry"
  },
  {
    name: "Dr. Agne Malisauskiene",
    title: "Restorative Dentist",
    specialty: "Direct Anterior Restorations",
    bio: "Expert in direct anterior restorations with advanced techniques for connecting the dots in treatment.",
    presentation: "Connect the Dots in Direct Anterior Restorations",
    email: "amalisauskiene@devrightspeakers.com",
    imageUrl: "https://cdn.ymaws.com/estheticacademy.site-ym.com/resource/resmgr/2025_annual_meeting/speakers/malisauskiene-_headshot.jpg",
    category: "Restorative Dentistry"
  },
  {
    name: "Dr. Jeff Rouse",
    title: "Prosthodontist",
    specialty: "Pathway Wear",
    bio: "Expert in shifting paradigms from mechanical to biologic explanations of pathway wear.",
    presentation: "Shifting Paradigms from Mechanical to Biologic Explanations of Pathway Wear",
    email: "jrouse@devrightspeakers.com",
    imageUrl: "https://cdn.ymaws.com/estheticacademy.site-ym.com/resource/resmgr/2025_annual_meeting/speakers/rouse_headshot.jpg",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Michael Gunson",
    title: "Oral Surgeon",
    specialty: "Airway and Smile Integration",
    bio: "Expert in connecting lips, teeth, tongue, and airway through the smile ring concept.",
    presentation: "The Smile Ring: Connecting the Lips, Teeth, Tongue, and Airway",
    email: "mgunson@devrightspeakers.com",
    imageUrl: "https://www.estheticacademy.org/resource/resmgr/2025_annual_meeting/speakers/Gunson-headshot.jpg",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Jeffrey McClendon",
    title: "Orthodontist",
    specialty: "Airway Orthodontics",
    bio: "Expert in airway orthodontics and comprehensive smile ring treatment approaches.",
    presentation: "The Smile Ring: Connecting the Lips, Teeth, Tongue, and Airway",
    email: "jmcclendon@devrightspeakers.com",
    imageUrl: "https://www.estheticacademy.org/resource/resmgr/2025_annual_meeting/speakers/McClendon.jpg",
    category: "Orthodontics"
  },
  {
    name: "Dr. Christian Coachman",
    title: "Prosthodontist",
    specialty: "Digital Smile Design",
    bio: "Pioneer in Digital Smile Design and expert in 7 steps from conventional towards ideal dentistry.",
    presentation: "7 Steps from Conventional towards Ideal Dentistry",
    email: "ccoachman@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/christian-coachman-aaed.png",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Lorenzo Breschi",
    title: "Restorative Dentist",
    specialty: "Adhesive Technology",
    bio: "Expert in advancements in universal adhesives and cements with cutting-edge techniques.",
    presentation: "Advancements in Universal Adhesives and Cements: Cutting-Edge Techniques and Clinical Protocols",
    email: "lbreschi@devrightspeakers.com",
    imageUrl: "https://www.unibo.it/uniboweb/utils/UserImage.aspx?IdAnagrafica=217556&IdFoto=69020ca0",
    category: "Restorative Dentistry"
  },
  {
    name: "Dr. Galip Gurel",
    title: "Prosthodontist",
    specialty: "Aesthetic Dentistry 4.0",
    bio: "Pioneer in Aesthetic Dentistry 4.0 with advanced digital and technological approaches.",
    presentation: "Aesthetic Dentistry 4.0",
    email: "ggurel@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/galip-gurel-aaed-new.png",
    category: "Aesthetic Dentistry"
  },
  {
    name: "Dr. Jonathan Esquivel",
    title: "Periodontist",
    specialty: "Perio-Prosthodontic Integration",
    bio: "Expert in the quest for esthetic and biological stability at the perio-prosthodontic crossroads.",
    presentation: "The Quest for Esthetic and Biological Stability: The Perio-Prosthodontic Crossroads",
    email: "jesquivel@devrightspeakers.com",
    imageUrl: "https://img1.wsimg.com/isteam/ip/d6c7d477-4843-4a4f-a7b0-4e810a1dd7f2/Jonathan%20Esquivel1.JPG/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:1240,cg:true",
    category: "Periodontics"
  },
  {
    name: "Dr. Ramon Gomez-Meda",
    title: "Prosthodontist",
    specialty: "Biological Stability",
    bio: "Expert in achieving esthetic and biological stability through perio-prosthodontic integration.",
    presentation: "The Quest for Esthetic and Biological Stability: The Perio-Prosthodontic Crossroads",
    email: "rgomezmeda@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752776330702-BNIc2npj.png",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Junji Tagami",
    title: "Restorative Dentist",
    specialty: "Bonding Procedures",
    bio: "Expert in procedures to obtain maximum bonding in clinical situations with advanced protocols.",
    presentation: "Procedures to Obtain the Maximum Bonding in Clinical Situation",
    email: "jtagami@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/junji-tagami-aaed-new.png",
    category: "Restorative Dentistry"
  },
  {
    name: "Dr. Alonso Carrasco-Labra",
    title: "Evidence-Based Dentistry Specialist",
    specialty: "AI-Powered Research",
    bio: "Expert in AI-powered systematic reviews and evidence-based clinical practice guidelines.",
    presentation: "AI-powered Systematic Reviews and Evidence-based Clinical Practice Guidelines",
    email: "acarrasco@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/alonso-carrasco-labra-aaed.jpg",
    category: "Research and Evidence"
  },
  {
    name: "Dr. Gerard J. Chiche",
    title: "Prosthodontist",
    specialty: "Zirconia Restorations",
    bio: "Expert in zirconia restorations from scientific data to clinical management.",
    presentation: "Zirconia Restorations - from Scientific Data to Clinical Management",
    email: "gchiche@devrightspeakers.com",
    imageUrl: "https://brasselerusadental.com/wp-content/uploads/sites/9/2021/11/dr-gerard-chiche.jpg",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Oded Bahat",
    title: "Oral Surgeon",
    specialty: "Tissue Reconstruction",
    bio: "Expert in enhancing oral and facial aesthetics through integrated surgical and prosthetic approaches.",
    presentation: "Enhancing Oral and Facial Aesthetics and Function: Integrating Surgical, Prosthetic, and Implant-Based Tissue Reconstruction",
    email: "obahat@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/oded-bahat-aaed.jpg",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Peter Wohrle",
    title: "Prosthodontist",
    specialty: "Implant Reconstruction",
    bio: "Expert in implant-based tissue reconstruction for enhanced oral and facial aesthetics.",
    presentation: "Enhancing Oral and Facial Aesthetics and Function: Integrating Surgical, Prosthetic, and Implant-Based Tissue Reconstruction",
    email: "pwohrle@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/peter-wohrle-aaed.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Naoki Hayashi",
    title: "Dental Technician",
    specialty: "Aesthetic Ceramics",
    bio: "Master ceramic artist and dental technician specializing in aesthetic dental ceramics and beauty concepts.",
    presentation: "Dear Beauté",
    email: "nhayashi@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/naoki-hayashi-aaed.jpg",
    category: "Dental Technology"
  },
  {
    name: "James Cowherd",
    title: "Business Consultant",
    specialty: "Practice Management",
    bio: "Expert in creating unreasonable hospitality for dental offices and exceptional patient experiences.",
    presentation: "Unreasonable Hospitality for the Dental Office",
    email: "jcowherd@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/james-cowherd-aaed.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Markus Hürzeler",
    title: "Periodontist",
    specialty: "Implant Aesthetics",
    bio: "Expert in improvements with implants in the esthetic zone through major paradigm shifts.",
    presentation: "Improvements with Implants in the Esthetic Zone – Only Possible with a Major Paradigm Shift",
    email: "mhurzeler@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/markus-hurzeler-aaed.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Marco Veneziani",
    title: "Prosthodontist",
    specialty: "Posterior Restorations",
    bio: "Expert in indirect posterior restorations using morphology driven preparation techniques.",
    presentation: "Indirect Posterior Restorations: the Morphology Driven Preparation Technique and Updated Clinical Procedures",
    email: "mvenezioni@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/marco-veneziani-aaed.jpg",
    category: "Restorative Dentistry"
  },
  {
    name: "Dr. Gustavo Giordani",
    title: "Digital Dentist",
    specialty: "Digital Interdisciplinary Treatment",
    bio: "Expert in digital interdisciplinary treatments in the esthetic zone with advanced technologies.",
    presentation: "Digital Interdisciplinary Treatments in Esthetic Zone",
    email: "ggiordani@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/gustavo-giordani-aaed.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Frank M. Spear",
    title: "Prosthodontist",
    specialty: "Practice Philosophy",
    bio: "Expert in creating memorable moments in dental practice and life philosophy for dentists.",
    presentation: "The Importance of Creating Memorable Moments in Your Practice and Your Life",
    email: "fspear@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/frank-spear-aaed.jpg",
    category: "Practice Management"
  }
];

export class AAEDSpeakerImporter {
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

    console.log(`Starting import of ${aaedSpeakers.length} AAED speakers...`);

    for (const speakerData of aaedSpeakers) {
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

    console.log(`AAED import completed:`);
    console.log(`✅ Successfully imported: ${results.success} speakers`);
    console.log(`❌ Failed to import: ${results.errors.length} speakers`);
    
    if (results.errors.length > 0) {
      console.log(`Errors:`);
      results.errors.forEach(error => console.log(`- ${error}`));
    }

    return results;
  }
}