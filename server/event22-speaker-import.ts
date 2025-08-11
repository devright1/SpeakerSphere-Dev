import { DatabaseStorage } from "./database-storage";
import type { InsertSpeaker, Category } from "@shared/schema";

interface SpeakerData {
  name: string;
  imageUrl: string;
  bio: string;
  specialization: string[];
  event: string;
}

const EVENT22_SPEAKERS: SpeakerData[] = [
  // American Board Review
  {
    name: "Dr. Jeffrey A. Rossmann",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropNCWBZCVN-Presenter-RossmannJ.jpg",
    bio: "Respected periodontist and American Board of Periodontology specialist with extensive experience in board preparation and clinical periodontal treatment.",
    specialization: ["Periodontology", "Clinical Education", "Board Preparation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Angela A. Palaiologou-Gallis",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHCGVAHTN-Presenter-PalaiologouGallisA.jpg",
    bio: "Expert periodontist specializing in American Board of Periodontology preparation and advanced periodontal therapies.",
    specialization: ["Periodontology", "Clinical Education", "Board Preparation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Doug Dixon",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHCGVAHTN-Presenter-DixonD.jpg",
    bio: "Experienced periodontist with expertise in American Board of Periodontology certification and clinical periodontal practice.",
    specialization: ["Periodontology", "Clinical Education", "Board Preparation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Charles A. Powell",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-PowellC.jpeg.jpg",
    bio: "Distinguished periodontist specializing in American Board of Periodontology preparation and advanced clinical periodontics.",
    specialization: ["Periodontology", "Clinical Education", "Board Preparation"],
    event: "AAP 111th Annual Meeting 2025"
  },

  // Sedation and Anxiety Management
  {
    name: "Dr. Yusuke Hamada",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-HamadaY.jpg",
    bio: "Expert in sedation dentistry and anxiety management in periodontal procedures, specializing in patient comfort and pain management protocols.",
    specialization: ["Sedation Dentistry", "Anxiety Management", "Periodontology"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Steve D. Shufflebarger",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-ShufflebargerS.jpg",
    bio: "Specialist in sedation protocols and anxiety management for periodontal patients, with expertise in conscious sedation techniques.",
    specialization: ["Sedation Dentistry", "Anxiety Management", "Periodontology"],
    event: "AAP 111th Annual Meeting 2025"
  },

  // Regeneration Symposium
  {
    name: "Dr. Christopher R. Richardson",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHCGVAHTN-Presenter-RichardsonC.jpg",
    bio: "Leading expert in periodontal regeneration and tissue engineering, specializing in regenerative periodontal therapies and guided tissue regeneration.",
    specialization: ["Periodontal Regeneration", "Tissue Engineering", "Periodontology"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Purnima Kumar",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHCGVAHTN-Presenter-KumarP.jpg",
    bio: "Renowned expert in periodontal microbiology and regenerative medicine, focusing on the intersection of microbial science and tissue regeneration.",
    specialization: ["Periodontal Microbiology", "Regenerative Medicine", "Periodontology"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Sejal Thacker",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-ThackerS.jpeg.jpg",
    bio: "Specialist in periodontal regeneration and advanced regenerative therapies, with expertise in tissue engineering and regenerative protocols.",
    specialization: ["Periodontal Regeneration", "Tissue Engineering", "Periodontology"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Anton Sculean",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-SculeanA.jpg",
    bio: "Internationally recognized expert in periodontal regeneration and wound healing, leading research in regenerative periodontal therapies.",
    specialization: ["Periodontal Regeneration", "Wound Healing", "Research"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Muhammad H. Saleh",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-SalehM.jpg",
    bio: "Expert in periodontal regeneration and advanced periodontal therapies, specializing in regenerative treatment modalities and tissue engineering.",
    specialization: ["Periodontal Regeneration", "Advanced Periodontal Therapy", "Periodontology"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Devorah Schwartz-Arad",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-SchwartzAradD.jpg",
    bio: "Leading specialist in periodontal regeneration and implant dentistry, with expertise in regenerative procedures and tissue reconstruction.",
    specialization: ["Periodontal Regeneration", "Implant Dentistry", "Tissue Reconstruction"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Shayan Barootchi",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-BarootchiS.jpg",
    bio: "Expert in periodontal regeneration and advanced periodontal surgeries, specializing in regenerative treatment approaches and tissue engineering.",
    specialization: ["Periodontal Regeneration", "Periodontal Surgery", "Tissue Engineering"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Gustavo Avila Ortiz",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropKHKLCXQR-Presenter-AvilaOrtizG.jpg",
    bio: "Renowned expert in periodontal regeneration and implant dentistry, leading research in regenerative periodontal and implant therapies.",
    specialization: ["Periodontal Regeneration", "Implant Dentistry", "Research"],
    event: "AAP 111th Annual Meeting 2025"
  },

  // Scholarship and Journal Writing
  {
    name: "Dr. Effie Ioannidou",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-IoannidouE.jpg",
    bio: "Distinguished academic and researcher specializing in periodontal scholarship, peer review processes, and scientific writing in periodontology.",
    specialization: ["Periodontal Research", "Scientific Writing", "Academic Scholarship"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Massimo Costalonga",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-CostalongaM.jpg",
    bio: "Expert in periodontal research and scientific publishing, with extensive experience in peer review and editorial processes for AAP journals.",
    specialization: ["Periodontal Research", "Scientific Publishing", "Editorial Review"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Georgios A. Kotsakis",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropKHKLCXQR-Presenter-KotsakisG.jpg",
    bio: "Leading researcher and academician in periodontology with expertise in scientific writing, peer review, and periodontal scholarship.",
    specialization: ["Periodontal Research", "Scientific Writing", "Academic Education"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Luciana M. Shaddox",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-ShaddoxL.jpg",
    bio: "Renowned researcher and educator specializing in periodontal scholarship, scientific writing, and peer review processes for periodontal journals.",
    specialization: ["Periodontal Research", "Scientific Writing", "Editorial Processes"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Flavia Q. Pirih",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropUKPOSZGO-Presenter-PirihF.jpg",
    bio: "Expert in periodontal research and academic writing, with extensive experience in scientific publishing and peer review for periodontal literature.",
    specialization: ["Periodontal Research", "Academic Writing", "Peer Review"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Diego Velasquez-Plata",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropNCWBZCVN-Presenter-VelasquezD.jpg",
    bio: "Distinguished academic and researcher specializing in periodontal scholarship, scientific writing, and editorial processes for professional journals.",
    specialization: ["Periodontal Research", "Scientific Writing", "Editorial Scholarship"],
    event: "AAP 111th Annual Meeting 2025"
  },

  // Clinical Innovations and Research
  {
    name: "Dr. Henry A. Foerster",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-FoersterH.jpg",
    bio: "Expert in clinical periodontal innovations and research, specializing in advanced periodontal treatment modalities and clinical research methodologies.",
    specialization: ["Clinical Periodontics", "Periodontal Innovation", "Clinical Research"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "CPT Justin Galliani",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-GallianiJ.jpg",
    bio: "Military periodontist specializing in clinical innovations and periodontal research within military dental healthcare systems.",
    specialization: ["Military Periodontics", "Clinical Innovation", "Periodontal Research"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "CPT Denise Cacho",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-CachoC.jpg",
    bio: "Military dental officer specializing in periodontal research and clinical innovations within military healthcare settings.",
    specialization: ["Military Periodontics", "Clinical Research", "Periodontal Innovation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "MAJ Toria Koutras",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-KoutrasM.jpg",
    bio: "Military periodontist with expertise in clinical periodontal research and innovative treatment approaches within military dental practice.",
    specialization: ["Military Periodontics", "Clinical Research", "Treatment Innovation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "CPT Andrew Egger",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-EggerC.jpg",
    bio: "Military dental officer specializing in periodontal clinical innovations and research methodologies in military healthcare environments.",
    specialization: ["Military Periodontics", "Clinical Innovation", "Research Methodology"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Owais A. Farooqi",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-FarooqiO.jpg",
    bio: "Specialist in clinical periodontal innovations and research, with expertise in advanced periodontal treatment modalities and clinical studies.",
    specialization: ["Clinical Periodontics", "Treatment Innovation", "Clinical Research"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Gilbert A. Fru",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-FruG.jpg",
    bio: "Expert in clinical periodontal research and innovative treatment approaches, specializing in advanced clinical periodontal methodologies.",
    specialization: ["Clinical Periodontics", "Treatment Innovation", "Periodontal Research"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Jonathan Tai",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-TaiJ.jpg",
    bio: "Specialist in periodontal clinical innovations and research, with focus on advanced periodontal therapies and clinical research applications.",
    specialization: ["Clinical Periodontics", "Clinical Innovation", "Advanced Periodontal Therapy"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Capt Jess Cayetano",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-CayetanoC.jpg",
    bio: "Military dental officer specializing in periodontal clinical research and innovative treatment approaches within military dental systems.",
    specialization: ["Military Periodontics", "Clinical Research", "Treatment Innovation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Capt Luke Seiler",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-SeilerC.jpg",
    bio: "Military periodontist with expertise in clinical innovations and periodontal research within military healthcare environments.",
    specialization: ["Military Periodontics", "Clinical Innovation", "Periodontal Research"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Capt Victoria Wei",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-WeiC.jpeg.jpg",
    bio: "Military dental officer specializing in periodontal research and clinical innovations in military dental healthcare settings.",
    specialization: ["Military Periodontics", "Clinical Research", "Periodontal Innovation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "LT Nathan Kobold",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-KoboldL.jpeg.jpg",
    bio: "Military dental officer with expertise in periodontal clinical research and innovative treatment methodologies within naval healthcare.",
    specialization: ["Military Periodontics", "Clinical Research", "Treatment Innovation"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "LT Sofia Thompson",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-ThompsonL.jpeg.jpg",
    bio: "Naval dental officer specializing in periodontal research and clinical innovations within military dental healthcare systems.",
    specialization: ["Military Periodontics", "Clinical Innovation", "Periodontal Research"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "LT Jin Hwang",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-HwangL.jpeg.jpg",
    bio: "Naval dental officer with expertise in periodontal clinical research and innovative treatment approaches in military healthcare settings.",
    specialization: ["Military Periodontics", "Clinical Research", "Treatment Innovation"],
    event: "AAP 111th Annual Meeting 2025"
  },

  // American Board Review Part 2
  {
    name: "Dr. Jennifer Bain",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-BainJ.jpg",
    bio: "Expert periodontist specializing in American Board of Periodontology preparation and advanced clinical periodontal treatment modalities.",
    specialization: ["Periodontology", "Board Preparation", "Clinical Education"],
    event: "AAP 111th Annual Meeting 2025"
  },
  {
    name: "Dr. Carlos Parra Carrasquer",
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHDWHWLCJ-Presenter-ParraCarrasquerC(2).jpg",
    bio: "Distinguished periodontist with expertise in American Board of Periodontology certification and advanced periodontal clinical practice.",
    specialization: ["Periodontology", "Board Preparation", "Clinical Periodontics"],
    event: "AAP 111th Annual Meeting 2025"
  }
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateBio(speaker: SpeakerData): string {
  return speaker.bio;
}

function generateSpeechTopics(specializations: string[]): string[] {
  const topicMap: { [key: string]: string[] } = {
    "Periodontology": [
      "Advanced Periodontal Therapy",
      "Periodontal Disease Management",
      "Non-Surgical Periodontal Treatment"
    ],
    "Clinical Education": [
      "Board Certification Preparation",
      "Clinical Teaching Methods",
      "Periodontal Case Presentations"
    ],
    "Board Preparation": [
      "American Board of Periodontology Review",
      "Clinical Case Documentation",
      "Board Examination Strategies"
    ],
    "Sedation Dentistry": [
      "Conscious Sedation Protocols",
      "Patient Anxiety Management",
      "Sedation Safety Guidelines"
    ],
    "Anxiety Management": [
      "Patient Comfort Techniques",
      "Stress Reduction Methods",
      "Behavioral Management"
    ],
    "Periodontal Regeneration": [
      "Guided Tissue Regeneration",
      "Regenerative Materials",
      "Tissue Engineering Applications"
    ],
    "Tissue Engineering": [
      "Biomaterial Applications",
      "Scaffold Technologies",
      "Growth Factor Utilization"
    ],
    "Periodontal Microbiology": [
      "Microbial Analysis",
      "Biofilm Management",
      "Antimicrobial Strategies"
    ],
    "Regenerative Medicine": [
      "Stem Cell Applications",
      "Regenerative Protocols",
      "Advanced Healing Techniques"
    ],
    "Wound Healing": [
      "Healing Mechanisms",
      "Wound Care Protocols",
      "Recovery Optimization"
    ],
    "Research": [
      "Clinical Research Methodology",
      "Evidence-Based Treatment",
      "Research Protocol Design"
    ],
    "Implant Dentistry": [
      "Periodontal-Implant Interface",
      "Implant Site Preparation",
      "Peri-Implant Disease Management"
    ],
    "Tissue Reconstruction": [
      "Soft Tissue Reconstruction",
      "Ridge Augmentation",
      "Aesthetic Tissue Management"
    ],
    "Periodontal Surgery": [
      "Surgical Techniques",
      "Minimally Invasive Surgery",
      "Surgical Planning"
    ],
    "Periodontal Research": [
      "Clinical Studies",
      "Research Methodology",
      "Evidence-Based Practice"
    ],
    "Scientific Writing": [
      "Academic Writing",
      "Research Publication",
      "Manuscript Preparation"
    ],
    "Academic Scholarship": [
      "Educational Excellence",
      "Teaching Innovation",
      "Academic Leadership"
    ],
    "Scientific Publishing": [
      "Publication Process",
      "Editorial Guidelines",
      "Peer Review Standards"
    ],
    "Editorial Review": [
      "Manuscript Review",
      "Editorial Decision Making",
      "Quality Assessment"
    ],
    "Academic Education": [
      "Curriculum Development",
      "Educational Innovation",
      "Student Mentoring"
    ],
    "Editorial Processes": [
      "Journal Management",
      "Editorial Standards",
      "Publication Ethics"
    ],
    "Academic Writing": [
      "Scientific Communication",
      "Research Documentation",
      "Technical Writing"
    ],
    "Peer Review": [
      "Review Process",
      "Quality Standards",
      "Editorial Assessment"
    ],
    "Editorial Scholarship": [
      "Academic Publishing",
      "Scholarly Communication",
      "Editorial Leadership"
    ],
    "Clinical Periodontics": [
      "Clinical Excellence",
      "Treatment Planning",
      "Patient Care"
    ],
    "Periodontal Innovation": [
      "Treatment Innovation",
      "Technology Integration",
      "Clinical Advancement"
    ],
    "Clinical Research": [
      "Clinical Trials",
      "Research Design",
      "Data Analysis"
    ],
    "Military Periodontics": [
      "Military Dental Care",
      "Deployment Dentistry",
      "Military Healthcare Systems"
    ],
    "Clinical Innovation": [
      "Treatment Innovation",
      "Technology Advancement",
      "Clinical Excellence"
    ],
    "Treatment Innovation": [
      "Innovative Approaches",
      "Advanced Techniques",
      "Clinical Improvement"
    ],
    "Research Methodology": [
      "Study Design",
      "Data Collection",
      "Statistical Analysis"
    ],
    "Advanced Periodontal Therapy": [
      "Complex Cases",
      "Advanced Techniques",
      "Treatment Excellence"
    ]
  };

  let topics: string[] = [];
  specializations.forEach(spec => {
    if (topicMap[spec]) {
      topics.push(...topicMap[spec]);
    }
  });

  return topics.slice(0, 3);
}

export async function importEvent22Speakers() {
  const storage = new DatabaseStorage();
  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [] as string[]
  };

  console.log(`Starting import of ${EVENT22_SPEAKERS.length} Event 22 speakers...`);

  for (const speakerData of EVENT22_SPEAKERS) {
    try {
      // Check if speaker already exists by searching
      const existingSpeakers = await storage.getSpeakers({
        search: speakerData.name,
        includeHidden: true
      });
      const existingSpeaker = existingSpeakers.find(s => s.name === speakerData.name);
      if (existingSpeaker) {
        console.log(`⏭️ Speaker already exists: ${speakerData.name}`);
        continue;
      }

      // Get the Periodontology category (assuming it exists)
      const categories = await storage.getCategories();
      const periodontologyCategory = categories.find((cat: Category) => 
        cat.name.includes("Periodontology") || cat.name.includes("Periodontal")
      );

      const speaker: InsertSpeaker = {
        name: speakerData.name,
        slug: generateSlug(speakerData.name),
        title: speakerData.specialization[0] || "Periodontology Specialist",
        bio: generateBio(speakerData),
        expertise: speakerData.specialization,
        location: "Toronto, Ontario, Canada",
        imageUrl: speakerData.imageUrl,
        verified: true,
        category: "Periodontology",
        achievements: [`Featured speaker at ${speakerData.event}`, "Board-certified specialist", "Published researcher"],
        lectures: generateSpeechTopics(speakerData.specialization),
        email: "contact@speaker.com",
        languages: ["English"],
        speakerType: "clinical",
        experience: 15,
        featured: false
      };

      await storage.createSpeaker(speaker);
      results.successCount++;
      console.log(`✅ Successfully imported: ${speakerData.name}`);

    } catch (error) {
      results.errorCount++;
      const errorMessage = `Failed to import ${speakerData.name}: ${error instanceof Error ? error.message : String(error)}`;
      results.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
    }
  }

  console.log("\nEvent 22 import completed:");
  console.log(`✅ Successfully imported: ${results.successCount} speakers`);
  console.log(`❌ Failed to import: ${results.errorCount} speakers`);

  if (results.errors.length > 0) {
    console.log("\nErrors:");
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return results;
}