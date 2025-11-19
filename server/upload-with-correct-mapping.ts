import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { speakers } from '../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
const bucketName = publicPath.split('/').filter(p => p)[0] || '';

if (!bucketName) {
  throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
}

const bucket = objectStorageClient.bucket(bucketName);

interface SpeakerImageMapping {
  speakerName: string;
  speakerId: number;
  imageIndex: number;
  imagePath: string;
}

async function uploadWithCorrectMapping() {
  try {
    // Load the correct mapping
    const mappingData = fs.readFileSync('/tmp/correct_speaker_mappings.json', 'utf-8');
    const mappings: SpeakerImageMapping[] = JSON.parse(mappingData);
    
    console.log(`Uploading ${mappings.length} speaker headshots with correct mapping...\n`);
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    
    for (const mapping of mappings) {
      // Skip Christopher - he has a manually uploaded image
      if (mapping.speakerName === 'Christopher Brendemuhl') {
        console.log(`⏭️  Skipped: ${mapping.speakerName} (manually uploaded)`);
        skippedCount++;
        continue;
      }
      
      try {
        // Read the image file
        if (!fs.existsSync(mapping.imagePath)) {
          console.log(`❌ File not found: ${mapping.imagePath} for ${mapping.speakerName}`);
          failCount++;
          continue;
        }
        
        const imageBuffer = fs.readFileSync(mapping.imagePath);
        
        // Create filename from speaker name
        const slug = mapping.speakerName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const filename = `${slug}.jpg`;
        
        // Upload to object storage (in public/speaker-images/ subdirectory)
        const file = bucket.file(`public/speaker-images/${filename}`);
        
        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/jpeg',
          },
        });
        
        // Update database
        await db
          .update(speakers)
          .set({ imageUrl: `/api/speaker-images/${filename}` })
          .where(eq(speakers.id, mapping.speakerId));
        
        console.log(`✅ ${successCount + 1}. Uploaded: ${filename} → ${mapping.speakerName}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error uploading ${mapping.speakerName}:`, error);
        failCount++;
      }
    }
    
    console.log(`\n✨ Upload complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

uploadWithCorrectMapping().catch(console.error);
