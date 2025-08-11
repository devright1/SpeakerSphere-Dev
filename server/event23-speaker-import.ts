import { storage } from "./storage";
import { speakers, categories, type InsertSpeaker, type Category } from "../shared/schema";

// Event 23: Straumann LABFEST 2025 - Dental Lab Professionals Event
const event23Speakers = [
  {
    name: "Charles Banh",
    specialization: ["Digital Full-Arch Workflows", "Digital Lab Technology", "Straumann Systems"],
    imageUrl: "https://media.skill.straumann.com/straumann/Users/27648/Banh%20Charles%20SKiLL%20photo.jpg",
    event: "Straumann LABFEST 2025",
    presentation: "Digital Full-Arch Workflows Workshop",
    credentials: "CDT"
  },
  {
    name: "Jack Marrano",
    specialization: ["Digital Full-Arch Workflows", "Dental Lab Management", "Digital Workflows"],
    imageUrl: "https://static.wixstatic.com/media/67d9b6_f896d5e169fb462dbff1b0329a486efc~mv2.jpg/v1/crop/x_697,y_152,w_1668,h_1665/fill/w_275,h_275,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Bio2_edited.jpg",
    event: "Straumann LABFEST 2025",
    presentation: "Digital Full-Arch Workflows Workshop",
    credentials: "CDT"
  },
  {
    name: "Aleksandra Polcynsky",
    specialization: ["Dental Implant Market Analysis", "Market Research", "Industry Trends"],
    imageUrl: "https://media.skill.straumann.com/straumann/Users/143522/Aleksandra%20Polcynsky.jpg",
    event: "Straumann LABFEST 2025",
    presentation: "State of the Dental Implant Market"
  },
  {
    name: "Alexander Wuensche",
    specialization: ["New Materials", "Equipment Demonstration", "Lab Technology"],
    imageUrl: "https://dentalcesolutions.com/wp-content/uploads/2024/10/Alexander-Wuensche-CDT-e1729563614264.jpeg",
    event: "Straumann LABFEST 2025",
    presentation: "New Materials and Equipment Demonstration",
    credentials: "CDT"
  },
  {
    name: "Brandon Dickerman",
    specialization: ["Lab Equipment", "Material Technology", "Hands-On Training"],
    imageUrl: "https://www.straumanneducation.com/_/Dickerman.jpg",
    event: "Straumann LABFEST 2025",
    presentation: "New Materials and Equipment Demonstration",
    credentials: "CDT"
  },
  {
    name: "Marisa Notturno",
    specialization: ["Lab Business Growth", "Practice Management", "Business Strategies"],
    imageUrl: "https://media.skill.straumann.com/straumann/Users/121762/Notturno,%20Marisa%20SKiLL%20photo.jpg",
    event: "Straumann LABFEST 2025",
    presentation: "Lab Business Growth Strategies"
  },
  {
    name: "Dr. Minh Tran",
    specialization: ["Digital Software", "Workflow Optimization", "Digital Lab Technology"],
    imageUrl: "https://www.orangeoralsurgery.com/files/2022/11/Dr-Tran2-240x300.jpeg",
    event: "Straumann LABFEST 2025",
    presentation: "Digital Software and Workflow Optimization",
    credentials: "DDS"
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
  const presentation = speakerData.presentation ? ` ${speakerData.name} presents on "${speakerData.presentation}".` : '';
  
  return `${speakerData.name}${credentials} is a distinguished dental laboratory professional specializing in ${speakerData.specialization.join(', ')}.${presentation} As a featured speaker at the ${speakerData.event}, they bring extensive expertise in digital lab workflows and cutting-edge dental technology. Their contributions to dental laboratory education and innovation have made them a respected leader in the dental lab community.`;
}

function generateSpeechTopics(specialization: string[]): string[] {
  const topicMap: { [key: string]: string[] } = {
    "Digital Full-Arch Workflows": ["Digital Lab Processes", "Full-Arch Restoration", "CAD/CAM Technology"],
    "Digital Lab Technology": ["3D Printing", "Digital Scanning", "Lab Automation"],
    "Straumann Systems": ["Implant Systems", "Prosthetic Solutions", "Digital Workflows"],
    "Dental Lab Management": ["Lab Operations", "Quality Control", "Team Training"],
    "Digital Workflows": ["Workflow Optimization", "Digital Integration", "Efficiency Improvement"],
    "Dental Implant Market Analysis": ["Market Trends", "Industry Analysis", "Growth Strategies"],
    "Market Research": ["Data Analysis", "Trend Forecasting", "Competitive Analysis"],
    "Industry Trends": ["Technology Adoption", "Market Dynamics", "Innovation Patterns"],
    "New Materials": ["Material Science", "Product Innovation", "Material Testing"],
    "Equipment Demonstration": ["Technology Training", "Equipment Selection", "Hands-On Learning"],
    "Lab Technology": ["Digital Equipment", "Manufacturing Technology", "Process Innovation"],
    "Lab Equipment": ["Equipment Maintenance", "Technology Integration", "Workflow Tools"],
    "Material Technology": ["Ceramic Materials", "Composite Technology", "Material Properties"],
    "Hands-On Training": ["Skill Development", "Practical Learning", "Technical Training"],
    "Lab Business Growth": ["Business Development", "Growth Strategies", "Market Expansion"],
    "Practice Management": ["Operations Management", "Team Leadership", "Performance Optimization"],
    "Business Strategies": ["Strategic Planning", "Revenue Growth", "Market Positioning"],
    "Digital Software": ["CAD Software", "Lab Management Software", "Digital Tools"],
    "Workflow Optimization": ["Process Improvement", "Efficiency Enhancement", "Quality Systems"]
  };

  let topics: string[] = [];
  specialization.forEach(spec => {
    if (topicMap[spec]) {
      topics.push(...topicMap[spec]);
    }
  });
  
  return topics.length > 0 ? Array.from(new Set(topics)) : ["Digital Dentistry", "Lab Technology", "Dental Materials"];
}

export async function importEvent23Speakers(): Promise<{
  successCount: number;
  errorCount: number;
  errors: string[];
}> {
  console.log("🚀 Starting Event 23 speaker import from Straumann LABFEST 2025...");
  
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
    const digitalCategory = categories.find((cat: Category) => 
      cat.name.includes("Digital") || cat.name.includes("Technology")
    );

    console.log(`Starting import of ${event23Speakers.length} Event 23 speakers...`);

    for (const speakerData of event23Speakers) {
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
          title: speakerData.specialization[0] || "Digital Lab Technology Specialist",
          bio: generateBio(speakerData),
          expertise: speakerData.specialization,
          location: "Mansfield, Texas",
          imageUrl: speakerData.imageUrl,
          verified: true,
          category: "Digital Dentistry",
          achievements: [
            `Featured speaker at ${speakerData.event}`,
            "Digital lab technology expert",
            "Straumann certified professional"
          ],
          lectures: generateSpeechTopics(speakerData.specialization),
          email: "contact@speaker.com",
          languages: ["English"],
          speakerType: "technical",
          experience: 12,
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

    console.log("\nEvent 23 import completed:");
    console.log(`✅ Successfully imported: ${results.successCount} speakers`);
    console.log(`❌ Failed to import: ${results.errorCount} speakers`);
    
    if (results.errors.length > 0) {
      console.log("Errors:");
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  } catch (error) {
    console.error("Event 23 import failed:", error);
    throw error;
  }
}