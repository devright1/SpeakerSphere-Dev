import { db } from './server/db';
import { speakers } from './shared/schema';

async function checkImageUrls() {
  try {
    const sampleSpeakers = await db.select().from(speakers).limit(20);
    
    console.log('Sample speaker image URLs:');
    sampleSpeakers.forEach(speaker => {
      console.log(`- ${speaker.name}: ${speaker.imageUrl}`);
    });
    
    // Check how many have placeholder images
    const allSpeakers = await db.select().from(speakers);
    const placeholderCount = allSpeakers.filter(s => s.imageUrl === '/api/placeholder/300/300').length;
    const emptyCount = allSpeakers.filter(s => !s.imageUrl || s.imageUrl === '').length;
    const realUrls = allSpeakers.filter(s => s.imageUrl && s.imageUrl !== '/api/placeholder/300/300').length;
    
    console.log(`\n📊 Image URL Statistics:`);
    console.log(`📷 Total speakers: ${allSpeakers.length}`);
    console.log(`🖼️ Real URLs: ${realUrls}`);
    console.log(`📦 Placeholder URLs: ${placeholderCount}`);
    console.log(`❌ Empty/null URLs: ${emptyCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkImageUrls();