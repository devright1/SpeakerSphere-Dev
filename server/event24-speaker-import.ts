import { storage } from "./storage";
import type { InsertSpeaker } from "@shared/schema";

// AAOMS 107th Annual Meeting 2025 speakers from Event 24
const event24Speakers: InsertSpeaker[] = [
  {
    name: "Terri Bradley, CPC",
    slug: "terri-bradley-cpc",
    title: "Medical Coding Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-BradleyT.jpg",
    location: "United States",
    expertise: ["Medical Coding", "Beyond the Basics Coding", "Healthcare Billing"],
    bio: "Certified Professional Coder specializing in advanced medical coding workshops and healthcare billing procedures for oral surgery practices.",
    category: "Practice Management",
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
    name: "Dr. John F. Caccamese Jr.",
    slug: "dr-john-f-caccamese-jr",
    title: "Craniomaxillofacial Surgery Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-CaccameseJ.jpg",
    location: "United States",
    expertise: ["Cleft and Craniomaxillofacial Care", "Oral and Maxillofacial Surgery", "Right Surgery Selection"],
    bio: "Leading expert in cleft and craniomaxillofacial care with extensive experience in complex surgical case selection and treatment planning.",
    category: "Oral Surgery",
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
    name: "Dr. Natasha Furchtgott",
    slug: "dr-natasha-furchtgott",
    title: "Craniomaxillofacial Surgery Specialist",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-FurchtgottN.jpg",
    location: "United States",
    expertise: ["Craniomaxillofacial Surgery", "Cleft Care", "Pediatric Oral Surgery"],
    bio: "Specialist in craniomaxillofacial surgery with focus on cleft care and pediatric oral surgical procedures.",
    category: "Oral Surgery",
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
    name: "Dr. Paul S. Tiwana",
    slug: "dr-paul-s-tiwana",
    title: "Oral and Maxillofacial Surgery Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-TiwanaP.jpg",
    location: "United States",
    expertise: ["Oral and Maxillofacial Surgery", "Craniomaxillofacial Care", "Surgical Case Planning"],
    bio: "Expert oral and maxillofacial surgeon specializing in complex craniomaxillofacial care and surgical case planning.",
    category: "Oral Surgery",
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
    name: "Dr. Issa Hanna",
    slug: "dr-issa-hanna",
    title: "Cleft and Craniofacial Surgery Specialist",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-HannaI.jpg",
    location: "United States",
    expertise: ["Cleft Surgery", "Craniofacial Surgery", "Pediatric Maxillofacial Surgery"],
    bio: "Specialist in cleft and craniofacial surgery with extensive experience in pediatric maxillofacial surgical procedures.",
    category: "Oral Surgery",
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
    name: "Dr. Faisal A. Quereshy",
    slug: "dr-faisal-a-quereshy",
    title: "Oral Surgery Education Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-QuerershyF.jpg",
    location: "United States",
    expertise: ["Oral Surgery Education", "Residency Training", "Academic Leadership"],
    bio: "Leading educator in oral surgery with expertise in residency training programs and academic leadership in maxillofacial surgery education.",
    category: "Oral Surgery",
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
    name: "Michael Beschloss",
    slug: "michael-beschloss",
    title: "Presidential Historian & Leadership Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-BeschlossM.jpg",
    location: "United States",
    expertise: ["Leadership Lessons", "Presidential History", "White House Leadership"],
    bio: "Renowned presidential historian and leadership expert delivering keynote presentations on leadership lessons from the White House.",
    category: "Practice Management",
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
    name: "Allen Robinson",
    slug: "allen-robinson",
    title: "Robotics Technology Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-RobinsonA.jpg",
    location: "United States",
    expertise: ["Robotics in Surgery", "OMS Practice Technology", "Neocis Systems"],
    bio: "Technology expert specializing in robotics applications for oral and maxillofacial surgery practices.",
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
    name: "Dr. Robert W. Emery III",
    slug: "dr-robert-w-emery-iii",
    title: "Navigated Surgery Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-EmeryR.jpg",
    location: "United States",
    expertise: ["Navigated Surgery", "X-Guide Technology", "Photogrammetry"],
    bio: "Expert in navigated surgery and X-Guide technology for enhanced efficiency and growth in oral surgery practices.",
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
    name: "Dr. Jay M. Neugarten",
    slug: "dr-jay-m-neugarten",
    title: "Virtual Surgical Planning Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropEFXUYVIU-Presenter-NeugartenJ.jpeg.jpg",
    location: "United States",
    expertise: ["Virtual Surgical Planning", "Custom Implants", "Orthognathic Surgery"],
    bio: "Expert in virtual surgical planning and custom implants for orthognathic surgery procedures.",
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
    name: "Dr. Sean P. Edwards",
    slug: "dr-sean-p-edwards",
    title: "Complete-Arch Implant Rehabilitation Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-EdwardsS.jpg",
    location: "United States",
    expertise: ["Complete-Arch Implant Rehabilitation", "Digital Implant Planning", "Scan to Smile Technology"],
    bio: "Leading expert in complete-arch implant rehabilitation with focus on digital workflow and scan-to-smile technology.",
    category: "Implant Dentistry",
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
    name: "Dr. Stephanie W. Yeung",
    slug: "dr-stephanie-w-yeung",
    title: "Digital Implant Rehabilitation Specialist",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-YeungS.jpg",
    location: "United States",
    expertise: ["Digital Implant Rehabilitation", "Complete-Arch Solutions", "Advanced Implant Planning"],
    bio: "Specialist in digital implant rehabilitation with expertise in complete-arch solutions and advanced implant planning procedures.",
    category: "Implant Dentistry",
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
    name: "Dr. Tuan G. Bui",
    slug: "dr-tuan-g-bui",
    title: "Ambulatory Anesthesia Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-BuiT.jpg",
    location: "United States",
    expertise: ["Ambulatory Anesthesia", "Modern Anesthetic Techniques", "Office-Based Surgery"],
    bio: "Expert in ambulatory anesthesia and modern anesthetic techniques for office-based oral surgery procedures.",
    category: "Anesthesia",
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
    name: "Dr. Likith V. Reddy",
    slug: "dr-likith-v-reddy",
    title: "Sleep Apnea Surgery Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-ReddyL(3).jpg",
    location: "United States",
    expertise: ["Obstructive Sleep Apnea", "Sleep Surgery", "Modern OSA Diagnosis"],
    bio: "Expert in modern diagnosis and surgical management of obstructive sleep apnea with focus on advanced treatment approaches.",
    category: "Sleep Medicine",
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
    name: "Dr. Matthew Fay",
    slug: "dr-matthew-fay",
    title: "Sleep Medicine Specialist",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-FayM.jpg",
    location: "United States",
    expertise: ["Sleep Medicine", "OSA Management", "Sleep Disorder Treatment"],
    bio: "Sleep medicine specialist with expertise in comprehensive OSA management and sleep disorder treatment approaches.",
    category: "Sleep Medicine",
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
    name: "Judy Kay Mausolf",
    slug: "judy-kay-mausolf",
    title: "Team Management & Leadership Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-MausolfJ.jpg",
    location: "United States",
    expertise: ["Team Alignment", "Burnout Prevention", "Staff Retention"],
    bio: "Leadership expert specializing in team alignment, cohesiveness, and strategies to decrease burnout, stress, and turnover in healthcare practices.",
    category: "Practice Management",
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
    name: "Shannon B. Williams",
    slug: "shannon-b-williams",
    title: "Workforce Development Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-WilliamsS.jpg",
    location: "United States",
    expertise: ["Workforce Training", "Staff Retention", "Healthcare Leadership"],
    bio: "Workforce development expert focusing on effective strategies for training, retention, and leadership in healthcare environments.",
    category: "Practice Management",
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
    name: "Arthur W. Curley, JD",
    slug: "arthur-w-curley-jd",
    title: "Healthcare Legal Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-CurleyA.jpg",
    location: "United States",
    expertise: ["AI in Healthcare", "Medical Liability", "Healthcare Law"],
    bio: "Healthcare legal expert specializing in AI applications in oral surgery and strategies for avoiding medical liability.",
    category: "Practice Management",
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
    name: "Dr. Kamal F. Busaidy",
    slug: "dr-kamal-f-busaidy",
    title: "Emergency Airway Management Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-BusaidyK.jpg",
    location: "United States",
    expertise: ["Emergency Airway Management", "Office-Based Emergency Care", "Simulation Training"],
    bio: "Expert in office-based emergency airway management with focus on simulation training and emergency care protocols.",
    category: "Anesthesia",
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
    name: "Dr. Paul J. Schwartz",
    slug: "dr-paul-j-schwartz",
    title: "Emergency Medicine Specialist",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-SchwartzP.jpg",
    location: "United States",
    expertise: ["Emergency Medicine", "Airway Management", "Crisis Management"],
    bio: "Emergency medicine specialist with expertise in airway management and crisis management protocols for oral surgery practices.",
    category: "Anesthesia",
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
    name: "Dr. Larry E. Stigall",
    slug: "dr-larry-e-stigall",
    title: "Emergency Airway Simulation Expert",
    email: "info@speakersphere.com",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropWISQIWKU-Presenter-StigallL.jpg",
    location: "United States",
    expertise: ["Emergency Airway Simulation", "Training Programs", "Emergency Protocols"],
    bio: "Expert in emergency airway simulation training programs and emergency protocol development for oral surgery practices.",
    category: "Anesthesia",
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

export async function importEvent24Speakers(): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  console.log("🚀 Starting Event 24 speaker import from AAOMS 107th Annual Meeting 2025...");
  console.log(`Starting import of ${event24Speakers.length} Event 24 speakers...`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const speakerData of event24Speakers) {
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

  console.log(`Event 24 import completed:`);
  console.log(`✅ Successfully imported: ${successCount} speakers`);
  console.log(`❌ Failed to import: ${errorCount} speakers`);
  
  return { successCount, errorCount, errors };
}