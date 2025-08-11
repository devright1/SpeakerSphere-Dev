import { db } from './server/db';
import { speakers } from './shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function generateProfileURLs() {
  try {
    console.log('📄 Generating speaker profile URLs...');
    
    // Get all active speakers
    const allSpeakers = await db.select().from(speakers).where(
      eq(speakers.hideProfile, false)
    );
    
    console.log(`Found ${allSpeakers.length} active speakers`);
    
    // Generate CSV content with profile URLs
    const csvHeader = 'id,name,slug,profile_url,category,title,email';
    const csvRows = allSpeakers.map(speaker => {
      const profileUrl = `https://thespeakersphere.com/speakers/${speaker.slug}`;
      return `${speaker.id},"${speaker.name}",${speaker.slug},${profileUrl},"${speaker.category}","${speaker.title}",${speaker.email}`;
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Write to file
    const filename = `all_speaker_profiles_${Date.now()}.csv`;
    fs.writeFileSync(filename, csvContent);
    
    console.log(`✅ Generated ${filename} with ${allSpeakers.length} speaker profile URLs`);
    console.log(`🔗 All URLs use production domain: https://thespeakersphere.com`);
    
    // Show sample URLs
    console.log('\n📋 Sample profile URLs:');
    allSpeakers.slice(0, 5).forEach(speaker => {
      console.log(`- ${speaker.name}: https://thespeakersphere.com/speakers/${speaker.slug}`);
    });
    
    return filename;
    
  } catch (error) {
    console.error('❌ Failed to generate URLs:', error);
    throw error;
  }
}

generateProfileURLs();