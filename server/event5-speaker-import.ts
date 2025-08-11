import { storage } from "./storage";
import type { InsertSpeaker } from "@shared/schema";

// North America Esthetic Days 2025 speakers from Event 5
const event5Speakers: InsertSpeaker[] = [
  {
    name: "Dr. Larissa Trojan",
    slug: "dr-larissa-trojan", 
    title: "Event Host & Dental Professional",
    email: "info@speakersphere.com",
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    location: "Washington, D.C.",
    expertise: ["Welcome Presentations", "Conference Hosting", "Dental Symposiums"],
    bio: "Event host and dental professional specializing in esthetic dentistry presentations and conference management.",
    category: "Digital Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Dr. James Mah",
    slug: "dr-james-mah",
    title: "Advanced Aligner Design Specialist", 
    email: "info@speakersphere.com",
    imageUrl: "https://www.unlv.edu/sites/default/files/styles/450_width/public/employee_images/James_Mah_2020_Close.jpg?itok=eGOL1J69",
    location: "Las Vegas, NV",
    expertise: ["Advanced Aligner Design", "Esthetic Patient Satisfaction", "Digital Treatment Planning"],
    bio: "Leading orthodontist and researcher specializing in advanced aligner design and digital orthodontic treatment planning for optimal esthetic outcomes.",
    category: "Digital Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Dr. Mark Lowe",
    slug: "dr-mark-lowe",
    title: "Strategic Case Selection Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://drloweortho.com/wp-content/uploads/2024/08/Dr-Lowe-Orthodontics-5.jpg",
    location: "United States",
    expertise: ["Strategic Case Selection", "Esthetic Excellence", "Orthodontic Treatment Planning"],
    bio: "Expert orthodontist specializing in strategic case selection for esthetic excellence and comprehensive treatment planning.",
    category: "Digital Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Dr. Jeff Briney",
    slug: "dr-jeff-briney",
    title: "Full-Face Dental Esthetics Specialist",
    email: "info@speakersphere.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752005060214-Cz_zOBwn.png",
    location: "United States",
    expertise: ["Full-Face Dental Esthetics", "Collaborative Dentistry", "Function and Beauty Integration"],
    bio: "Specialist in full-face dental esthetics with expertise in collaborative interdisciplinary approaches to comprehensive dental care.",
    category: "Digital Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Dr. Melissa Shotell",
    slug: "dr-melissa-shotell",
    title: "Ortho-Restorative Integration Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://learndentistry.com/wp-content/uploads/2019/10/Shotell-Melissa-5x7-1_flip.jpg.webp",
    location: "United States",
    expertise: ["Ortho-Restorative Integration", "Esthetic Excellence", "Comprehensive Treatment Planning"],
    bio: "Expert in ortho-restorative integration specializing in comprehensive treatment approaches for optimal esthetic outcomes.",
    category: "Digital Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Dr. Michael Cohen",
    slug: "dr-michael-cohen",
    title: "Myofunctional Therapy Specialist",
    email: "info@speakersphere.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752003854971-BcI22awP.png",
    location: "United States",
    expertise: ["Myofunctional Therapy", "Esthetic Integration", "Functional Treatment"],
    bio: "Specialist in myofunctional therapy with focus on integrating functional approaches with esthetic dental treatment.",
    category: "Digital Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Dr. Jasper Thoolen",
    slug: "dr-jasper-thoolen",
    title: "Clear Aligners & Implant Integration Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://straumannprod-h.assetsadobe2.com/is/image/content/dam/sites/group/xy/speakers-portraits/blurb/light-grey/Speaker_Jasper_Thoolen.png?fmt=png-alpha&wid=950",
    location: "Netherlands",
    expertise: ["Clear Aligners and Implant Integration", "Team-Based Approach", "Interdisciplinary Excellence"],
    bio: "International expert in combining clear aligner therapy with implant treatments using comprehensive team-based approaches.",
    category: "Implant Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English", "Dutch"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Dr. Mostafa Altalibi",
    slug: "dr-mostafa-altalibi",
    title: "Complex Esthetic Cases Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752005153612-CJTmqcbs.png",
    location: "United States",
    expertise: ["Advanced Clinical Features", "Complex Esthetic Cases", "Digital Treatment Design"],
    bio: "Expert in advanced clinical features for complex esthetic cases with specialization in digital treatment design and planning.",
    category: "Digital Dentistry",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  },
  {
    name: "Tracy Butler",
    slug: "tracy-butler",
    title: "Practice Management & Team Workflow Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.perfectsmilesdentalcare.com/wp-content/uploads/2024/02/dr-tracy-boldry-jpg.webp",
    location: "United States",
    expertise: ["Team Workflow Optimization", "Hygienist Integration", "Practice Efficiency"],
    bio: "Practice management specialist focusing on team workflow optimization and leveraging hygienist expertise for enhanced practice efficiency.",
    category: "Practice Management",
    achievements: [],
    lectures: [],
    languages: ["English"],
    medicalSpecialties: [],
    speakerType: "keynote",
    featured: false,
    verified: true,
    socialMedia: []
  }
];

export async function importEvent5Speakers(): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  console.log("🚀 Starting Event 5 speaker import from North America Esthetic Days 2025...");
  console.log(`Starting import of ${event5Speakers.length} Event 5 speakers...`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const speakerData of event5Speakers) {
    try {
      // Check if speaker already exists
      const existingSpeakers = await storage.getSpeakers({});
      const existingSpeaker = existingSpeakers.find((s: any) => 
        s.name.toLowerCase() === speakerData.name.toLowerCase()
      );

      if (existingSpeaker) {
        console.log(`⚠️  Speaker already exists: ${speakerData.name}`);
        continue;
      }

      // Create new speaker
      const speaker = await storage.createSpeaker(speakerData);
      console.log(`✅ Successfully imported: ${speaker.name}`);
      successCount++;

    } catch (error) {
      console.error(`❌ Error importing ${speakerData.name}:`, error);
      errors.push(`${speakerData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;
    }
  }

  console.log(`Event 5 import completed:`);
  console.log(`✅ Successfully imported: ${successCount} speakers`);
  console.log(`❌ Failed to import: ${errorCount} speakers`);
  
  return { successCount, errorCount, errors };
}