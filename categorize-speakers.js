import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Category mapping based on speaking topics
const categoryMappings = {
  'Periodontology': [
    'periodontology', 'periodontics', 'periodontal', 'gum disease', 'peri-implantitis'
  ],
  'Prosthodontics': [
    'prosthodontics', 'prosthetic', 'crowns', 'bridges', 'dentures', 'full arch', 'removable prosthetics'
  ],
  'Implant Dentistry': [
    'implant', 'osseointegration', 'zygomatic', 'pterygoid', 'immediate loading'
  ],
  'Oral Surgery': [
    'oral surgery', 'maxillofacial surgery', 'surgical', 'extractions', 'bone grafting'
  ],
  'Digital Dentistry': [
    'digital', 'cad/cam', '3d printing', 'digital workflows', 'digital lab', 'intraoral scanning'
  ],
  'Orthodontics': [
    'orthodontics', 'orthodontic', 'clear aligners', 'braces', 'teeth straightening'
  ],
  'Esthetic Dentistry': [
    'esthetic', 'aesthetic', 'cosmetic', 'smile design', 'veneers', 'whitening'
  ],
  'Practice Management': [
    'practice management', 'business', 'dso', 'operations', 'leadership', 'team management'
  ],
  'General Dentistry': [
    'general dentistry', 'comprehensive care', 'preventive', 'restorative dentistry'
  ],
  'Endodontics': [
    'endodontics', 'root canal', 'pulp therapy', 'regenerative endodontics'
  ],
  'Sleep Medicine': [
    'sleep medicine', 'sleep apnea', 'airway', 'oral appliances'
  ],
  'Dental Hygiene': [
    'dental hygiene', 'preventive care', 'patient education', 'infection control'
  ],
  'Education': [
    'education', 'training', 'curriculum', 'continuing education', 'clinical research'
  ],
  'Technology': [
    'ai technology', 'automation', 'equipment', 'innovation', 'robotics'
  ],
  'Pediatric Dentistry': [
    'pediatric', 'children', 'adolescent'
  ]
};

function categorizeByTopics(topics) {
  const topicsLower = topics.map(topic => 
    topic.toLowerCase()
      .replace(/["""]/g, '') // Remove quote artifacts
      .replace(/,$/, '') // Remove trailing commas
      .trim()
  );
  
  // Count matches for each category
  const categoryScores = {};
  
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    let score = 0;
    
    for (const topic of topicsLower) {
      for (const keyword of keywords) {
        if (topic.includes(keyword)) {
          score += 1;
          break; // Don't double count same topic
        }
      }
    }
    
    if (score > 0) {
      categoryScores[category] = score;
    }
  }
  
  // Return the category with highest score, or 'General Dentistry' as default
  if (Object.keys(categoryScores).length === 0) {
    return 'General Dentistry';
  }
  
  return Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)[0][0];
}

async function categorizeSpeakers() {
  try {
    console.log('Analyzing speaker topics and assigning categories...');
    
    // Get all speakers with their topics
    const speakersResult = await pool.query(
      'SELECT id, name, expertise FROM speakers WHERE expertise IS NOT NULL'
    );
    
    const speakers = speakersResult.rows;
    console.log(`Found ${speakers.length} speakers to categorize`);
    
    let updated = 0;
    const categoryStats = {};
    
    for (const speaker of speakers) {
      const category = categorizeByTopics(speaker.expertise);
      
      // Update speaker category
      await pool.query(
        'UPDATE speakers SET category = $1 WHERE id = $2',
        [category, speaker.id]
      );
      
      // Track stats
      categoryStats[category] = (categoryStats[category] || 0) + 1;
      updated++;
      
      if (updated % 50 === 0) {
        console.log(`Processed ${updated} speakers...`);
      }
    }
    
    console.log('\n=== Categorization Complete ===');
    console.log(`✅ Updated ${updated} speakers`);
    console.log('\n=== Category Distribution ===');
    
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`${category}: ${count} speakers`);
      });
    
    // Now update the categories table with accurate counts
    console.log('\nUpdating categories table...');
    
    // Clear existing categories
    await pool.query('DELETE FROM categories');
    
    // Insert new categories with accurate counts
    for (const [category, count] of Object.entries(categoryStats)) {
      const description = getCategoryDescription(category);
      
      await pool.query(
        'INSERT INTO categories (name, description, speaker_count) VALUES ($1, $2, $3)',
        [category, description, count]
      );
    }
    
    console.log('✅ Categories table updated successfully');
    await pool.end();
    
  } catch (error) {
    console.error('Error categorizing speakers:', error);
    process.exit(1);
  }
}

function getCategoryDescription(category) {
  const descriptions = {
    'Periodontology': 'Gum disease treatment, periodontal therapy, and supporting structures of teeth',
    'Prosthodontics': 'Restorative dentistry and prosthetic rehabilitation including crowns, bridges, and dentures',
    'Implant Dentistry': 'Dental implants, osseointegration, and implant-supported prosthetic rehabilitation',
    'Oral Surgery': 'Surgical procedures in the oral cavity including extractions, implants, and complex surgical interventions',
    'Digital Dentistry': 'CAD/CAM technology, 3D printing, digital workflows, and modern dental technology solutions',
    'Orthodontics': 'Teeth straightening, bite correction, and orthodontic treatment planning',
    'Esthetic Dentistry': 'Cosmetic procedures, smile design, and aesthetic treatment planning',
    'Practice Management': 'Dental practice operations, business growth, team management, and operational efficiency',
    'General Dentistry': 'Comprehensive dental care covering all aspects of oral health and preventive dentistry',
    'Endodontics': 'Root canal therapy and treatment of dental pulp and periapical tissues',
    'Sleep Medicine': 'Sleep disorders, sleep apnea treatment, and oral appliance therapy',
    'Dental Hygiene': 'Preventive care, patient education, and dental hygiene best practices',
    'Education': 'Dental education, training methodologies, and educational program development',
    'Technology': 'Innovative dental technologies, AI, automation, and digital solutions',
    'Pediatric Dentistry': 'Specialized dental care for children and adolescents'
  };
  
  return descriptions[category] || `${category} specialists and professionals`;
}

categorizeSpeakers();