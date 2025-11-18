import { db } from './db';
import { speakers } from '../shared/schema';
import { inArray } from 'drizzle-orm';
import fs from 'fs';

async function revertIncorrectUploads() {
  try {
    const matchesData = fs.readFileSync('/tmp/speaker_image_matches.json', 'utf-8');
    const matches = JSON.parse(matchesData);
    
    const speakerNames = matches.map((m: any) => m.csv_name);
    
    console.log(`Reverting image URLs for ${speakerNames.length} speakers...`);
    
    await db
      .update(speakers)
      .set({ imageUrl: 'https://via.placeholder.com/400x400?text=No+Image' })
      .where(inArray(speakers.name, speakerNames));
    
    console.log(`✅ Reverted ${speakerNames.length} speaker image URLs`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

revertIncorrectUploads();
