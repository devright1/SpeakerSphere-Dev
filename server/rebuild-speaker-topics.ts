import { db } from './db';
import { speakers, speakerTopics, speakingTopics } from '@shared/schema';
import { eq, or, ilike, sql } from 'drizzle-orm';

async function rebuildSpeakerTopics() {
  console.log('🚀 Rebuilding speaker-topic relationships...\n');
  
  try {
    // Step 1: Clear existing orphaned relationships
    console.log('📝 Step 1: Clearing old speaker-topic relationships...');
    await db.delete(speakerTopics);
    console.log('✓ Cleared old relationships');
    
    // Step 2: Get all speakers and topics
    console.log('\n📝 Step 2: Loading speakers and topics...');
    const allSpeakers = await db.select().from(speakers);
    const allTopics = await db.select().from(speakingTopics);
    
    console.log(`✓ Loaded ${allSpeakers.length} speakers and ${allTopics.length} topics`);
    
    // Step 3: Match speakers to topics using textual analysis
    console.log('\n📝 Step 3: Matching speakers to topics using bio, lectures, and expertise...');
    let totalLinksCreated = 0;
    let speakersWithTopics = 0;
    
    // Process speakers in batches
    const batchSize = 50;
    for (let i = 0; i < allSpeakers.length; i += batchSize) {
      const batch = allSpeakers.slice(i, i + batchSize);
      const insertValues = [];
      
      for (const speaker of batch) {
        const linkedTopicIds = new Set<number>();
        
        // Build comprehensive search text from speaker data
        const searchText = [
          speaker.bio || '',
          speaker.title || '',
          ...(speaker.lectures || []),
          ...(speaker.medicalSpecialties || []),
          ...(speaker.expertise || []),
          ...(speaker.achievements || [])
        ].join(' ').toLowerCase();
        
        // Score each topic based on keyword matches
        const topicScores = new Map<number, number>();
        
        for (const topic of allTopics) {
          const topicKeywords = [
            topic.name,
            topic.slug,
            topic.description || ''
          ].join(' ').toLowerCase().split(/\s+/);
          
          let score = 0;
          for (const keyword of topicKeywords) {
            if (keyword.length > 3 && searchText.includes(keyword)) {
              score++;
            }
          }
          
          if (score > 0) {
            topicScores.set(topic.id, score);
          }
        }
        
        // Select top 5-8 matching topics
        const sortedTopics = Array.from(topicScores.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        
        for (const [topicId] of sortedTopics) {
          linkedTopicIds.add(topicId);
        }
        
        // If no matches, assign default topics based on specialty
        if (linkedTopicIds.size === 0) {
          // Use first medical specialty if available
          const specialty = (speaker.medicalSpecialties && speaker.medicalSpecialties[0]) || '';
          const specialtyLower = specialty.toLowerCase();
          
          const defaultTopics = allTopics.filter(t => {
            const tName = t.name.toLowerCase();
            return tName.includes(specialtyLower) || 
                   specialtyLower.includes(tName) ||
                   (t.category === "Practice Management");
          }).slice(0, 4);
          
          for (const topic of defaultTopics) {
            linkedTopicIds.add(topic.id);
          }
        }
        
        // Create insert values for this speaker's topics
        for (const topicId of linkedTopicIds) {
          insertValues.push({
            speakerId: speaker.id,
            topicId: topicId
          });
          totalLinksCreated++;
        }
        
        if (linkedTopicIds.size > 0) {
          speakersWithTopics++;
        }
      }
      
      // Bulk insert the batch
      if (insertValues.length > 0) {
        await db.insert(speakerTopics).values(insertValues);
      }
      
      console.log(`  Processed ${Math.min(i + batchSize, allSpeakers.length)}/${allSpeakers.length} speakers...`);
    }
    
    console.log(`✓ Created ${totalLinksCreated} speaker-topic relationships`);
    console.log(`✓ ${speakersWithTopics} speakers now have topic associations`);
    
    // Step 4: For speakers without topics, assign default topics based on category
    console.log('\n📝 Step 4: Assigning default topics to remaining speakers...');
    const speakersWithoutTopics = await db
      .select({ id: speakers.id, categories: speakers.categories })
      .from(speakers)
      .where(sql`NOT EXISTS (
        SELECT 1 FROM speaker_topics st WHERE st.speaker_id = ${speakers.id}
      )`);
    
    console.log(`Found ${speakersWithoutTopics.length} speakers without topics`);
    
    let defaultLinksCreated = 0;
    for (const speaker of speakersWithoutTopics) {
      // Find topics matching speaker's categories
      if (speaker.categories && speaker.categories.length > 0) {
        for (const category of speaker.categories) {
          // Find 2-3 topics in this category
          const categoryTopics = allTopics
            .filter(t => t.category === category)
            .slice(0, 3);
          
          for (const topic of categoryTopics) {
            await db.insert(speakerTopics).values({
              speakerId: speaker.id,
              topicId: topic.id
            });
            defaultLinksCreated++;
          }
        }
      }
    }
    
    console.log(`✓ Created ${defaultLinksCreated} default topic assignments`);
    
    // Step 5: Verify
    console.log('\n📊 Final verification...');
    const finalStats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT speaker_id) as speakers_with_topics,
        COUNT(*) as total_relationships,
        ROUND(AVG(topic_count), 2) as avg_topics_per_speaker
      FROM (
        SELECT speaker_id, COUNT(topic_id) as topic_count
        FROM speaker_topics
        GROUP BY speaker_id
      ) sub
    `);
    
    const stats = finalStats.rows[0] as any;
    console.log(`\n✅ Rebuild complete!`);
    console.log(`   Speakers with topics: ${stats.speakers_with_topics}`);
    console.log(`   Total relationships: ${stats.total_relationships}`);
    console.log(`   Average topics per speaker: ${stats.avg_topics_per_speaker}`);
    
  } catch (error) {
    console.error('❌ Rebuild failed:', error);
    throw error;
  }
}

rebuildSpeakerTopics().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
