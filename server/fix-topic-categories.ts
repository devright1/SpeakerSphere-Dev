import { db } from './db';
import { speakingTopics } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Define keyword mappings for each of the 18 core categories
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Implant Dentistry": [
    "implant", "osseointegration", "abutment", "fixture", "implants", "zygomatic",
    "platform switching", "immediate loading", "bone-implant", "dental implant"
  ],
  "Periodontics": [
    "periodon", "gingival", "gum disease", "periodontitis", "peri-implantitis",
    "recession", "scaling", "root planning", "perio", "soft tissue", "pocket depth"
  ],
  "Prosthodontics": [
    "prosthetic", "crown", "bridge", "denture", "restoration", "fixed prosthodontics",
    "removable prosthodontics", "complete denture", "partial denture", "provisional",
    "occlusion", "veneer", "all-on"
  ],
  "Digital Dentistry": [
    "digital", "cad cam", "cad/cam", "3d print", "scanner", "intraoral scanning",
    "digital workflow", "digital design", "guided surgery", "computer-aided"
  ],
  "Oral Surgery": [
    "extraction", "surgical", "bone graft", "sinus lift", "ridge augmentation",
    "soft tissue surgery", "oral surgery", "flap", "incision", "suture",
    "maxillofacial", "jaw surgery", "trauma"
  ],
  "Esthetic Dentistry": [
    "esthetic", "aesthetic", "cosmetic", "smile design", "whitening", "bleaching",
    "anterior", "pink esthetic", "natural appearance", "beauty"
  ],
  "Orthodontics": [
    "orthodontic", "braces", "aligners", "malocclusion", "bite", "jaw alignment",
    "tooth movement", "clear aligners", "invisalign", "brackets"
  ],
  "Bone Grafting & Regeneration": [
    "bone graft", "regeneration", "augmentation", "GBR", "guided bone regeneration",
    "membrane", "scaffold", "bone substitute", "autograft", "allograft", "xenograft",
    "ridge preservation", "socket preservation"
  ],
  "Anesthesia & Sedation": [
    "anesthesia", "sedation", "pain management", "local anesthetic", "conscious sedation",
    "IV sedation", "nitrous oxide", "pain control", "analgesia", "nerve block"
  ],
  "Endodontics": [
    "endodontic", "root canal", "pulp", "apex", "apical", "endodontics",
    "retreatment", "obturation", "pulpotomy", "pulpectomy"
  ],
  "Full Arch Rehabilitation": [
    "full arch", "complete arch", "all-on-4", "all-on-6", "full mouth",
    "immediate function", "hybrid prosthesis", "complete rehabilitation"
  ],
  "Sleep Medicine": [
    "sleep apnea", "OSA", "obstructive sleep", "sleep disorder", "CPAP",
    "oral appliance", "mandibular advancement", "sleep breathing", "snoring"
  ],
  "Practice Management": [
    "practice management", "business", "marketing", "staff", "team", "efficiency",
    "workflow", "profitability", "patient experience", "scheduling", "billing",
    "insurance", "financial", "growth", "leadership", "human resources"
  ],
  "Education & Training": [
    "education", "training", "curriculum", "teaching", "mentorship", "residency",
    "fellowship", "continuing education", "CE", "course", "program", "learning",
    "didactic", "hands-on", "workshop"
  ],
  "Research": [
    "research", "study", "clinical trial", "evidence-based", "systematic review",
    "meta-analysis", "randomized controlled", "RCT", "outcomes", "data",
    "statistics", "methodology", "findings", "publication"
  ],
  "AI & Innovation": [
    "artificial intelligence", "AI", "machine learning", "neural network",
    "automation", "algorithm", "deep learning", "predictive", "computer vision"
  ],
  "Technology & Innovation": [
    "technology", "innovation", "novel", "cutting-edge", "advanced technology",
    "breakthrough", "new technique", "emerging", "laser", "CBCT", "cone beam"
  ],
  "Leadership": [
    "leadership", "management", "strategy", "vision", "organizational",
    "executive", "board", "governance", "planning", "decision-making", "policy"
  ]
};

async function fixTopicCategories() {
  console.log('🚀 Fixing topic categories using keyword matching...\n');
  
  try {
    // Load all topics
    const allTopics = await db.select().from(speakingTopics);
    console.log(`📝 Loaded ${allTopics.length} topics to categorize\n`);
    
    let updated = 0;
    let skipped = 0;
    const categoryStats = new Map<string, number>();
    
    for (const topic of allTopics) {
      const topicText = `${topic.name} ${topic.slug} ${topic.description || ''}`.toLowerCase();
      
      // Find matching category based on keywords
      let bestCategory = "Practice Management"; // Default
      let maxMatches = 0;
      
      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let matchCount = 0;
        for (const keyword of keywords) {
          if (topicText.includes(keyword.toLowerCase())) {
            matchCount++;
          }
        }
        
        if (matchCount > maxMatches) {
          maxMatches = matchCount;
          bestCategory = category;
        }
      }
      
      // Update if different
      if (topic.category !== bestCategory) {
        await db.update(speakingTopics)
          .set({ category: bestCategory })
          .where(eq(speakingTopics.id, topic.id));
        updated++;
      } else {
        skipped++;
      }
      
      // Track stats
      const count = categoryStats.get(bestCategory) || 0;
      categoryStats.set(bestCategory, count + 1);
    }
    
    console.log(`\n✅ Topic categorization complete!`);
    console.log(`   Updated: ${updated} topics`);
    console.log(`   Unchanged: ${skipped} topics`);
    
    console.log(`\n📊 Category distribution across 942 topics:`);
    const sortedStats = Array.from(categoryStats.entries())
      .sort((a, b) => b[1] - a[1]);
    
    for (const [category, count] of sortedStats) {
      console.log(`   ${category}: ${count} topics`);
    }
    
  } catch (error) {
    console.error('❌ Failed to fix topic categories:', error);
    throw error;
  }
}

fixTopicCategories().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
