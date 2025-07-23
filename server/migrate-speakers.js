// Migration script to restore all speakers to database
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon
neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Speaker data from official-speakers.ts (converted to JS format)
const officialSpeakers = [
  {
    name: "Dr. Waldemar Polido",
    slug: "waldemarpolido",
    title: "Oral and Maxillofacial Surgeon",
    bio: "Renowned specialist in zygomatic implants and complex maxillofacial reconstruction. Dr. Polido has extensive experience in full arch rehabilitation for atrophic maxillary patients.",
    expertise: ["Oral Surgery", "Maxillofacial Surgery", "Zygomatic Implants", "Complex Reconstruction", "Full Arch Rehabilitation"],
    location: "Multiple Locations",
    overall_rating: 4.93,
    review_count: 78,
    image_url: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Waldemar-Polido.png",
    verified: true,
    featured: true,
    category: "Oral Surgery",
    achievements: ["Zygomatic Implant Specialist", "Complex Maxillofacial Reconstruction Expert", "Full Arch Rehabilitation Pioneer", "International Lecturer"],
    lectures: ["Zygomatic Implant Techniques", "Complex Maxillofacial Reconstruction", "Full Arch Rehabilitation Protocols", "Advanced Surgical Techniques", "Atrophic Maxillary Management"],
    email: "wpolido@devrightspeakers.com",
    phone: "214-884-4100",
    website: "https://devrightspeakers.com",
    languages: ["English"],
    speaker_type: "clinical",
    fee: "7000",
    hide_profile: false,
    hide_ratings: false,
    hide_social: false,
    hide_contact: false
  },
  {
    name: "Dr. Will Martin",
    slug: "willmartin", 
    title: "Prosthodontist",
    bio: "Leading expert in team-based implant workflows and full arch rehabilitation. Dr. Martin specializes in simplified implant protocols and collaborative treatment approaches.",
    expertise: ["Prosthodontics", "Implant Dentistry", "Team-Based Workflows", "Full Arch Rehabilitation", "Collaborative Treatment"],
    location: "Multiple Locations",
    overall_rating: 4.92,
    review_count: 85,
    image_url: "https://dev-right-conference-devright.replit.app/attached_assets/straumann_speakers/FAF-Will-Martin.png",
    verified: true,
    featured: true,
    category: "Prosthodontics",
    achievements: ["Team-Based Implant Workflow Expert", "Full Arch Rehabilitation Specialist", "Simplified Implant Protocol Pioneer", "Collaborative Treatment Leader"],
    lectures: ["Team-Based Implant Workflows", "Full Arch Rehabilitation Protocols", "Simplified Implant Techniques", "Collaborative Treatment Planning", "Advanced Prosthodontic Solutions"],
    email: "wmartin@devrightspeakers.com",
    phone: "214-884-4100", 
    website: "https://devrightspeakers.com",
    languages: ["English"],
    speaker_type: "clinical",
    fee: "8000",
    hide_profile: false,
    hide_ratings: false,
    hide_social: false,
    hide_contact: false
  },
  {
    name: "Dr. Sascha Jovanovic",
    slug: "saschajovanovic",
    title: "Oral Implantologist & Digital Dentistry Expert", 
    bio: "World-renowned expert in implant dentistry and digital technologies. Known for innovative approaches to complex cases.",
    expertise: ["Digital Dentistry", "Oral Surgery", "Implantology"],
    location: "Düsseldorf, Germany",
    overall_rating: 4.9,
    review_count: 127,
    image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
    verified: true,
    featured: true,
    category: "Digital Dentistry",
    achievements: ["100+ Complex Implant Cases", "Digital Workflow Pioneer"],
    lectures: ["Advanced Implant Techniques", "Digital Dentistry Revolution"],
    email: "sascha@implantcenter.de",
    phone: "+49-211-555-0123",
    website: "https://implantcenter.de",
    languages: ["German", "English"],
    speaker_type: "Keynote Speaker",
    fee: "$15,000 - $25,000",
    hide_profile: false,
    hide_ratings: false,
    hide_social: false,
    hide_contact: false
  }
];

async function migrateSpeakers() {
  console.log('Starting speaker migration...');
  
  try {
    for (const speaker of officialSpeakers) {
      const query = `
        INSERT INTO speakers (
          name, slug, title, bio, expertise, location, overall_rating, review_count, 
          image_url, verified, featured, category, achievements, lectures, email, phone, 
          website, languages, speaker_type, fee, hide_profile, hide_ratings, hide_social, hide_contact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          title = EXCLUDED.title,
          bio = EXCLUDED.bio,
          expertise = EXCLUDED.expertise,
          location = EXCLUDED.location,
          overall_rating = EXCLUDED.overall_rating,
          review_count = EXCLUDED.review_count,
          image_url = EXCLUDED.image_url,
          verified = EXCLUDED.verified,
          featured = EXCLUDED.featured,
          category = EXCLUDED.category,
          achievements = EXCLUDED.achievements,
          lectures = EXCLUDED.lectures,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          website = EXCLUDED.website,
          languages = EXCLUDED.languages,
          speaker_type = EXCLUDED.speaker_type,
          fee = EXCLUDED.fee,
          hide_profile = EXCLUDED.hide_profile,
          hide_ratings = EXCLUDED.hide_ratings,
          hide_social = EXCLUDED.hide_social,
          hide_contact = EXCLUDED.hide_contact
      `;
      
      const values = [
        speaker.name,
        speaker.slug,
        speaker.title,
        speaker.bio,
        speaker.expertise,
        speaker.location,
        speaker.overall_rating,
        speaker.review_count,
        speaker.image_url,
        speaker.verified,
        speaker.featured,
        speaker.category,
        speaker.achievements,
        speaker.lectures,
        speaker.email,
        speaker.phone,
        speaker.website,
        speaker.languages,
        speaker.speaker_type,
        speaker.fee,
        speaker.hide_profile,
        speaker.hide_ratings,
        speaker.hide_social,
        speaker.hide_contact
      ];
      
      await pool.query(query, values);
      console.log(`✓ Added ${speaker.name}`);
    }
    
    console.log('✓ Speaker migration completed successfully!');
    
    // Show final count
    const result = await pool.query('SELECT COUNT(*) as count FROM speakers');
    console.log(`Total speakers in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

migrateSpeakers();