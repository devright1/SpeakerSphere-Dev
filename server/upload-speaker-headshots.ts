import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { speakers } from '../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
// Extract bucket name from path like "/bucket-name/public"
const bucketName = publicPath.split('/').filter(p => p)[0] || '';

if (!bucketName) {
  console.error('PUBLIC_OBJECT_SEARCH_PATHS:', process.env.PUBLIC_OBJECT_SEARCH_PATHS);
  throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
}

console.log(`Using bucket: ${bucketName}`);

const bucket = objectStorageClient.bucket(bucketName);

interface SpeakerImageMatch {
  csv_name: string;
  word_doc_name: string;
  image_index: number;
  image_path: string;
}

async function uploadSpeakerHeadshots() {
  try {
    // Load matches
    const matchesData = fs.readFileSync('/tmp/speaker_image_matches.json', 'utf-8');
    const matches: SpeakerImageMatch[] = JSON.parse(matchesData);
    
    console.log(`Processing ${matches.length} speaker headshots...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const match of matches) {
      try {
        // Find speaker in database by exact name match
        const [speaker] = await db
          .select()
          .from(speakers)
          .where(eq(speakers.name, match.csv_name))
          .limit(1);
        
        if (!speaker) {
          console.log(`⚠️  Speaker not found in database: ${match.csv_name}`);
          failCount++;
          continue;
        }
        
        // Read image data
        const imageData = fs.readFileSync(match.image_path);
        
        // Create a slug-based filename
        const slug = speaker.slug;
        const filename = `${slug}.jpg`;
        const gcsPath = `public/speaker-images/${filename}`;
        
        // Upload to object storage
        const file = bucket.file(gcsPath);
        await file.save(imageData, {
          metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=31536000',
          },
        });
        
        console.log(`✅ Uploaded: ${filename}`);
        
        // Update speaker record
        const imageUrl = `/api/speaker-images/${filename}`;
        await db
          .update(speakers)
          .set({ imageUrl })
          .where(eq(speakers.id, speaker.id));
        
        console.log(`   Updated database for: ${match.csv_name}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${match.csv_name}:`, error);
        failCount++;
      }
    }
    
    console.log(`\n✨ Upload complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total: ${matches.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

uploadSpeakerHeadshots();
