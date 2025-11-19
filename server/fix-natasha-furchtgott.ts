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

async function fixNatashaFurchtgott() {
  try {
    const imagePath = '../attached_assets/image_1763574929168.png';
    
    // Find Dr. Natasha Furchtgott in database
    const speaker = await db.select().from(speakers).where(eq(speakers.name, 'Dr. Natasha Furchtgott')).limit(1);
    
    if (!speaker.length) {
      console.log('❌ Dr. Natasha Furchtgott not found');
      return;
    }
    
    console.log(`Found: ${speaker[0].name} (ID: ${speaker[0].id})`);
    
    // Read the image
    const imageBuffer = fs.readFileSync(imagePath);
    const timestamp = Date.now();
    const filename = `dr-natasha-furchtgott-${timestamp}.jpg`;
    
    // Upload to object storage
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
      .where(eq(speakers.id, speaker[0].id));
    
    console.log(`✅ Updated Dr. Natasha Furchtgott → ${filename}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixNatashaFurchtgott().catch(console.error);
