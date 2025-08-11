import { db } from "./db";
import { speakers, categories } from "@shared/schema";
import { eq } from "drizzle-orm";

// Speaker data parsed from dentalsymposiumhub.com
const speakerData = [
  // Academy of Prosthodontics AP 2025 Speakers
  {
    name: "Dr. Eric Caron",
    title: "Prosthodontist",
    specialty: "CAD-CAM Technology",
    bio: "Expert in CAD-CAM Technology with focus on RPD applications and clinical expectations.",
    presentation: "CAD-CAM RPD: Does It Really Live Up To Our Clinical Expectations?",
    email: "ecaron@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/caron_100w_jpg.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Armand Bedrossian",
    title: "Prosthodontist",
    specialty: "Full Arch Workflow Specialist",
    bio: "Specialist in full arch workflows combining traditional techniques with modern technology.",
    presentation: "Tradition Meets Technology for Full Arch Workflows: What Have We Learned?",
    email: "abedrossian@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/bedrossian_100w_jpg.jpg",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Luca Cordaro",
    title: "Prosthodontist",
    specialty: "Full Arch Implant Rehabilitation",
    bio: "Expert in full arch maxilla rehabilitation and advanced implant placement techniques.",
    presentation: "Full Arch Maxilla: Are Tilted Implants the Only Option?",
    email: "lcordaro@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2023_naples_fl/cordaro_100w_jpg.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Amara Abreu-Serrano",
    title: "Prosthodontist",
    specialty: "Cleft Lip and Palate Specialist",
    bio: "Specialized in management of lateral incisor area in cleft lip and palate patients.",
    presentation: "Management of the Lateral Incisor Area in Cleft Lip and Palate Patients",
    email: "aabreu-serrano@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/abreu_serrano_100w_jpg.jpg",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Tara Aghaloo",
    title: "Oral and Maxillofacial Surgeon",
    specialty: "Zygomatic Implant Specialist",
    bio: "Expert in zygomatic implants and complex maxillofacial surgical procedures.",
    presentation: "Zygomatic Implants: What Do We Know and What Do We Need to Know?",
    email: "taghaloo@devrightspeakers.com",
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Hongseok An",
    title: "Digital Dentistry Specialist",
    specialty: "Intraoral Scanning Expert",
    bio: "Expert in intraoral scanning technology, research applications, and clinical limitations.",
    presentation: "Intraoral Scanning: Research, Clinical Applications, and Limitations",
    email: "han@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/an_100w_jpg.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Marco Ferrari",
    title: "Professor of Restorative Dentistry",
    specialty: "Digital Prosthodontic Materials",
    bio: "Professor specializing in clinical studies of digital prosthodontic materials and applications.",
    presentation: "Clinical Studies of Digital Prosthodontic Materials",
    email: "mferrari@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/ferrari_100w_jpg.jpg",
    category: "Restorative Dentistry"
  },
  {
    name: "Dr. Lily Garcia",
    title: "Dental Association Executive",
    specialty: "National Forum Navigation",
    bio: "Expert in navigating academics and national forums in dental education and leadership.",
    presentation: "Navigating Academics and National Forums",
    email: "lgarcia@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/garcia_100w_jpg.jpg",
    category: "Education"
  },
  {
    name: "Dr. Tom Deans",
    title: "Financial Strategist",
    specialty: "Wealth Management Expert",
    bio: "Expert in wealth management and generational wealth transfer strategies for dental professionals.",
    presentation: "The Great Wealth Transfer: Opportunities and Threats to Generational Wealth",
    email: "tdeans@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/deans_100w_jpg.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Heather Conrad",
    title: "Prosthodontist",
    specialty: "Board Certification Specialist",
    bio: "Expert in American Board of Prosthodontics certification and examination processes.",
    presentation: "The American Board of Prosthodontics",
    email: "hconrad@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/conrad_100w_jpg.jpg",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Sarah Knox",
    title: "Oral and Maxillofacial Surgeon",
    specialty: "Salivary Gland Specialist",
    bio: "Specialist in salivary gland preservation through peripheral nerve techniques.",
    presentation: "Saving the Salivary Gland through Peripheral Nerves",
    email: "sknox@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/knox_100w_jpg.jpg",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Antonia Kolokythas",
    title: "Oral and Maxillofacial Surgeon",
    specialty: "Complex Craniofacial Reconstruction",
    bio: "Expert in complex craniofacial reconstruction with extensive experience in challenging cases.",
    presentation: "The Endless Possibilities and Equally Endless Challenges of Complex Craniofacial Reconstruction",
    email: "akolokythas@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/kolokythas_100w_jpg.jpg",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Effie Ioannidou",
    title: "Academic Leader",
    specialty: "Gender Parity in Dental Academia",
    bio: "Academic leader focused on gender parity and leadership development in dental academia.",
    presentation: "Beyond the Glass Ceiling: The Playbook for Gender Parity in Dental Academia",
    email: "eioannidou@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/ioannidou_100w_jpg.jpg",
    category: "Education"
  },
  {
    name: "Dr. Mariam Margvelashvili-Malament",
    title: "Prosthodontist",
    specialty: "Restorative vs Implant Therapy",
    bio: "Expert in comparing restorative and implant therapy outcomes and complication management.",
    presentation: "A Story of a Tooth, From a Restoration to an Implant. Which One is Complication Free?",
    email: "mmargvelashvili@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/margvelashvilli_malament_100w_jpg.jpg",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Sarah Lee",
    title: "Maxillofacial Prosthodontist",
    specialty: "Complex Prosthetic Rehabilitation",
    bio: "Expert in balancing evidence and practicalities in complex prosthetic rehabilitation.",
    presentation: "Logic and Logistics in Maxillofacial Prosthodontics: Balancing Evidence and Practicalities in Complex Prosthetic Rehabilitation",
    email: "slee@devrightspeakers.com",
    imageUrl: "https://www.oregonclinic.com/wp-content/uploads/2023/05/lee_sarah_2018_web_500x400.jpg",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Mark Montana",
    title: "Prosthodontist",
    specialty: "Digital Occlusion Specialist",
    bio: "Expert in occlusion in the digital age and application of traditional knowledge to modern techniques.",
    presentation: "Occlusion in the Digital Age - What We Can Learn from What We Know?",
    email: "mmontana@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/montana_100w_jpg.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Mijin Choi",
    title: "Academy President",
    specialty: "Prosthodontics Leadership",
    bio: "Academy President with leadership experience in prosthodontics education and professional development.",
    presentation: "Opening Ceremony",
    email: "mchoi@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1751987501774-BbhY6atV.png",
    category: "Education"
  },
  {
    name: "Dr. John Sorensen",
    title: "Prosthodontist",
    specialty: "Clinical Prosthodontics",
    bio: "Expert in validating digital technology and materials for prosthodontic private practice applications.",
    presentation: "Digital Daze- Validating Available Digital Technology and Digital Materials for Prosthodontic Private Practice",
    email: "jsorensen@devrightspeakers.com",
    imageUrl: "https://dental.washington.edu/nitropack_static/OzRdaOlZOlesdjvmzRstSVMVojzDUFVx/assets/images/optimized/rev-c702e69/dental.washington.edu/wp-content/media/Sorensen.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. David Wands",
    title: "Leadership Expert",
    specialty: "Academy Leadership Legacy",
    bio: "Leadership expert focused on academy development and future planning for professional organizations.",
    presentation: "Our Academy, Our Future",
    email: "dwands@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1751988021444-xPxUEgo3.png",
    category: "Education"
  },
  {
    name: "Dr. Michael Reddy",
    title: "Dean of Academic Affairs",
    specialty: "Academic Dentistry Leadership",
    bio: "Dean with expertise in academic dentistry leadership and future of dental education.",
    presentation: "The Future of Academic Dentistry",
    email: "mreddy@devrightspeakers.com",
    imageUrl: "https://chancellor.ucsf.edu/sites/chancellor.ucsf.edu/files/2024-06/Mike%20Reddy%2016x9.jpg",
    category: "Education"
  },
  {
    name: "Dr. Tony Rotondo",
    title: "Prosthodontist",
    specialty: "Advanced Dental Techniques",
    bio: "Expert in management of two-tooth spaces with implants in the aesthetic zone.",
    presentation: "The Management of Two-Tooth Spaces with Implants in the Aesthetic Zone",
    email: "trotondo@devrightspeakers.com",
    imageUrl: "https://rotondoclinic.com.au/wp-content/uploads/sites/4/2024/07/rotondo_clinic_dr_tony_rotondo.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Frank Tuminelli",
    title: "Prosthodontist",
    specialty: "Dental Specialty Recognition",
    bio: "Expert in dental specialty recognition and certifying board processes and procedures.",
    presentation: "The National Commission Dental Specialty Recognition and Certifying Boards",
    email: "ftuminelli@devrightspeakers.com",
    imageUrl: "https://www.nspali.com/wp-content/uploads/Frank-Tuminelli-4x6-1.jpg",
    category: "Education"
  },
  {
    name: "Dr. George Tysowsky",
    title: "Dental Technology Economist",
    specialty: "Economic Impact Analysis",
    bio: "Expert in economic impact analysis of dental technologies and market assessment.",
    presentation: "Economic Impact on Dental Technologies",
    email: "gtysowsky@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1752000422713-CcQUBGZI.png",
    category: "Practice Management"
  },
  {
    name: "Dr. Ahmet Orgev",
    title: "Digital Dentistry Specialist",
    specialty: "AI in Implant Dentistry",
    bio: "Expert in artificial intelligence applications for implant dentistry and current technological trends.",
    presentation: "Artificial Intelligence to Elevate Implant Dentistry: Current Trends",
    email: "aorgev@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/orgev_100w_jpg.jpg",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Carol Lefebvre",
    title: "Executive Leadership Coach",
    specialty: "Leadership Development",
    bio: "Executive leadership coach specializing in leadership development for dental professionals.",
    presentation: "Becoming a Better Leader with Executive Leadership Coaching",
    email: "clefebvre@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/lefebvre_100w_jpg.jpg",
    category: "Practice Management"
  },
  {
    name: "Dr. Steve Parel",
    title: "Prosthodontist",
    specialty: "Implant Prosthodontics Pioneer",
    bio: "Pioneer in implant prosthodontics with extensive experience in clinical applications.",
    presentation: "It's Us",
    email: "sparel@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/parel_100w_jpg.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Steve Sadowsky",
    title: "Prosthodontist",
    specialty: "Teeth vs Implants Specialist",
    bio: "Expert in comparing natural teeth and implants with forty years of clinical experience.",
    presentation: "Forty Years Later: Are Teeth Superior to Implants?",
    email: "ssadowsky@devrightspeakers.com",
    imageUrl: "https://www.academyofprosthodontics.org/2025_scottsdale/sadowsky_100w_jpg.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Dean Morton",
    title: "Prosthodontist",
    specialty: "Advanced Prosthodontics",
    bio: "Expert in advanced prosthodontic techniques and clinical applications.",
    presentation: "Advances in Prosthodontics - A Discussion",
    email: "dmorton@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1751988414933-CXHzH0ga.png",
    category: "Prosthodontics"
  },

  // Neodent Full Arch Growth Summit Speakers
  {
    name: "Dr. Peyman Raissi",
    title: "Prosthodontist",
    specialty: "Prosthetic Options for Full Arch",
    bio: "Expert in prosthetic options and treatment planning for full arch rehabilitation.",
    presentation: "Prosthetic Options for Full Arch",
    email: "praissi@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Raissi-FAS_1751917655805-7WysFqw3.png",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Ryan Dunlop",
    title: "Digital Dentistry Specialist",
    specialty: "Full Arch Digital Workflow",
    bio: "Specialist in digital workflows for full arch rehabilitation and treatment planning.",
    presentation: "Full Arch Digital Workflow",
    email: "rdunlop@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Dunlop-FAS_1751917650493-DSE8nmu_.png",
    category: "Digital Dentistry"
  },
  {
    name: "Dr. Vishy Broumand",
    title: "Oral Surgeon",
    specialty: "Complication Management",
    bio: "Expert in managing complications in oral surgery and implant procedures.",
    presentation: "Managing Complications",
    email: "vbroumand@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Broumand-FAS_1751917650492-CH49JPwF.png",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Athena Goodarzi",
    title: "Implant Dentist",
    specialty: "Full Arch Dentistry Specialist",
    bio: "Specialist in mastering full arch dentistry with focus on impactful clinical changes.",
    presentation: "Mastering Full Arch Dentistry: Small Changes, Big Impact",
    email: "agoodarzi@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/images_1751918095633-CeAotZD9.jpg",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Sergio Bernardes",
    title: "Oral Surgeon",
    specialty: "Surgical Innovation Expert",
    bio: "Expert in surgical innovation and decision-making for full arch procedures.",
    presentation: "Mastering Full Arch Decisions: From Prosthetics to Surgical Innovation",
    email: "sbernardes@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Bernardes-%20FAS_1751917650491-BliLdRoh.png",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Sully Sullivan",
    title: "Implant Dentist",
    specialty: "Full Arch Practice Growth",
    bio: "Expert in full arch practice growth strategies and implementation.",
    presentation: "Full Arch Practice Growth",
    email: "ssullivan@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Sullivan-FAS-2_1751917658141-Bzva79Ec.png",
    category: "Practice Management"
  },
  {
    name: "Dr. Tarun Agarwal",
    title: "Implant Dentist",
    specialty: "Full Arch Practice Growth",
    bio: "Specialist in developing and scaling full arch dental practices.",
    presentation: "Full Arch Practice Growth",
    email: "tagarwal@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Agarwal-FAS-1_1751917650493-Gd_2J0aE.png",
    category: "Practice Management"
  },
  {
    name: "Dr. James Fetsch",
    title: "Implant Dentist",
    specialty: "Advanced Full Arch Techniques",
    bio: "Expert in advanced techniques for full arch implant rehabilitation.",
    presentation: "Advanced Full Arch Techniques",
    email: "jfetsch@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Fetsch-FAS_1751917652794-B2yFkHYE.png",
    category: "Implant Dentistry"
  },
  {
    name: "Dr. Clark Damon",
    title: "Prosthodontist",
    specialty: "Chairside Conversion Specialist",
    bio: "Specialist in simplified chairside conversions for full arch procedures.",
    presentation: "Simplified Chairside Conversions",
    email: "cdamon@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Damon-FAS_1751917650492-B30yPeic.png",
    category: "Prosthodontics"
  },
  {
    name: "Edward Khalameizer",
    title: "Dental Technician",
    specialty: "Zirconia Full Arch Prosthetics",
    bio: "Expert dental technician specializing in glazing and finishing for zirconia full arch prosthetics.",
    presentation: "Mastering Glazing & Finishing for Zirconia Full Arch Prosthetics Hands-On Workshop",
    email: "ekhalameizer@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/image_1751981426311-NjMGSZik.png",
    category: "Prosthodontics"
  },
  {
    name: "Dr. Azam Saeed",
    title: "Oral Surgeon",
    specialty: "Full Arch Surgical Protocols",
    bio: "Expert in full arch surgical protocols and practice development strategies.",
    presentation: "Panel Discussion: Learnings in Opening and Scaling a Full Arch Practice",
    email: "asaeed@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Saeed-FAS_1751917656705-BQ6d0bJu.png",
    category: "Oral Surgery"
  },
  {
    name: "Dr. Seth Chambers",
    title: "Implant Dentist",
    specialty: "Full Arch Practice Development",
    bio: "Expert in opening and scaling full arch practices with focus on sustainable growth.",
    presentation: "Panel Discussion: Learnings in Opening and Scaling a Full Arch Practice",
    email: "schambers@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/Chambers-FAS_1751917650492-BNPLaZEY.png",
    category: "Practice Management"
  },
  {
    name: "Mike Graham",
    title: "VP of Sales",
    specialty: "Business Development",
    bio: "VP of Sales with expertise in business development and market strategy.",
    presentation: "Opening Remarks",
    email: "mgraham@devrightspeakers.com",
    imageUrl: "https://dentalsymposiumhub.com/assets/1661204465321_1751919181307-DDhLhBhZ.jpg",
    category: "Practice Management"
  }
];

interface ImportedSpeaker {
  name: string;
  title: string;
  specialty: string;
  bio: string;
  presentation: string;
  email: string;
  imageUrl: string;
  category: string;
}

export class BulkSpeakerImporter {
  constructor() {}

  async importAllSpeakers(): Promise<{ success: number; errors: string[] }> {
    const results = { success: 0, errors: [] };
    
    console.log(`Starting bulk import of ${speakerData.length} speakers...`);

    for (const speakerInfo of speakerData) {
      try {
        await this.importSingleSpeaker(speakerInfo);
        results.success++;
        console.log(`✅ Successfully imported: ${speakerInfo.name}`);
      } catch (error) {
        const errorMsg = `Failed to import ${speakerInfo.name}: ${error instanceof Error ? error.message : String(error)}`;
        (results.errors as string[]).push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`\nBulk import completed:`);
    console.log(`✅ Successfully imported: ${results.success} speakers`);
    console.log(`❌ Failed to import: ${results.errors.length} speakers`);
    
    if (results.errors.length > 0) {
      console.log(`\nErrors:`);
      results.errors.forEach(error => console.log(`- ${error}`));
    }

    return results;
  }

  private async importSingleSpeaker(speakerInfo: ImportedSpeaker): Promise<void> {
    // Check if speaker already exists
    const existingSpeaker = await db
      .select()
      .from(speakers)
      .where(eq(speakers.name, speakerInfo.name))
      .limit(1);

    if (existingSpeaker.length > 0) {
      throw new Error(`Speaker already exists in database`);
    }

    // Find or create category
    let categoryRecord = await db
      .select()
      .from(categories)
      .where(eq(categories.name, speakerInfo.category))
      .limit(1);

    if (categoryRecord.length === 0) {
      // Create new category if it doesn't exist
      const [newCategory] = await db
        .insert(categories)
        .values({
          name: speakerInfo.category,
          description: `${speakerInfo.category} specialists and experts`
        })
        .returning();
      categoryRecord = [newCategory];
    }

    // For now, use the original image URLs directly
    let finalImageUrl = speakerInfo.imageUrl;

    // Generate slug from name
    const slug = speakerInfo.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Create speaker record
    await db.insert(speakers).values({
      name: speakerInfo.name,
      slug: slug,
      title: speakerInfo.title,
      bio: speakerInfo.bio,
      expertise: [speakerInfo.specialty, speakerInfo.presentation],
      location: "United States", // Default location
      imageUrl: finalImageUrl,
      email: speakerInfo.email,
      category: speakerInfo.category,
      speakerType: "Healthcare Professional",
      verified: true,
      featured: false,
      overallRating: "4.80", // Default high rating for imported professionals
      reviewCount: 0,
      hideRatings: false,
      website: null,
      phone: null,
      languages: ["English"],
      achievements: [speakerInfo.specialty],
      lectures: [speakerInfo.presentation],
      socialMedia: [],
      medicalSpecialties: [speakerInfo.specialty],
      fee: "$500/hour", // Default rate
      experience: 10, // Default years of experience
      hideProfile: false,
      hideContact: false,
      hideSocial: false
    });
  }


}