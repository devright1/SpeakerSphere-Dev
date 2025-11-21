import { db } from './db';
import { speakers } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function fixSpeakerNamesWithTitles() {
  try {
    // Get all speakers with credentials in their names
    const allSpeakers = await db.select().from(speakers);
    
    const speakersToFix = allSpeakers.filter(speaker => {
      // Check if name contains comma followed by credentials
      return speaker.name.includes(',');
    });
    
    console.log(`\nFound ${speakersToFix.length} speakers with titles in their names\n`);
    
    for (const speaker of speakersToFix) {
      // Extract just the name (everything before the first comma)
      const cleanName = speaker.name.split(',')[0].trim();
      
      console.log(`Fixing: "${speaker.name}" → "${cleanName}"`);
      
      // Update the database
      await db
        .update(speakers)
        .set({ name: cleanName })
        .where(eq(speakers.id, speaker.id));
    }
    
    console.log(`\n✅ Successfully cleaned up ${speakersToFix.length} speaker names\n`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixSpeakerNamesWithTitles().catch(console.error);
