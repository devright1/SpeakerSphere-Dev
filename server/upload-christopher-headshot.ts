import { db } from './db';
import { speakers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { objectStorageClient } from './objectStorage';
import fs from 'fs';

async function uploadChristopherHeadshot() {
  const imagePath = '../attached_assets/image_1763562755249.png';
  
  console.log('Uploading Christopher Brendemuhl\'s headshot...\n');
  
  // Read the image file
  const imageBuffer = fs.readFileSync(imagePath);
  
  // Use the configured object storage client
  const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
  const bucketName = publicPath.split('/').filter(p => p)[0] || '';
  
  if (!bucketName) {
    throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
  }
  
  const bucket = objectStorageClient.bucket(bucketName);
  
  // Upload to object storage
  const filename = 'christopher-brendemuhl.jpg';
  const file = bucket.file(`public/${filename}`);
  
  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  });
  
  console.log('✓ Uploaded to object storage:', filename);
  
  // Update database
  await db
    .update(speakers)
    .set({ imageUrl: `/api/speaker-images/${filename}` })
    .where(eq(speakers.name, 'Christopher Brendemuhl'));
  
  console.log('✓ Updated database for Christopher Brendemuhl');
  console.log('\n✅ Complete! Christopher now has the correct headshot.');
}

uploadChristopherHeadshot().catch(console.error);
