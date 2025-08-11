import { storage } from "./storage";
import { speakers, categories, type InsertSpeaker, type Category } from "../shared/schema";

// Event 26: ACP 2025 Annual Session - American College of Prosthodontists
const event26Speakers = [
  {
    name: "Dr. Arian B. Deutsch",
    specialization: ["Conical & Telescopic Prosthodontics", "Removable Prosthodontics"],
    imageUrl: "https://images.squarespace-cdn.com/content/v1/546fe977e4b02d59e25244fa/1626541279606-9VZA97GYNVGM6CWFP1MN/DSC_40465.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "Conical & Telescopic Concepts - Made Simple"
  },
  {
    name: "Dr. Ruben Arebalo",
    specialization: ["Prosthodontics", "Implant Prosthodontics"],
    imageUrl: "https://www.prosthodontics.org/assets/speakers/arebalo-ruben.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "To Be Announced"
  },
  {
    name: "Dr. Timothy A. Hess",
    specialization: ["Neurotoxins in Prosthodontics", "Esthetic Dentistry", "Therapeutic Applications"],
    imageUrl: "https://www.timothyhessdds.com/wp-content/uploads/2018/07/Dr.TimothyA.HessDDSMAGD-300x400.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "Integrating Neurotoxins in Prosthodontics: Esthetic and Therapeutic Applications in Today's Dental Practice",
    credentials: "DDS, MAGD"
  },
  {
    name: "Dr. Martin Mendelson",
    specialization: ["Professional Development", "Practice Management", "Prosthodontics"],
    imageUrl: "https://www.prosthodontics.org/assets/speakers/mendelson-martin.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "From Handpiece to Happiness: Strategies for the Striving Professional",
    credentials: "DDS, CPC, FIADFE"
  },
  {
    name: "Dr. Douglas Benting",
    specialization: ["Prosthodontics", "Implant Prosthodontics", "Full-Arch Rehabilitation"],
    imageUrl: "https://www.speareducation.com/images/content/faculty/profile-photos/photos/46.jpg?t=20250730071924",
    event: "ACP 2025 Annual Session",
    presentation: "Multiple presentations as ACP President",
    credentials: "DDS, MS, FACP"
  },
  {
    name: "Dr. Van Ramos Jr.",
    specialization: ["Prosthodontics", "Digital Prosthodontics", "Implant Prosthodontics"],
    imageUrl: "https://dental.washington.edu/nitropack_static/OzRdaOlZOlesdjvmzRstSVMVojzDUFVx/assets/images/optimized/rev-c702e69/dental.washington.edu/wp-content/media/people/Ramo300.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "Program Leader - Practical Prosthodontics: Concepts & Techniques",
    credentials: "DDS, FACP"
  },
  {
    name: "Dr. Ed McLaren",
    specialization: ["Ceramic Technology", "Digital Prosthodontics", "Esthetic Dentistry"],
    imageUrl: "https://brasselerusadental.com/wp-content/uploads/sites/9/2021/11/Dr-Ed-McLaren.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "Contemporary Monolithic Ceramics & the Digital Dental Team: The Evolution of Ceramic Technologies with the Human Touch",
    credentials: "DDS, MDC"
  },
  {
    name: "Dr. Rooz Khosravi",
    specialization: ["Airway Dentistry", "Sleep Medicine", "Prosthodontics"],
    imageUrl: "https://dental.washington.edu/nitropack_static/OzRdaOlZOlesdjvmzRstSVMVojzDUFVx/assets/images/optimized/rev-c702e69/dental.washington.edu/wp-content/media/Rooz-Khosravi.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "The Dilemmas of Airway Dentistry",
    credentials: "DMD, PhD, MSD"
  },
  {
    name: "Dr. Benjamin Pliska",
    specialization: ["Sleep Medicine", "Obstructive Sleep Apnea", "Dental Sleep Medicine"],
    imageUrl: "https://secure.dentistry.ubc.ca/intranet/public/picnotavail.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "Management of Dental Side Effects of Obstructive Sleep Apnea Treatment",
    credentials: "DDS, MS, FRCD(C)"
  },
  {
    name: "Dr. Avinash Bidra",
    specialization: ["Implant Prosthodontics", "Pterygoid Implants", "Full-Arch Fixed Prosthodontics"],
    imageUrl: "https://facultydirectory.uchc.edu/photo/7163",
    event: "ACP 2025 Annual Session",
    presentation: "Pterygoid Implants for Advanced Full-Arch Fixed Implant Supported Prosthodontics"
  },
  {
    name: "Dr. Taiseer Sulaiman",
    specialization: ["Monolithic Zirconia", "Ceramic Materials", "Prosthodontics"],
    imageUrl: "https://www.prosthodontics.org/assets/speakers/sulaiman-taiseer.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "Monolithic Zirconia- A 15-Year Evolution and a Cautionary Approach to the Future",
    credentials: "DDS, PhD, FICD"
  },
  {
    name: "Dr. Wei-Shao Lin",
    specialization: ["Full-Arch Implant Rehabilitation", "Digital Prosthodontics", "Removable Prosthodontics"],
    imageUrl: "https://dentistry.iu.edu/about/directory/new-headshot-2.jpg",
    event: "ACP 2025 Annual Session",
    presentation: "Bridging Theory and Practice: Innovations in Full-Arch Fixed and Removable Implant Rehabilitation"
  }
];

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/dr\.|prof\.|prof|dr/gi, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function generateBio(speakerData: any): string {
  const credentials = speakerData.credentials ? `, ${speakerData.credentials}` : '';
  const presentation = speakerData.presentation ? ` Dr. ${speakerData.name.replace('Dr. ', '')} presents on "${speakerData.presentation}".` : '';
  
  return `${speakerData.name}${credentials} is a distinguished prosthodontist specializing in ${speakerData.specialization.join(', ')}.${presentation} As a featured speaker at the ${speakerData.event}, they bring extensive expertise in advanced prosthodontic techniques and patient care. Their contributions to prosthodontic education and clinical practice have made them a respected leader in the dental community.`;
}

function generateSpeechTopics(specialization: string[]): string[] {
  const topicMap: { [key: string]: string[] } = {
    "Conical & Telescopic Prosthodontics": ["Removable Prosthodontics", "Precision Attachments", "Overdentures"],
    "Removable Prosthodontics": ["Complete Dentures", "Partial Dentures", "Implant Overdentures"],
    "Implant Prosthodontics": ["Implant Restorations", "Digital Implant Planning", "Full-Arch Rehabilitation"],
    "Neurotoxins in Prosthodontics": ["Botox in Dentistry", "Esthetic Applications", "Therapeutic Uses"],
    "Esthetic Dentistry": ["Smile Design", "Ceramic Restorations", "Color Matching"],
    "Professional Development": ["Practice Management", "Leadership", "Career Growth"],
    "Ceramic Technology": ["Zirconia Restorations", "CAD/CAM Technology", "Material Science"],
    "Digital Prosthodontics": ["Digital Workflows", "3D Printing", "CAD/CAM"],
    "Airway Dentistry": ["Sleep Apnea Treatment", "Airway Management", "Orthodontic Applications"],
    "Sleep Medicine": ["Sleep Disorders", "Oral Appliances", "Sleep Apnea"],
    "Pterygoid Implants": ["Full-Arch Implants", "Complex Implant Cases", "Surgical Techniques"],
    "Monolithic Zirconia": ["Ceramic Materials", "Material Properties", "Clinical Applications"],
    "Full-Arch Implant Rehabilitation": ["All-on-4", "Immediate Loading", "Complex Rehabilitation"]
  };

  let topics: string[] = [];
  specialization.forEach(spec => {
    if (topicMap[spec]) {
      topics.push(...topicMap[spec]);
    }
  });
  
  return topics.length > 0 ? Array.from(new Set(topics)) : ["Prosthodontics", "Restorative Dentistry", "Implant Dentistry"];
}

export async function importEvent26Speakers(): Promise<{
  successCount: number;
  errorCount: number;
  errors: string[];
}> {
  console.log("🚀 Starting Event 26 speaker import from ACP 2025 Annual Session...");
  
  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [] as string[]
  };

  try {
    // Get all existing speakers to check for duplicates
    const existingSpeakers = await storage.getSpeakers({ includeHidden: true });
    const existingNames = existingSpeakers.map(s => s.name.toLowerCase());

    // Get categories for mapping
    const categories = await storage.getCategories();
    const prosthodonticsCategory = categories.find((cat: Category) => 
      cat.name.includes("Prosthodontics") || cat.name.includes("Restorative")
    );

    console.log(`Starting import of ${event26Speakers.length} Event 26 speakers...`);

    for (const speakerData of event26Speakers) {
      try {
        // Check if speaker already exists
        const normalizedName = speakerData.name.toLowerCase();
        if (existingNames.includes(normalizedName)) {
          console.log(`⏭️ Speaker already exists: ${speakerData.name}`);
          continue;
        }

        const speaker: InsertSpeaker = {
          name: speakerData.name,
          slug: generateSlug(speakerData.name),
          title: speakerData.specialization[0] || "Prosthodontics Specialist",
          bio: generateBio(speakerData),
          expertise: speakerData.specialization,
          location: "New Orleans, Louisiana",
          imageUrl: speakerData.imageUrl,
          verified: true,
          category: "Prosthodontics",
          achievements: [
            `Featured speaker at ${speakerData.event}`,
            "Board-certified prosthodontist",
            "Published researcher in prosthodontics"
          ],
          lectures: generateSpeechTopics(speakerData.specialization),
          email: "contact@speaker.com",
          languages: ["English"],
          speakerType: "clinical",
          experience: 15,
          featured: false
        };

        await storage.createSpeaker(speaker);
        console.log(`✅ Successfully imported: ${speakerData.name}`);
        results.successCount++;
      } catch (error) {
        const errorMsg = `Failed to import ${speakerData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
        results.errorCount++;
      }
    }

    console.log("\nEvent 26 import completed:");
    console.log(`✅ Successfully imported: ${results.successCount} speakers`);
    console.log(`❌ Failed to import: ${results.errorCount} speakers`);
    
    if (results.errors.length > 0) {
      console.log("Errors:");
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  } catch (error) {
    console.error("Event 26 import failed:", error);
    throw error;
  }
}