import { db } from './db';
import { speakers } from '@shared/schema';
import { inArray } from 'drizzle-orm';
import fs from 'fs';

async function revertAllBatchUploads() {
  // Get the list of speakers from the mapping (excluding Christopher - keep his manual upload)
  const mapping = JSON.parse(fs.readFileSync('/tmp/correct_speaker_mappings.json', 'utf-8'));
  
  const speakerIds = mapping
    .filter((m: any) => m.speakerName !== 'Christopher Brendemuhl') // Keep Christopher's manual upload
    .map((m: any) => m.speakerId);
  
  console.log(`Reverting image URLs for ${speakerIds.length} speakers (excluding Christopher)...\n`);
  
  // Revert to placeholder
  const result = await db
    .update(speakers)
    .set({ imageUrl: '/placeholder-speaker.jpg' })
    .where(inArray(speakers.id, speakerIds));
  
  console.log(`✅ Reverted ${speakerIds.length} speaker image URLs`);
}

revertAllBatchUploads().catch(console.error);
