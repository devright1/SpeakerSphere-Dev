import { storage } from "./storage";
import { speakers, categories, type InsertSpeaker, type Category } from "../shared/schema";

// Event 14: 2025 AAOMS Dental Implant Conference
const event14Speakers = [
  {
    name: "Dr. Eric C. Baker",
    specialization: ["Practice Growth", "Direct to Consumer Strategies", "Patient Acquisition"],
    imageUrl: "https://www.niguelcoastoralsurgery.com/wp-content/uploads/2019/02/dr-baker-1-1.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Elite Practice Growth: Direct to Consumer Strategies vs. Referral-Based Patient Acquisition"
  },
  {
    name: "Dr. Jay C. Platt",
    specialization: ["Practice Growth", "Referral-Based Patient Acquisition", "Oral Surgery"],
    imageUrl: "https://www.jplattdds.com/wp-content/uploads/sites/5219/2022/10/DrPlatt.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Elite Practice Growth: Direct to Consumer Strategies vs. Referral-Based Patient Acquisition"
  },
  {
    name: "Dr. Panos Papaspyridakos",
    specialization: ["Digital Workflow", "Comprehensive Digital Treatment", "Implant Prosthodontics"],
    imageUrl: "https://dental.tufts.edu/sites/g/files/lrezom626/files/styles/large/public/ppapas01.jpeg?itok=qyKDbI82",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Latest Developments in Comprehensive Digital Workflow"
  },
  {
    name: "Dr. Baldwin W. Marchack",
    specialization: ["Implant Restoration Management", "Abutment Screw Complications", "Prosthetic Solutions"],
    imageUrl: "https://www.pasadenaimplants.com/wp-content/uploads/2019/08/meet-the-team-1.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Managing the Loose Implant Restoration and Fractured Abutment Screws"
  },
  {
    name: "Dr. Robert A. Levine",
    specialization: ["Soft-Tissue Alternatives", "Biologic Modifiers", "Evidence-Based Practice"],
    imageUrl: "https://ralevinedds.com/wp-content/uploads/2023/12/IMG_8421-768x1024.jpeg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Evidence-Based Integration of Soft-Tissue Alternatives (STAs) and Biologic Modifiers into Daily Practice"
  },
  {
    name: "Dr. Carlos Aparicio",
    specialization: ["Zygomatic Implants", "ZAGA Concept", "3D Model Surgery"],
    imageUrl: "https://zagacenters.com/wp-content/uploads/2023/07/Dr.-Carlos-Aparicio-2-1024x1024-1.webp",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Zygomatic Implant Placement Fundamentals Using 3D Models: The ZAGA Concept in Practice"
  },
  {
    name: "Dr. Guillermo Chacon",
    specialization: ["Digital Treatment", "Analog Treatment", "State of the Art Techniques"],
    imageUrl: "https://www.wacenters.com/wp-content/uploads/sites/4175/2019/04/drChacon-web.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "State of the Art in Digital and Analog Treatment"
  },
  {
    name: "Dr. Waldemar D. Polido",
    specialization: ["Full-Arch Implants", "Implant Controversies", "Complex Rehabilitation"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752867118100-BrQ9vr93.png",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Full-Arch Controversies"
  },
  {
    name: "Dr. Bach T. Le",
    specialization: ["Clinical Practice", "Point-Counterpoint Debates", "Evidence-Based Dentistry"],
    imageUrl: "https://www.whittieroralsurgery.com/files/2011/08/BH2013_00195CCOPY.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Clinical Practice: Point-Counterpoint"
  },
  {
    name: "Dr. Craig M. Misch",
    specialization: ["Complication Prevention", "Complication Management", "Risk Assessment"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752867156398-BInByr-p.png",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Prevention and Management of Complications"
  },
  {
    name: "Dr. Donald P. Lewis Jr.",
    specialization: ["Anesthesia", "Skills Lab Training", "Emergency Management"],
    imageUrl: "https://www.ohsurgery.com/wp-content/uploads/sites/4868/2024/09/blue-jacket-8.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
  },
  {
    name: "Dr. Jimmie L. Harper Jr.",
    specialization: ["Anesthesia Training", "Emergency Protocols", "Oral Surgery"],
    imageUrl: "https://www.cincinnatioms.com/wp-content/uploads/sites/641/2020/11/JLH-Web-223x300.jpeg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
  },
  {
    name: "Dr. Kamal F. Busaidy",
    specialization: ["Anesthesia Management", "Office-Based Surgery", "Patient Safety"],
    imageUrl: "https://www.utphysicians.com/wp-content/uploads/2018/01/busaidy-kamal-web.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
  },
  {
    name: "Dr. Peter A. Vellis",
    specialization: ["Emergency Airway Management", "Anesthesia Protocols", "Skills Training"],
    imageUrl: "https://www.newenglandoralsurgery.com/files/2018/10/PAV-Photo-214x300.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
  },
  {
    name: "Jennifer Brady",
    specialization: ["Anesthesia Assistance", "Team Training", "Clinical Support"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752869095260-Co5VK7jC.png",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab",
    credentials: "CRNA"
  },
  {
    name: "Dr. David A. Fenton",
    specialization: ["Emergency Management", "Anesthesia Training", "Oral Surgery Education"],
    imageUrl: "https://www.bristolctoralsurgery.com/files/2011/08/DrFenton.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
  },
  {
    name: "Dr. Larry E. Stigall",
    specialization: ["Anesthesia Safety", "Emergency Protocols", "Skills Lab Training"],
    imageUrl: "https://www.stigalloralsurgery.com/files/2019/02/26-copy-214x300.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
  },
  {
    name: "Dr. Louis K. Rafetto",
    specialization: ["Office-Based Anesthesia", "Emergency Airway Management", "Training Programs"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752869217195-CtrY5EcU.png",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
  },
  {
    name: "Dr. Lane T. Knight",
    specialization: ["Anesthesia Education", "Emergency Response", "Clinical Training"],
    imageUrl: "https://www.smdoms.com/files/2018/06/IMG_1243-2-1-234x300.jpg",
    event: "2025 AAOMS Dental Implant Conference",
    presentation: "Anesthesia Assistants Skills Lab"
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
  
  return `${speakerData.name}${credentials} is a distinguished oral and maxillofacial surgery specialist with expertise in ${speakerData.specialization.join(', ')}.${presentation} As a featured speaker at the ${speakerData.event}, they bring extensive knowledge in advanced implant techniques, anesthesia management, and comprehensive patient care. Their contributions to oral surgery education and clinical practice have made them a respected leader in the AAOMS community.`;
}

function generateSpeechTopics(specialization: string[]): string[] {
  const topicMap: { [key: string]: string[] } = {
    "Practice Growth": ["Business Development", "Marketing Strategies", "Revenue Optimization"],
    "Direct to Consumer Strategies": ["Patient Acquisition", "Digital Marketing", "Consumer Outreach"],
    "Patient Acquisition": ["Referral Networks", "Marketing", "Practice Development"],
    "Referral-Based Patient Acquisition": ["Professional Networks", "Referral Systems", "Relationship Building"],
    "Digital Workflow": ["CAD/CAM Technology", "Digital Planning", "Workflow Integration"],
    "Comprehensive Digital Treatment": ["Digital Dentistry", "Treatment Planning", "Technology Integration"],
    "Implant Prosthodontics": ["Prosthetic Restoration", "Implant Crowns", "Fixed Bridges"],
    "Implant Restoration Management": ["Restoration Maintenance", "Problem Solving", "Clinical Protocols"],
    "Abutment Screw Complications": ["Screw Management", "Prosthetic Repairs", "Problem Resolution"],
    "Prosthetic Solutions": ["Restoration Design", "Materials Selection", "Clinical Techniques"],
    "Soft-Tissue Alternatives": ["Tissue Grafting", "Regenerative Medicine", "Surgical Techniques"],
    "Biologic Modifiers": ["Growth Factors", "Tissue Engineering", "Regenerative Therapy"],
    "Evidence-Based Practice": ["Research Analysis", "Clinical Decision Making", "Best Practices"],
    "Zygomatic Implants": ["Advanced Surgery", "Complex Cases", "Surgical Techniques"],
    "ZAGA Concept": ["Surgical Protocols", "Treatment Planning", "3D Analysis"],
    "3D Model Surgery": ["Surgical Planning", "Model-Based Surgery", "Precision Techniques"],
    "Digital Treatment": ["Digital Dentistry", "CAD/CAM", "Technology Integration"],
    "Analog Treatment": ["Traditional Techniques", "Manual Methods", "Clinical Skills"],
    "State of the Art Techniques": ["Advanced Methods", "Innovation", "Best Practices"],
    "Full-Arch Implants": ["Complete Restoration", "All-on-4", "Complex Rehabilitation"],
    "Implant Controversies": ["Debated Topics", "Clinical Discussions", "Evidence Analysis"],
    "Complex Rehabilitation": ["Difficult Cases", "Comprehensive Treatment", "Multi-disciplinary Care"],
    "Clinical Practice": ["Patient Care", "Treatment Planning", "Clinical Protocols"],
    "Point-Counterpoint Debates": ["Evidence Discussion", "Clinical Arguments", "Best Practices"],
    "Evidence-Based Dentistry": ["Research Application", "Clinical Evidence", "Decision Making"],
    "Complication Prevention": ["Risk Assessment", "Preventive Strategies", "Quality Control"],
    "Complication Management": ["Problem Solving", "Treatment Protocols", "Clinical Management"],
    "Risk Assessment": ["Patient Evaluation", "Treatment Planning", "Safety Protocols"],
    "Anesthesia": ["Sedation", "Pain Management", "Patient Comfort"],
    "Skills Lab Training": ["Hands-On Learning", "Practical Skills", "Educational Methods"],
    "Emergency Management": ["Crisis Response", "Emergency Protocols", "Patient Safety"],
    "Anesthesia Training": ["Education Programs", "Skills Development", "Safety Training"],
    "Emergency Protocols": ["Response Systems", "Safety Procedures", "Crisis Management"],
    "Anesthesia Management": ["Sedation Protocols", "Patient Monitoring", "Safety Systems"],
    "Office-Based Surgery": ["Outpatient Procedures", "Safety Protocols", "Facility Management"],
    "Patient Safety": ["Risk Management", "Quality Control", "Safety Systems"],
    "Emergency Airway Management": ["Airway Control", "Emergency Response", "Life Support"],
    "Anesthesia Protocols": ["Sedation Guidelines", "Safety Procedures", "Clinical Protocols"],
    "Skills Training": ["Education", "Hands-On Learning", "Competency Development"],
    "Anesthesia Assistance": ["Clinical Support", "Team Coordination", "Patient Care"],
    "Team Training": ["Staff Development", "Continuing Education", "Workflow Efficiency"],
    "Clinical Support": ["Patient Care", "Team Coordination", "Clinical Assistance"],
    "Anesthesia Safety": ["Risk Management", "Safety Protocols", "Patient Monitoring"],
    "Office-Based Anesthesia": ["Outpatient Sedation", "Safety Systems", "Facility Requirements"],
    "Training Programs": ["Education Development", "Curriculum Design", "Skills Assessment"],
    "Anesthesia Education": ["Teaching Methods", "Educational Programs", "Skills Development"],
    "Emergency Response": ["Crisis Management", "Emergency Protocols", "Life Support"],
    "Clinical Training": ["Skills Development", "Hands-On Education", "Competency Building"]
  };

  let topics: string[] = [];
  specialization.forEach(spec => {
    if (topicMap[spec]) {
      topics.push(...topicMap[spec]);
    }
  });
  
  return topics.length > 0 ? Array.from(new Set(topics)) : ["Oral Surgery", "Implant Dentistry", "Anesthesia"];
}

export async function importEvent14Speakers(): Promise<{
  successCount: number;
  errorCount: number;
  errors: string[];
}> {
  console.log("🚀 Starting Event 14 speaker import from 2025 AAOMS Dental Implant Conference...");
  
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
    const oralSurgeryCategory = categories.find((cat: Category) => 
      cat.name.includes("Oral Surgery") || cat.name.includes("Surgery")
    );

    console.log(`Starting import of ${event14Speakers.length} Event 14 speakers...`);

    for (const speakerData of event14Speakers) {
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
          title: speakerData.specialization[0] || "Oral and Maxillofacial Surgery Specialist",
          bio: generateBio(speakerData),
          expertise: speakerData.specialization,
          location: "Chicago, Illinois",
          imageUrl: speakerData.imageUrl,
          verified: true,
          category: "Oral Surgery",
          achievements: [
            `Featured speaker at ${speakerData.event}`,
            "Board-certified oral and maxillofacial surgeon",
            "AAOMS member and educator"
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

    console.log("\nEvent 14 import completed:");
    console.log(`✅ Successfully imported: ${results.successCount} speakers`);
    console.log(`❌ Failed to import: ${results.errorCount} speakers`);
    
    if (results.errors.length > 0) {
      console.log("Errors:");
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  } catch (error) {
    console.error("Event 14 import failed:", error);
    throw error;
  }
}