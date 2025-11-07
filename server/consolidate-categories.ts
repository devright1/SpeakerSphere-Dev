import { db } from './db';
import { categories, speakers, speakerTopics, speakingTopics } from '@shared/schema';
import { eq, inArray, sql } from 'drizzle-orm';

// Define the 18 core categories based on speaking topics data
const CORE_CATEGORIES = [
  { name: "Education & Training", description: "Teaching, mentorship, and professional development" },
  { name: "Practice Management", description: "Dental practice operations and business growth" },
  { name: "Implant Dentistry", description: "Dental implants and osseointegration" },
  { name: "Periodontics", description: "Gum disease treatment and periodontal therapy" },
  { name: "Prosthodontics", description: "Restorative dentistry and prosthetic rehabilitation" },
  { name: "Oral Surgery", description: "Surgical procedures in the oral cavity" },
  { name: "AI & Innovation", description: "Artificial intelligence and innovative technologies" },
  { name: "Research", description: "Clinical research and evidence-based practice" },
  { name: "Digital Dentistry", description: "CAD/CAM, 3D printing, and digital workflow solutions" },
  { name: "Technology & Innovation", description: "Cutting-edge dental technology and innovation" },
  { name: "Leadership", description: "Professional leadership and organizational management" },
  { name: "Esthetic Dentistry", description: "Cosmetic procedures and smile design" },
  { name: "Bone Grafting & Regeneration", description: "Bone grafting techniques and tissue regeneration" },
  { name: "Anesthesia & Sedation", description: "Pain management and sedation techniques" },
  { name: "Orthodontics", description: "Teeth straightening and bite correction" },
  { name: "Full Arch Rehabilitation", description: "Complete arch restoration and rehabilitation" },
  { name: "Sleep Medicine", description: "Sleep apnea and sleep disorder treatment" },
  { name: "Endodontics", description: "Root canal treatment and endodontic therapy" }
];

// Mapping for consolidating old categories to new ones
const CATEGORY_MAPPING: Record<string, string> = {
  // Keep core 18 as-is
  "Education & Training": "Education & Training",
  "Practice Management": "Practice Management",
  "Implant Dentistry": "Implant Dentistry",
  "Periodontics": "Periodontics",
  "Prosthodontics": "Prosthodontics",
  "Oral Surgery": "Oral Surgery",
  "AI & Innovation": "AI & Innovation",
  "Research": "Research",
  "Digital Dentistry": "Digital Dentistry",
  "Technology & Innovation": "Technology & Innovation",
  "Leadership": "Leadership",
  "Esthetic Dentistry": "Esthetic Dentistry",
  "Bone Grafting & Regeneration": "Bone Grafting & Regeneration",
  "Anesthesia & Sedation": "Anesthesia & Sedation",
  "Orthodontics": "Orthodontics",
  "Full Arch Rehabilitation": "Full Arch Rehabilitation",
  "Sleep Medicine": "Sleep Medicine",
  "Endodontics": "Endodontics",
  
  // Consolidate duplicates/similar categories
  "Maxillofacial Surgery": "Oral Surgery",
  "Cosmetic Dentistry": "Esthetic Dentistry",
  "Periodontology": "Periodontics",
  "Dental Hygiene": "Education & Training",
  "Pediatric Dentistry": "Education & Training",
  "General Dentistry": "Practice Management",
  "Anesthesiology": "Anesthesia & Sedation",
  "Event Management": "Practice Management",
  "Test Category": "Practice Management" // Default for test data
};

async function consolidateCategories() {
  console.log('🚀 Starting category consolidation to 18 core categories...\n');
  
  try {
    // Step 1: Create/ensure all 18 core categories exist
    console.log('📝 Step 1: Ensuring 18 core categories exist...');
    const categoryIdMap = new Map<string, number>();
    
    for (const category of CORE_CATEGORIES) {
      const existing = await db.select()
        .from(categories)
        .where(eq(categories.name, category.name))
        .limit(1);
      
      if (existing.length > 0) {
        categoryIdMap.set(category.name, existing[0].id);
        console.log(`✓ Category exists: ${category.name}`);
      } else {
        const [newCat] = await db.insert(categories)
          .values({
            name: category.name,
            description: category.description,
            speakerCount: 0
          })
          .returning();
        categoryIdMap.set(category.name, newCat.id);
        console.log(`+ Created category: ${category.name}`);
      }
    }
    
    // Step 2: Update speaking_topics to use core categories
    console.log('\n📝 Step 2: Updating speaking topics categories...');
    const topics = await db.select().from(speakingTopics);
    let topicsUpdated = 0;
    
    for (const topic of topics) {
      if (topic.category) {
        const newCategory = CATEGORY_MAPPING[topic.category] || "Practice Management";
        if (newCategory !== topic.category) {
          await db.update(speakingTopics)
            .set({ category: newCategory })
            .where(eq(speakingTopics.id, topic.id));
          topicsUpdated++;
        }
      }
    }
    console.log(`✓ Updated ${topicsUpdated} topics to core categories`);
    
    // Step 3: Update each speaker's categories array based on their topics
    console.log('\n📝 Step 3: Updating speaker categories based on their topics...');
    const allSpeakers = await db.select().from(speakers);
    let speakersUpdated = 0;
    
    for (const speaker of allSpeakers) {
      // Get speaker's topics
      const speakerTopicLinks = await db
        .select({ topicId: speakerTopics.topicId })
        .from(speakerTopics)
        .where(eq(speakerTopics.speakerId, speaker.id));
      
      if (speakerTopicLinks.length > 0) {
        const topicIds = speakerTopicLinks.map(t => t.topicId);
        
        // Get categories from their topics
        const topicCategories = await db
          .select({ category: speakingTopics.category })
          .from(speakingTopics)
          .where(inArray(speakingTopics.id, topicIds));
        
        // Get unique categories from topics
        const uniqueCategories = new Set<string>();
        for (const tc of topicCategories) {
          if (tc.category) {
            uniqueCategories.add(tc.category);
          }
        }
        
        // Update speaker categories array
        const newCategories = Array.from(uniqueCategories);
        if (newCategories.length > 0) {
          await db.update(speakers)
            .set({ categories: newCategories })
            .where(eq(speakers.id, speaker.id));
          speakersUpdated++;
        }
      } else {
        // No topics - map old categories to new categories
        const oldCategories = speaker.categories || [];
        const newCategories = oldCategories
          .map(cat => CATEGORY_MAPPING[cat] || cat)
          .filter((cat, idx, arr) => arr.indexOf(cat) === idx && CORE_CATEGORIES.some(c => c.name === cat));
        
        if (newCategories.length === 0) {
          newCategories.push("Practice Management"); // Default
        }
        
        if (JSON.stringify(oldCategories.sort()) !== JSON.stringify(newCategories.sort())) {
          await db.update(speakers)
            .set({ categories: newCategories })
            .where(eq(speakers.id, speaker.id));
          speakersUpdated++;
        }
      }
    }
    console.log(`✓ Updated ${speakersUpdated} speakers to topic-based categories`);
    
    // Step 4: Delete non-core categories
    console.log('\n📝 Step 4: Removing non-core categories...');
    const coreNames = CORE_CATEGORIES.map(c => c.name);
    
    // Get all current categories
    const allCategories = await db.select().from(categories);
    const categoriesToDelete = allCategories.filter(cat => !coreNames.includes(cat.name));
    
    let deletedCount = 0;
    for (const cat of categoriesToDelete) {
      await db.delete(categories).where(eq(categories.id, cat.id));
      deletedCount++;
    }
    console.log(`✓ Deleted ${deletedCount} non-core categories`);
    
    // Step 5: Verify final state
    console.log('\n📊 Final verification...');
    
    // Count speakers per category (using array containment)
    const finalCategories = await db.execute(sql`
      SELECT c.name, COUNT(s.id) as speaker_count
      FROM categories c
      LEFT JOIN speakers s ON c.name = ANY(s.categories)
      GROUP BY c.name
      ORDER BY COUNT(s.id) DESC
    `);
    
    console.log('\n📋 Final category distribution:');
    finalCategories.rows.forEach((cat: any) => {
      console.log(`  ${cat.name}: ${cat.speaker_count} speakers`);
    });
    
    const totalCategories = finalCategories.rows.length;
    const totalSpeakers = finalCategories.rows.reduce((sum: number, cat: any) => sum + Number(cat.speaker_count), 0);
    
    console.log(`\n✅ Consolidation complete!`);
    console.log(`   Categories: ${totalCategories} (target: 18)`);
    console.log(`   Total speakers: ${totalSpeakers}`);
    
    if (totalCategories !== 18) {
      console.warn(`⚠️  Warning: Expected 18 categories but got ${totalCategories}`);
    }
    
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    throw error;
  }
}

consolidateCategories().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
