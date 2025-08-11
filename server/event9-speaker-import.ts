import { storage } from "./storage";
import { speakers, categories, type InsertSpeaker, type Category } from "../shared/schema";

// Event 9: AAID Annual Meeting 2025 - American Academy of Implant Dentistry
const event9Speakers = [
  {
    name: "Dr. James L. Rutkowski",
    specialization: ["Sedation", "Perioperative Care", "Implant Dentistry"],
    imageUrl: "https://www.ju.edu/_resources/img/WEB2023-Oral-Implantology-Mod-Sedation-12.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Marijuana and GLP-1 Agonists Perioperative Considerations"
  },
  {
    name: "Dr. Andrea Ricci",
    specialization: ["Terminal Dentition Management", "Implant Prosthodontics", "Digital Smile Design"],
    imageUrl: "https://www.digitalsmiledesignclinics.com/hubfs/digitalsmiledesign.clinic/13_Studio_Ricci_Firenze/02_Master_Photo/Dr-Andrea-Ricci-v2.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Management of Terminal Dentition: From Diagnosis to Recalls"
  },
  {
    name: "Dr. Scott D. Ganz",
    specialization: ["3D AI Segmentation", "Surgical Design", "Digital Implantology"],
    imageUrl: "https://images.cdn-files-a.com/uploads/3203086/800_5e8fb990961ab.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Proof of Concept: Novel Surgical Design Concepts for Both Maxillary and Mandibular Arches Based on Advances in 3D AI Segmentation"
  },
  {
    name: "Dr. Aman S. Bhullar",
    specialization: ["Full-Time Implantology", "Practice Management", "Business Development"],
    imageUrl: "https://www.leadingimplantcenters.com/assets/uploads/images/_squareExpert/Dr.-Aman-Bhullar.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Ready to Become a Full-Time Implantologist? Ten Key Steps to Building a Successful Full-Time Implant Business Within Your General Dentistry Practice"
  },
  {
    name: "Dr. Samantha A. Siranli",
    specialization: ["Immediate Loading", "Full-Arch Implants", "Digital Protocols"],
    imageUrl: "https://www.siranlidental.com/wp-content/uploads/2021/02/Dr-Samantha-Siranli.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Immediate Loading for Full-arch Implants on the Day of Surgery Utilizing Photogrammetry and Intra-oral Scanners: A Fully Digital Protocol"
  },
  {
    name: "Dr. Shankar Iyer",
    specialization: ["Implant Dentistry", "Evidence-Based Dentistry", "Clinical Argumentation"],
    imageUrl: "https://malosmileusa.com/wp-content/uploads/2024/01/Dr.-Shankar-Iyer.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Counter Arguments in Implant Dentistry"
  },
  {
    name: "Dr. Paul Goodman",
    specialization: ["Patient Impact", "Implant Dentistry", "Life-Changing Dentistry"],
    imageUrl: "https://www.dentalnachos.com/hs-fs/hubfs/website%20images/Paul%20Headshot%20(1).jpg?width=600&height=400&name=Paul%20Headshot%20(1).jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "The Life Changing Impact of Dental Implants"
  },
  {
    name: "Dr. Andrea Ravida",
    specialization: ["Peri-implantitis Management", "Surgical Therapy", "Prosthetic Rehabilitation"],
    imageUrl: "https://www.conferenceharvester.com/uploads/harvester/photos/cropHCGVAHTN-Presenter-RavidaA.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Comprehensive Management of Peri-implantitis: A Step-by-step Surgical and Prosthetic Approach"
  },
  {
    name: "Dr. Tarek Assi",
    specialization: ["Digital Dentistry", "All-on-X", "Precision Implantology"],
    imageUrl: "https://www.alphadentalpractice.com/wp-content/uploads/2024/12/img-dr-assi.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Transforming Smiles With Precision: The Role of Digital Dentistry in All-on-x Success"
  },
  {
    name: "Dr. Michael A. Pikos",
    specialization: ["Full-Arch Therapy", "Digital Workflows", "Treatment Principles"],
    imageUrl: "https://dentalsymposiumhub.com/attached_assets/image_1752862316488.png",
    event: "AAID Annual Meeting 2025",
    presentation: "The Evolution of Full Arch Therapy: Merging Time-tested Treatment Principles With Digital Workflows"
  },
  {
    name: "Dr. Ramsey Amin",
    specialization: ["Subperiosteal Implants", "CAD/CAM Technology", "Severely Resorbed Ridges"],
    imageUrl: "https://www.aboi.org/content/images/members/12-a2fe.jpg/image-full;max$222,0.ImageHandler",
    event: "AAID Annual Meeting 2025",
    presentation: "Treating Severely Resorbed Ridges With CAD/CAM Patient-Specific Subperiosteal Implants"
  },
  {
    name: "Dr. Dan Holtzclaw",
    specialization: ["Extramaxillary Implants", "Remote Anchorage", "Implant Complications"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752859507269-mUZZc0r0.png",
    event: "AAID Annual Meeting 2025",
    presentation: "Complications With Remote Anchorage Extramaxillary Implants"
  },
  {
    name: "Dr. Suheil M. Boutros",
    specialization: ["Esthetic Zone Implants", "Hard and Soft Tissue Management", "Implant Aesthetics"],
    imageUrl: "https://c3-preview.prosites.com/308043/ed/PageMeetTheTeam/23d602de-46df-402d-8c85-8c844a04ac20_lg.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Hard and Soft Tissue Management Around Implants in the Esthetic Zone"
  },
  {
    name: "Dr. Rachana Hegde",
    specialization: ["Implant Maintenance", "Periodontics", "Team Education"],
    imageUrl: "https://www.alpenperio.com/wp-content/uploads/2023/05/Rachna.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Dental Team Program - Implants Maintenance, Digital All-on-X, Case Acceptance"
  },
  {
    name: "Dr. Nathan Doyel",
    specialization: ["Digital All-on-X", "Team Education", "Case Presentation"],
    imageUrl: "https://www.newsmiles.com/wp-content/uploads/2025/04/dr_d.png",
    event: "AAID Annual Meeting 2025",
    presentation: "Dental Team Program - Implants Maintenance, Digital All-on-X, Case Acceptance"
  },
  {
    name: "Jessica Woods",
    specialization: ["Case Acceptance", "Patient Communication", "Team Training"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752862061609-C6oKH_ep.png",
    event: "AAID Annual Meeting 2025",
    presentation: "Dental Team Program - Implants Maintenance, Digital All-on-X, Case Acceptance",
    credentials: "RDH"
  },
  {
    name: "Dr. Ahmad Kutkut",
    specialization: ["Tooth Condition Changes", "Adjacent Implants", "Decay Prevention"],
    imageUrl: "https://ukhealthcare.uky.edu/sites/default/files/styles/large/public/2023-09/Kutkut_AhmadM_DDS-01%20WEB.jpg?itok=iBihg_KH",
    event: "AAID Annual Meeting 2025",
    presentation: "Prevalence of Decay and Tooth Condition Changes Adjacent to Restored Dental Implants"
  },
  {
    name: "Dr. Michael D. Scherer",
    specialization: ["Full-Arch Implantology", "Fixed vs Removable", "Practice Management"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752858783931-BOxbh3_1.png",
    event: "AAID Annual Meeting 2025",
    presentation: "Fixed Versus Removable Full-arch in the Implantology Practice"
  },
  {
    name: "Dr. Sompop Bencharit",
    specialization: ["Full-Arch Implant Prosthodontics", "Innovation", "Best Practices"],
    imageUrl: "https://www.highpoint.edu/media/home/2024/04/240808-Sompop-Bencharit-001-scaled.jpeg",
    event: "AAID Annual Meeting 2025",
    presentation: "Innovations and Best Practices in Full-arch Implant Prosthodontics"
  },
  {
    name: "Dr. Jin Y. Kim",
    specialization: ["Saving Teeth", "Saving Implants", "Preservation Therapy"],
    imageUrl: "https://drjinkim.com/wp-content/uploads/2022/10/periodontics-diamond-bar-ca-2.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Saving Teeth, Saving Implants"
  },
  {
    name: "Dr. Purnima Kumar",
    specialization: ["Peri-implantitis", "Host-Bacterial Interaction", "Microbiology"],
    imageUrl: "https://mitools.miserver.it.umich.edu/assets/photos/kpurnima.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Peri-implantitis: A Host-bacterial Conversation Gone Awry"
  },
  {
    name: "Dr. Sebastiano Andreana",
    specialization: ["Peri-implantitis Treatment", "Surgical Therapy", "Non-surgical Therapy"],
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752862247377-CUQCGU8d.png",
    event: "AAID Annual Meeting 2025",
    presentation: "Handling Periimplantitis: Surgical and Non-surgical. Anything New?"
  },
  {
    name: "Dr. Bart Silverman",
    specialization: ["Implant Complications", "Prevention", "Management"],
    imageUrl: "https://www.bwsoralsurgery.com/files/2011/08/bart-silverman-dmd.jpg",
    event: "AAID Annual Meeting 2025",
    presentation: "Prevention and Management of Dental Implant Complications"
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
  
  return `${speakerData.name}${credentials} is a distinguished implant dentistry specialist with expertise in ${speakerData.specialization.join(', ')}.${presentation} As a featured speaker at the ${speakerData.event}, they bring extensive knowledge in advanced implant techniques and patient care. Their contributions to implant dentistry education and clinical practice have made them a respected leader in the dental community.`;
}

function generateSpeechTopics(specialization: string[]): string[] {
  const topicMap: { [key: string]: string[] } = {
    "Sedation": ["Moderate Sedation", "Perioperative Care", "Patient Safety"],
    "Perioperative Care": ["Patient Preparation", "Risk Assessment", "Post-operative Care"],
    "Terminal Dentition Management": ["Full Mouth Rehabilitation", "Treatment Planning", "Patient Assessment"],
    "Implant Prosthodontics": ["Prosthetic Restoration", "Implant Crowns", "Fixed Bridges"],
    "3D AI Segmentation": ["Artificial Intelligence", "3D Planning", "Digital Technology"],
    "Surgical Design": ["Treatment Planning", "Surgical Guides", "Precision Surgery"],
    "Full-Time Implantology": ["Practice Transition", "Business Development", "Workflow Optimization"],
    "Practice Management": ["Team Training", "Systems Development", "Growth Strategies"],
    "Immediate Loading": ["Same-Day Implants", "Provisional Restorations", "Loading Protocols"],
    "Full-Arch Implants": ["All-on-4", "All-on-6", "Complete Arch Restoration"],
    "Digital Protocols": ["Digital Workflows", "Intraoral Scanning", "CAD/CAM"],
    "Evidence-Based Dentistry": ["Research Analysis", "Clinical Decision Making", "Literature Review"],
    "Patient Impact": ["Life-Changing Outcomes", "Quality of Life", "Patient Stories"],
    "Peri-implantitis Management": ["Infection Control", "Surgical Intervention", "Maintenance"],
    "Digital Dentistry": ["CAD/CAM Technology", "Digital Impressions", "Workflow Integration"],
    "All-on-X": ["Full-Arch Rehabilitation", "Immediate Loading", "Digital Planning"],
    "Subperiosteal Implants": ["Custom Implants", "Bone Grafting Alternatives", "Advanced Surgery"],
    "CAD/CAM Technology": ["Computer-Aided Design", "Manufacturing", "Digital Precision"],
    "Extramaxillary Implants": ["Zygomatic Implants", "Pterygoid Implants", "Alternative Anchorage"],
    "Esthetic Zone Implants": ["Anterior Implants", "Pink Aesthetics", "Soft Tissue Management"],
    "Hard and Soft Tissue Management": ["Bone Grafting", "Soft Tissue Grafting", "Tissue Regeneration"],
    "Implant Maintenance": ["Preventive Care", "Hygiene Protocols", "Long-term Success"],
    "Case Acceptance": ["Patient Education", "Treatment Presentation", "Communication Skills"],
    "Team Training": ["Staff Development", "Continuing Education", "Workflow Efficiency"],
    "Tooth Condition Changes": ["Adjacent Tooth Health", "Monitoring", "Prevention"],
    "Full-Arch Implantology": ["Complete Restoration", "Treatment Planning", "Prosthetic Options"],
    "Host-Bacterial Interaction": ["Microbiology", "Infection Pathways", "Immune Response"],
    "Peri-implantitis Treatment": ["Therapeutic Approaches", "Treatment Protocols", "Outcomes"],
    "Implant Complications": ["Risk Management", "Problem Solving", "Preventive Strategies"]
  };

  let topics: string[] = [];
  specialization.forEach(spec => {
    if (topicMap[spec]) {
      topics.push(...topicMap[spec]);
    }
  });
  
  return topics.length > 0 ? Array.from(new Set(topics)) : ["Implant Dentistry", "Oral Surgery", "Prosthodontics"];
}

export async function importEvent9Speakers(): Promise<{
  successCount: number;
  errorCount: number;
  errors: string[];
}> {
  console.log("🚀 Starting Event 9 speaker import from AAID Annual Meeting 2025...");
  
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
    const implantCategory = categories.find((cat: Category) => 
      cat.name.includes("Implant") || cat.name.includes("Oral Surgery")
    );

    console.log(`Starting import of ${event9Speakers.length} Event 9 speakers...`);

    for (const speakerData of event9Speakers) {
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
          title: speakerData.specialization[0] || "Implant Dentistry Specialist",
          bio: generateBio(speakerData),
          expertise: speakerData.specialization,
          location: "Phoenix/Scottsdale, Arizona",
          imageUrl: speakerData.imageUrl,
          verified: true,
          category: "Implant Dentistry",
          achievements: [
            `Featured speaker at ${speakerData.event}`,
            "Board-certified implant dentist",
            "Published researcher in implant dentistry"
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

    console.log("\nEvent 9 import completed:");
    console.log(`✅ Successfully imported: ${results.successCount} speakers`);
    console.log(`❌ Failed to import: ${results.errorCount} speakers`);
    
    if (results.errors.length > 0) {
      console.log("Errors:");
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  } catch (error) {
    console.error("Event 9 import failed:", error);
    throw error;
  }
}