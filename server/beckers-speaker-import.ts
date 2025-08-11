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

// Speakers from Becker's 4th Annual Future of Dentistry Roundtable
const beckersSpeakers: SpeakerData[] = [
  {
    name: "Alicia Kieffer",
    title: "Dental Practice Strategist",
    specialty: "Patient-First Dental Practices",
    bio: "Expert in creating patient-first dental practices with game-changing moves and adaptations for exceptional patient experiences.",
    presentation: "Creating Patient-First Dental Practices: Game-Changing Moves and Adaptations",
    email: "akieffer@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4335832-66ccf7519b0e1.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Timothy McVaney",
    title: "Practice Management Expert",
    specialty: "Patient Experience",
    bio: "Specialist in patient-first dental practice development and practice management strategies for optimal patient care.",
    presentation: "Creating Patient-First Dental Practices: Game-Changing Moves and Adaptations",
    email: "tmcvaney@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703509-6759d573db35a.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Peter Rivoli",
    title: "Dental Practice Consultant",
    specialty: "Practice Adaptation Strategies",
    bio: "Expert in game-changing moves and adaptations for creating patient-first dental practices with innovative approaches.",
    presentation: "Creating Patient-First Dental Practices: Game-Changing Moves and Adaptations",
    email: "privoli@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/3812332-661ec9b496456.png",
    category: "Practice Management"
  },
  {
    name: "Dr. James W. Willis",
    title: "Patient Care Specialist",
    specialty: "Patient-Centered Care",
    bio: "Specialist in patient-first dental practice development with focus on game-changing moves and patient care adaptations.",
    presentation: "Creating Patient-First Dental Practices: Game-Changing Moves and Adaptations",
    email: "jwillis@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4243155-66b3d2c3c2585.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Kathryn Alderman",
    title: "DSO Strategy Expert",
    specialty: "Local Market Strategies",
    bio: "Expert in winning local markets with custom strategies for DSOs to outpace competition and achieve market dominance.",
    presentation: "Winning Local Markets: Custom Strategies for DSOs to Outpace Competition",
    email: "kalderman@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753110420625-DHN8sTDT.png",
    category: "Practice Management"
  },
  {
    name: "Michelle Brumfield",
    title: "DSO Growth Strategist",
    specialty: "Competitive Strategy",
    bio: "Specialist in DSO growth strategies and custom approaches for winning local markets and outpacing competition.",
    presentation: "Winning Local Markets: Custom Strategies for DSOs to Outpace Competition",
    email: "mbrumfield@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703316-6759cc59c0edb.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Sami Webb",
    title: "Market Strategy Consultant",
    specialty: "DSO Market Penetration",
    bio: "Expert in local market penetration strategies and custom solutions for DSOs to achieve competitive advantage.",
    presentation: "Winning Local Markets: Custom Strategies for DSOs to Outpace Competition",
    email: "swebb@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4949207-67b50f06161eb.jpg",
    category: "Practice Management"
  },
  {
    name: "Trevor Maurer",
    title: "Dental Leadership Coach",
    specialty: "Leadership Excellence",
    bio: "Expert in dental leadership mastery through overcoming challenges and inspiring excellence in dental practice management.",
    presentation: "Dental Leadership Mastery through Overcoming Challenges and Inspiring Excellence",
    email: "tmaurer@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/5429649-6842ab7fe456f.jpeg",
    category: "Practice Management"
  },
  {
    name: "Dr. Bijal Mehta",
    title: "Leadership Development Specialist",
    specialty: "Dental Leadership",
    bio: "Specialist in dental leadership development with focus on overcoming challenges and inspiring excellence in practice management.",
    presentation: "Dental Leadership Mastery through Overcoming Challenges and Inspiring Excellence",
    email: "bmehta@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4339984-66ce33c7a9fd7.jpg",
    category: "Practice Management"
  },
  {
    name: "Daniel Tataje",
    title: "Practice Excellence Coach",
    specialty: "Leadership Excellence",
    bio: "Expert in inspiring excellence through dental leadership mastery and overcoming practice management challenges.",
    presentation: "Dental Leadership Mastery through Overcoming Challenges and Inspiring Excellence",
    email: "dtataje@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703544-6759d7472d2d3.jpg",
    category: "Practice Management"
  },
  {
    name: "Jackson Tralongo",
    title: "Dental Leadership Advisor",
    specialty: "Challenge Resolution",
    bio: "Specialist in dental leadership mastery with expertise in overcoming challenges and inspiring excellence in dental practices.",
    presentation: "Dental Leadership Mastery through Overcoming Challenges and Inspiring Excellence",
    email: "jtralongo@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703552-6759d7c833e56.png",
    category: "Practice Management"
  },
  {
    name: "Christie Fink",
    title: "Dental Sleep Medicine Expert",
    specialty: "Dental Sleep Solutions",
    bio: "Expert in unlocking profitability by helping DSOs add dental sleep services to their practice offerings.",
    presentation: "Unlocking Profitability: Helping DSOs Add Dental Sleep",
    email: "cfink@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/5496439-685d57e640c90.png",
    category: "Sleep Medicine"
  },
  {
    name: "Mark T. Murphy",
    title: "Sleep Medicine Consultant",
    specialty: "DSO Sleep Integration",
    bio: "Specialist in helping DSOs integrate dental sleep services for increased profitability and expanded patient care.",
    presentation: "Unlocking Profitability: Helping DSOs Add Dental Sleep",
    email: "mmurphy@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/5496483-685d59d21e850.jpg",
    category: "Sleep Medicine"
  },
  {
    name: "Dr. Carter Reeves",
    title: "Dental Sleep Specialist",
    specialty: "Sleep Medicine",
    bio: "Expert in dental sleep medicine with focus on helping DSOs unlock profitability through sleep disorder treatment.",
    presentation: "Unlocking Profitability: Helping DSOs Add Dental Sleep",
    email: "creeves@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/5496433-685d57b56b704.png",
    category: "Sleep Medicine"
  },
  {
    name: "Avi Weisfogel",
    title: "Dental Sleep Medicine Pioneer",
    specialty: "Sleep Medicine Business",
    bio: "Pioneer in dental sleep medicine business development and expert in helping DSOs add profitable sleep services.",
    presentation: "Unlocking Profitability: Helping DSOs Add Dental Sleep",
    email: "aweisfogel@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/5496485-685d59f5830cd.jpg",
    category: "Sleep Medicine"
  },
  {
    name: "Dr. Jeffrey B. Carter",
    title: "AI Technology Specialist",
    specialty: "Artificial Intelligence in Dentistry",
    bio: "Expert in the future of AI and new technologies in dentistry with focus on smart smiles and technological advancement.",
    presentation: "Smart Smiles: The Future of AI and New Technologies in Dentistry",
    email: "jcarter@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/3978660-6655edb96fe92.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Jaideep R. Deshpande",
    title: "Dental Technology Innovator",
    specialty: "Advanced Dental Technology",
    bio: "Innovator in smart smiles technology and expert in the future of AI and new technologies in modern dentistry.",
    presentation: "Smart Smiles: The Future of AI and New Technologies in Dentistry",
    email: "jdeshpande@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753110818070-CFUjfIIK.png",
    category: "Digital Dentistry"
  },
  {
    name: "Nick Murray",
    title: "Technology Integration Specialist",
    specialty: "Dental Technology Implementation",
    bio: "Specialist in technology integration for smart smiles and expert in AI and new technologies for dental practices.",
    presentation: "Smart Smiles: The Future of AI and New Technologies in Dentistry",
    email: "nmurray@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/3998276-665dd472c437c.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Mariz Tanious",
    title: "Smart Dentistry Expert",
    specialty: "AI in Clinical Practice",
    bio: "Expert in smart smiles technology implementation and the future of AI and new technologies in dental clinical practice.",
    presentation: "Smart Smiles: The Future of AI and New Technologies in Dentistry",
    email: "mtanious@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/5486755-685aaace7733c.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Matt Carlston",
    title: "Team Building Expert",
    specialty: "Recruitment and Retention",
    bio: "Expert in building tomorrow's dental dream team with bold recruitment and retention tactics for dental practices.",
    presentation: "Building Tomorrow's Dental Dream Team: Bold Recruitment and Retention Tactics",
    email: "mcarlston@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4359610-66d767f46ad1c.jpg",
    category: "Practice Management"
  },
  {
    name: "Francesca Pregano",
    title: "HR Specialist",
    specialty: "Dental Team Development",
    bio: "Specialist in dental team recruitment and retention with expertise in building tomorrow's dental dream team.",
    presentation: "Building Tomorrow's Dental Dream Team: Bold Recruitment and Retention Tactics",
    email: "fpregano@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703525-6759d67e92be2.jpg",
    category: "Practice Management"
  },
  {
    name: "Lynda Ricketson",
    title: "Retention Strategist",
    specialty: "Employee Retention",
    bio: "Expert in employee retention strategies and bold tactics for building tomorrow's dental dream team.",
    presentation: "Building Tomorrow's Dental Dream Team: Bold Recruitment and Retention Tactics",
    email: "lricketson@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/3027991-65245ac5d744b.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Mahtab Sadrameli",
    title: "Team Development Consultant",
    specialty: "Dental Team Management",
    bio: "Consultant in dental team development with focus on bold recruitment and retention tactics for practice success.",
    presentation: "Building Tomorrow's Dental Dream Team: Bold Recruitment and Retention Tactics",
    email: "msadrameli@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4097861-66741bd5b41be.jpg",
    category: "Practice Management"
  },
  {
    name: "Rashed Din",
    title: "Specialty Area Manager",
    specialty: "DSO Specialty Management",
    bio: "Expert in managing specialty areas within DSO to improve growth and optimize specialty service delivery.",
    presentation: "How to Manage Specialty Areas within DSO to Improve Growth",
    email: "rdin@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703341-6759cd987efd4.jpg",
    category: "Practice Management"
  },
  {
    name: "Jason Huml",
    title: "DSO Growth Specialist",
    specialty: "Specialty Area Development",
    bio: "Specialist in DSO growth through specialty area management and development for enhanced practice performance.",
    presentation: "How to Manage Specialty Areas within DSO to Improve Growth",
    email: "jhuml@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/3924444-66422ff1063d0.jpg",
    category: "Practice Management"
  },
  {
    name: "Paul Kim",
    title: "Specialty Integration Expert",
    specialty: "Multi-Specialty Practice Management",
    bio: "Expert in specialty integration within DSO structures for improved growth and comprehensive patient care.",
    presentation: "How to Manage Specialty Areas within DSO to Improve Growth",
    email: "pkim@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703434-6759d1d76491e.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Ronald Saffar",
    title: "DSO Operations Expert",
    specialty: "Specialty Operations",
    bio: "Expert in DSO operations with focus on managing specialty areas for improved growth and operational efficiency.",
    presentation: "How to Manage Specialty Areas within DSO to Improve Growth",
    email: "rsaffar@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/3897083-663907b32673c.jpg",
    category: "Practice Management"
  },
  {
    name: "Jason Mann",
    title: "Leadership Development Coach",
    specialty: "Practice Longevity",
    bio: "Coach specializing in building dental leaders to improve strategies for practice longevity and sustainable success.",
    presentation: "Building Dental Leaders to Improve Strategies for Practice Longevity",
    email: "jmann@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4086807-66703b800ead5.jpeg",
    category: "Practice Management"
  },
  {
    name: "Erin A. O'Neil",
    title: "Strategic Planning Expert",
    specialty: "Long-term Practice Strategy",
    bio: "Expert in strategic planning for practice longevity with focus on building dental leaders and sustainable strategies.",
    presentation: "Building Dental Leaders to Improve Strategies for Practice Longevity",
    email: "eoneil@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703520-6759d5eaea4e1.jpg",
    category: "Practice Management"
  },
  {
    name: "Kate Wilson",
    title: "Practice Sustainability Consultant",
    specialty: "Dental Leadership",
    bio: "Consultant in practice sustainability with expertise in building dental leaders for long-term practice success.",
    presentation: "Building Dental Leaders to Improve Strategies for Practice Longevity",
    email: "kwilson@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4703559-6759d8165cb16.png",
    category: "Practice Management"
  },
  {
    name: "Ray Caruso",
    title: "DSO Partnership Expert",
    specialty: "Dental Practice Partnerships",
    bio: "Expert in winning DSO partnerships with focus on identifying and attracting ideal dental practices for growth.",
    presentation: "Winning DSO Partnerships: Identifying and Attracting Ideal Dental Practices",
    email: "rcaruso@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/2619548-6467cb1c0b17d.jpg",
    category: "Practice Management"
  },
  {
    name: "Alexander Einbinder",
    title: "Partnership Development Specialist",
    specialty: "Practice Acquisition",
    bio: "Specialist in partnership development for DSOs with expertise in identifying and attracting ideal dental practices.",
    presentation: "Winning DSO Partnerships: Identifying and Attracting Ideal Dental Practices",
    email: "aeinbinder@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4091127-667193138d15d.jpeg",
    category: "Practice Management"
  },
  {
    name: "Stephen Floe",
    title: "Practice Evaluation Expert",
    specialty: "Dental Practice Assessment",
    bio: "Expert in dental practice evaluation and assessment for winning DSO partnerships and practice integration.",
    presentation: "Winning DSO Partnerships: Identifying and Attracting Ideal Dental Practices",
    email: "sfloe@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4385773-66e0804e5aeeb.jpeg",
    category: "Practice Management"
  },
  {
    name: "Dr. DeVonte Johnson",
    title: "Community Dental Care Advocate",
    specialty: "Access to Care",
    bio: "Advocate for addressing disparities in dental care for vulnerable communities and improving access to dental services.",
    presentation: "Championing Access: Addressing Disparities in Dental Care for Vulnerable Communities",
    email: "djohnson@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753111648789-rju7nuea.png",
    category: "Community Health"
  },
  {
    name: "Dr. Sibera Brannon",
    title: "Leadership Resilience Coach",
    specialty: "Overcoming Obstacles",
    bio: "Coach specializing in building strong dental leaders through overcoming obstacles and driving success in dental practices.",
    presentation: "Building Strong Dental Leaders: Overcoming Obstacles and Driving Success",
    email: "sbrannon@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/4111122-667ad1160443a.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Manu Chaudhry",
    title: "Success Strategy Expert",
    specialty: "Dental Leadership Development",
    bio: "Expert in dental leadership development with focus on building strong leaders and driving practice success.",
    presentation: "Building Strong Dental Leaders: Overcoming Obstacles and Driving Success",
    email: "mchaudhry@devrightspeakers.com",
    imageUrl: "https://assets.swoogo.com/uploads/thumb/3516076-65c280f890c31.png",
    category: "Practice Management"
  },
  {
    name: "Sabrina Sennett",
    title: "Leadership Development Specialist",
    specialty: "Driving Practice Success",
    bio: "Specialist in leadership development for dental practices with expertise in overcoming obstacles and driving success.",
    presentation: "Building Strong Dental Leaders: Overcoming Obstacles and Driving Success",
    email: "ssennett@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753111600370-BHLNViZz.png",
    category: "Practice Management"
  },
  {
    name: "Mark Censoprano",
    title: "DSO Future Strategist",
    specialty: "DSO Evolution",
    bio: "Strategist focusing on the future of DSOs and next-generation strategies for dental service organization growth.",
    presentation: "What's Next for DSOs?",
    email: "mcensoprano@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753111923782-BHzV5prw.png",
    category: "Practice Management"
  },
  {
    name: "Louis Chmura",
    title: "DSO Innovation Expert",
    specialty: "DSO Future Trends",
    bio: "Expert in DSO innovation and future trends with focus on what's next for dental service organizations.",
    presentation: "What's Next for DSOs?",
    email: "lchmura@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753112229274-v2eA-ULh.png",
    category: "Practice Management"
  },
  {
    name: "Suzie Ramos",
    title: "DSO Development Consultant",
    specialty: "DSO Strategy",
    bio: "Consultant in DSO development and strategic planning for the future of dental service organizations.",
    presentation: "What's Next for DSOs?",
    email: "sramos@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753111899535-Co2XTxGU.png",
    category: "Practice Management"
  },
  {
    name: "Stef Simich",
    title: "DSO Transformation Expert",
    specialty: "DSO Evolution Strategy",
    bio: "Expert in DSO transformation and evolution strategies with focus on future trends in dental service organizations.",
    presentation: "What's Next for DSOs?",
    email: "ssimich@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1753112243990-wqMkcq2m.png",
    category: "Practice Management"
  }
];

export class BeckersSpeakerImporter {
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

    console.log(`Starting import of ${beckersSpeakers.length} Becker's speakers...`);

    for (const speakerData of beckersSpeakers) {
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
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`Becker's import completed:`);
    console.log(`✅ Successfully imported: ${results.success} speakers`);
    console.log(`❌ Failed to import: ${results.errors.length} speakers`);
    
    if (results.errors.length > 0) {
      console.log(`Errors:`);
      results.errors.forEach(error => console.log(`- ${error}`));
    }

    return results;
  }
}