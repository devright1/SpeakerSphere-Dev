import { objectStorageClient } from './objectStorage';
import { db } from './db';
import { speakers } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';

const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
const bucketName = publicPath.split('/').filter(p => p)[0] || '';

if (!bucketName) {
  throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
}

const bucket = objectStorageClient.bucket(bucketName);

interface SequentialMatch {
  speakerName: string;
  imageIndex: number;
  imagePath: string;
}

function cleanSpeakerName(name: string): string {
  name = name.trim();
  
  const stopPhrases = [
    'Dental Professional',
    'Vice President, Marketing',
    'Certified Dental Technician',
    'Lab Equipment',
    'Department Chair',
    'Executive Dental Director',
    'Private Practice',
    'ACP President',
    'Board-Certified',
    'Distinguished Professor',
    'Dental Specialist',
    'Key Opinion Leader',
    'International Speaker',
    'Sleep Medicine',
    'Owner & CEO',
    'Prosthodontist',
    'Full Arch Specialist',
    'Complication Prevention',
    'Emergency Management',
    'Honored Fellow',
    'Past President',
    'Clinical Professor',
    'Fellow Academy',
    'Associate Fellow',
    'Office-Based Anesthesia',
    'Professional Development',
    'Sleep Medicine Specialist',
    'Full-Arch Therapy',
    'Periodontal & Implant Specialist',
    'Full-Arch Implantology',
    'robotics technology expert'
  ];
  
  for (const phrase of stopPhrases) {
    const idx = name.indexOf(phrase);
    if (idx > 0) {
      name = name.substring(0, idx).trim();
      break;
    }
  }
  
  name = name.replace(/\s*-\s*.+$/, '').trim();
  name = name.replace(/\s+(CEO|DDS|DMD|MSD|FACP|PhD|MSc|CDT|AAID|DABOI\/ID|DICOI|FAGD|FAAID|AFAAID|MS|MD|BDS|MChD|DSc|MBA|DDS|ABOI\/ID|MHBA|DABOI|DICOI|MS|&amp;).*$/i, '').trim();
  
  return name;
}

async function matchAndUploadSequential() {
  try {
    const matchesData = fs.readFileSync('/tmp/corrected_matches.json', 'utf-8');
    const rawMatches: SequentialMatch[] = JSON.parse(matchesData);
    
    const allSpeakers = await db.select().from(speakers);
    
    console.log('Cleaning and matching speaker names...\n');
    
    const validMatches: Array<{
      extractedName: string;
      cleanedName: string;
      dbSpeaker: any;
      imageIndex: number;
      imagePath: string;
    }> = [];
    
    const skipped: string[] = [];
    
    for (const match of rawMatches) {
      const cleaned = cleanSpeakerName(match.speakerName);
      
      if (cleaned.length < 5 || !cleaned.includes(' ')) {
        skipped.push(match.speakerName);
        console.log(`⏭️  Skipped: "${match.speakerName}" (too short or no space)`);
        continue;
      }
      
      const dbMatch = allSpeakers.find(s => 
        s.name.toLowerCase() === cleaned.toLowerCase() ||
        s.name.toLowerCase().includes(cleaned.toLowerCase()) ||
        cleaned.toLowerCase().includes(s.name.toLowerCase())
      );
      
      if (dbMatch) {
        validMatches.push({
          extractedName: match.speakerName,
          cleanedName: cleaned,
          dbSpeaker: dbMatch,
          imageIndex: match.imageIndex,
          imagePath: match.imagePath
        });
        console.log(`✅ Match #${match.imageIndex}: "${cleaned}" → DB: "${dbMatch.name}"`);
      } else {
        console.log(`❌ No match: "${cleaned}"`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Valid matches: ${validMatches.length}`);
    console.log(`   Skipped: ${skipped.length}`);
    console.log(`   No DB match: ${rawMatches.length - validMatches.length - skipped.length}`);
    
    console.log(`\n\n🚀 Starting upload of ${validMatches.length} images...\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const match of validMatches) {
      try {
        const imageData = fs.readFileSync(match.imagePath);
        const slug = match.dbSpeaker.slug;
        const filename = `${slug}.jpg`;
        const gcsPath = `public/speaker-images/${filename}`;
        
        const file = bucket.file(gcsPath);
        await file.save(imageData, {
          metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=31536000',
          },
        });
        
        const imageUrl = `/api/speaker-images/${filename}`;
        await db
          .update(speakers)
          .set({ imageUrl })
          .where(eq(speakers.id, match.dbSpeaker.id));
        
        console.log(`✅ Uploaded #${match.imageIndex}: ${filename} → ${match.dbSpeaker.name}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error uploading image for ${match.dbSpeaker.name}:`, error);
        failCount++;
      }
    }
    
    console.log(`\n✨ Upload complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

matchAndUploadSequential();
