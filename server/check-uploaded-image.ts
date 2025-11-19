import { db } from './db';
import { speakers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

async function checkUploadedImage() {
  // Get Christopher's current image URL
  const speaker = await db.select()
    .from(speakers)
    .where(eq(speakers.name, 'Christopher Brendemuhl'))
    .limit(1);
    
  if (!speaker.length) {
    console.log('Speaker not found');
    return;
  }
  
  console.log('Christopher Brendemuhl:');
  console.log('Image URL:', speaker[0].imageUrl);
  
  // Download the actual image from object storage to verify
  if (speaker[0].imageUrl?.startsWith('/api/speaker-images/')) {
    const filename = speaker[0].imageUrl.replace('/api/speaker-images/', '');
    const bucketName = process.env.REPL_ID ? `repl-default-bucket-${process.env.REPL_ID}` : '';
    
    console.log('\nAttempting to download from bucket:', bucketName);
    console.log('Filename:', filename);
    
    try {
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(`public/${filename}`);
      
      const [metadata] = await file.getMetadata();
      console.log('\nFile metadata:');
      console.log('- Size:', metadata.size, 'bytes');
      console.log('- Content Type:', metadata.contentType);
      console.log('- Created:', metadata.timeCreated);
      
      // Download and save temporarily
      await file.download({ destination: '/tmp/christopher-current.jpg' });
      console.log('\n✓ Downloaded current image to /tmp/christopher-current.jpg');
      
      // Also check what we have in temp files
      console.log('\n=== Comparing with extracted files ===');
      const files = [7, 8, 9, 10];
      for (const idx of files) {
        const filepath = `/tmp/speaker_headshot_${idx}.jpg`;
        if (fs.existsSync(filepath)) {
          const stats = fs.statSync(filepath);
          console.log(`Image ${idx}: ${stats.size} bytes`);
        }
      }
      
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

checkUploadedImage().catch(console.error);
