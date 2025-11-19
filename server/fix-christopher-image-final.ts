import { db } from './db';
import { speakers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { objectStorageClient } from './objectStorage';
import fs from 'fs';
import crypto from 'crypto';

async function fixChristopherImage() {
  const imagePath = '../attached_assets/image_1763562755249.png';
  
  console.log('Uploading Christopher Brendemuhl\'s headshot with cache-busting filename...\n');
  
  // Read the image file
  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`✓ Read image file: ${imageBuffer.length} bytes`);
  
  // Use the configured object storage client
  const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
  const bucketName = publicPath.split('/').filter(p => p)[0] || '';
  
  if (!bucketName) {
    throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
  }
  
  const bucket = objectStorageClient.bucket(bucketName);
  
  // Generate unique filename to bust cache
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(imageBuffer).digest('hex').substring(0, 8);
  const filename = `christopher-brendemuhl-${timestamp}-${hash}.jpg`;
  
  console.log(`Uploading as: ${filename}`);
  
  // Upload to object storage (must be in public/speaker-images/ subdirectory)
  const file = bucket.file(`public/speaker-images/${filename}`);
  
  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/jpeg',
      cacheControl: 'no-cache, max-age=0',
    },
  });
  
  console.log('✓ Uploaded to object storage');
  
  // Update database
  const newImageUrl = `/api/speaker-images/${filename}`;
  await db
    .update(speakers)
    .set({ imageUrl: newImageUrl })
    .where(eq(speakers.name, 'Christopher Brendemuhl'));
  
  console.log(`✓ Updated database: ${newImageUrl}`);
  
  // Verify the update
  const speaker = await db.select()
    .from(speakers)
    .where(eq(speakers.name, 'Christopher Brendemuhl'))
    .limit(1);
    
  console.log('\n=== Verification ===');
  console.log('Speaker:', speaker[0].name);
  console.log('Image URL:', speaker[0].imageUrl);
  console.log('Slug:', speaker[0].slug);
  console.log('ID:', speaker[0].id);
  
  console.log('\n✅ Complete! Image uploaded with cache-busting filename.');
}

fixChristopherImage().catch(console.error);
