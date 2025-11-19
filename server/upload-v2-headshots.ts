import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { speakers } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import fs from 'fs';

const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
const bucketName = publicPath.split('/').filter(p => p)[0] || '';

if (!bucketName) {
  throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
}

const bucket = objectStorageClient.bucket(bucketName);

interface SpeakerImagePair {
  speakerName: string;
  speakerId: number;
  imageIndex: number;
  imagePath: string;
}

async function uploadV2Headshots() {
  try {
    // Load the v2 mapping
    const mappingData = fs.readFileSync('/tmp/v2_speaker_mappings.json', 'utf-8');
    const pairs: SpeakerImagePair[] = JSON.parse(mappingData);
    
    console.log(`Uploading ${pairs.length} v2 speaker headshots...\n`);
    
    // First, revert all these speakers to placeholder
    const speakerIds = pairs.map(p => p.speakerId);
    await db
      .update(speakers)
      .set({ imageUrl: '/placeholder-speaker.jpg' })
      .where(inArray(speakers.id, speakerIds));
    
    console.log(`✓ Reset ${speakerIds.length} speakers to placeholder\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const pair of pairs) {
      try {
        // Read the image file
        if (!fs.existsSync(pair.imagePath)) {
          console.log(`❌ File not found: ${pair.imagePath} for ${pair.speakerName}`);
          failCount++;
          continue;
        }
        
        const imageBuffer = fs.readFileSync(pair.imagePath);
        
        // Create unique filename with timestamp to avoid caching issues
        const slug = pair.speakerName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const timestamp = Date.now();
        const filename = `${slug}-v2-${timestamp}.jpg`;
        
        // Upload to object storage (in public/speaker-images/ subdirectory)
        const file = bucket.file(`public/speaker-images/${filename}`);
        
        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'no-cache, max-age=0',
          },
        });
        
        // Update database
        await db
          .update(speakers)
          .set({ imageUrl: `/api/speaker-images/${filename}` })
          .where(eq(speakers.id, pair.speakerId));
        
        console.log(`✅ ${successCount + 1}. ${pair.speakerName} → Image ${pair.imageIndex}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error uploading ${pair.speakerName}:`, error);
        failCount++;
      }
    }
    
    console.log(`\n✨ V2 Upload complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

uploadV2Headshots().catch(console.error);
