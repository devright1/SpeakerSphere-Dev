import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Category mapping based on speaking topics
const categoryMappings = {
  'Periodontology': [
    'periodontology', 'periodontics', 'periodontal', 'gum disease', 'peri-implantitis',
    'microsurgical periodontology', 'periodontal surgery', 'periodontal regeneration',
    'periodontal medicine', 'periodontal microbiology', 'periodontal plastic surgery',
    'periodontal research', 'chronic periodontitis', 'perio-prosthodontic', 'perio-prosthodontics'
  ],
  'Prosthodontics': [
    'prosthodontics', 'prosthetic', 'crowns', 'bridges', 'dentures', 'full arch', 'removable prosthetics',
    'maxillofacial prosthetics', 'maxillofacial prosthodontics', 'complex prosthodontics',
    'advanced prosthodontics', 'clinical prosthodontics', 'conical telescopic prosthodontics',
    'digital prosthodontics', 'implant prosthodontics', 'full-arch prosthodontics'
  ],
  'Implant Dentistry': [
    'implant', 'osseointegration', 'zygomatic', 'pterygoid', 'immediate loading',
    'implant surgery', 'implant placement', 'implant dentistry', 'implant reconstruction',
    'implant complications', 'implant maintenance', 'implant prosthetic', 'implantology',
    'full arch implant', 'digital implant', 'all-on-4', 'all-on-x', 'subperiosteal implants',
    'extramaxillary implants', 'ceramic zirconia implants', 'biocompatible implant'
  ],
  'Oral Surgery': [
    'oral surgery', 'maxillofacial surgery', 'surgical', 'extractions', 'bone grafting',
    'craniomaxillofacial surgery', 'craniofacial surgery', 'complex oral surgery',
    'advanced oral surgery', 'surgical procedures', 'guided bone regeneration',
    'bone reconstruction', 'bone regeneration', 'tissue reconstruction', 'ridge augmentation',
    'maxillary sinus augmentation', 'segmental osteotomy', 'virtual surgical planning'
  ],
  'Digital Dentistry': [
    'digital', 'cad/cam', '3d printing', 'digital workflows', 'digital lab', 'intraoral scanning',
    'digital technology', 'digital treatment planning', 'digital smile design',
    'digital interdisciplinary', 'digital occlusion', 'cbct', '3d imaging',
    'navigated surgery', 'digital software', 'cad-cam technology', '3d model surgery',
    'aesthetic digital prosthetics', 'clinic-to-lab integration'
  ],
  'Orthodontics': [
    'orthodontics', 'orthodontic', 'clear aligners', 'braces', 'teeth straightening',
    'interdisciplinary orthodontics', 'adult orthodontics', 'clear aligner therapy',
    'invisalign', 'airway orthodontics', 'midfacial expansion', 'digital orthodontics',
    'same-day treatment', 'contemporary treatments', 'orthodontics & sleep medicine'
  ],
  'Esthetic Dentistry': [
    'esthetic', 'aesthetic', 'cosmetic', 'smile design', 'veneers', 'whitening',
    'esthetic implant', 'esthetic zone', 'complex esthetic', 'facial cosmetics',
    'aesthetic dentistry 4.0', 'adhesive rehabilitation', 'bonding procedures',
    'ceramic technology', 'zirconia restorations', 'posterior restorations'
  ],
  'Practice Management': [
    'practice management', 'business', 'dso', 'operations', 'leadership', 'team management',
    'practice growth', 'business development', 'team building', 'dental leadership',
    'practice philosophy', 'change management', 'market strategy', 'practice adaptation',
    'dental operations', 'dental team management', 'building managing teams',
    'leadership development', 'leadership resilience', 'specialty operations',
    'dental practice leadership', 'dental practice operations'
  ],
  'General Dentistry': [
    'general dentistry', 'comprehensive care', 'preventive', 'restorative dentistry',
    'comprehensive dentistry', 'patient-centered care', 'patient-first care',
    'saving teeth', 'restorative vs implant', 'teeth vs implants', 'access to care'
  ],
  'Endodontics': [
    'endodontics', 'root canal', 'pulp therapy', 'regenerative endodontics',
    'innovations in endodontics', 'root canal therapy'
  ],
  'Sleep Medicine': [
    'sleep medicine', 'sleep apnea', 'airway', 'oral appliances',
    'dental sleep medicine', 'dental sleep solutions', 'obstructive sleep apnea',
    'pediatric osa', 'airway management', 'emergency airway management',
    'airway and smile integration'
  ],
  'Dental Hygiene': [
    'dental hygiene', 'preventive care', 'patient education', 'infection control',
    'preventive', 'patient communication', 'team workflows', 'periodontal assessment',
    'waterline safety', 'cdipc standards'
  ],
  'Education': [
    'education', 'training', 'curriculum', 'continuing education', 'clinical research',
    'academic leadership', 'academic education', 'academic instruction', 'academic mentorship',
    'clinical education', 'dental education', 'periodontal education', 'oral surgery education',
    'anesthesia education', 'assessment methodologies', 'curriculum development',
    'clinical training', 'chair-based clinical research', 'academic periodontology',
    'academic writing', 'instructional design', 'educational program'
  ],
  'Technology': [
    'ai technology', 'automation', 'equipment', 'innovation', 'robotics',
    'artificial intelligence', 'ai in dentistry', 'ai in healthcare', 'ai-powered research',
    'dental innovation', 'advanced dental technology', 'innovations for dental labs',
    'practice automation', 'data-driven innovation', 'translational medicine',
    'entrepreneurship', 'teledentistry', 'ai in clinical practice'
  ],
  'Pediatric Dentistry': [
    'pediatric', 'children', 'adolescent', 'pediatric dentistry',
    'cleft and craniofacial surgery', 'pediatric maxillofacial care',
    'cleft lip/palate', 'cleft care', 'cleft palate reconstruction',
    'children\'s primary dental', 'pediatric osa'
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