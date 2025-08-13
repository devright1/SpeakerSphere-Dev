import { db } from "./db";
import { speakers } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface SocialMediaSpeaker {
  name: string;
  profession: string;
  specialty: string;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
}

// Helper function to normalize names for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^dr\.?\s+/i, '') // Remove Dr. prefix
    .replace(/[.,]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Helper function to extract handle from URL
function extractHandle(url: string | null, platform: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    switch (platform) {
      case 'instagram':
        // Instagram: https://www.instagram.com/username/ -> username
        const instagramMatch = pathname.match(/^\/([^\/]+)\/?$/);
        return instagramMatch ? instagramMatch[1] : null;
        
      case 'linkedin':
        // LinkedIn: https://www.linkedin.com/in/username -> username
        const linkedinMatch = pathname.match(/^\/in\/([^\/]+)\/?$/);
        return linkedinMatch ? linkedinMatch[1] : null;
        
      case 'twitter':
        // Twitter: https://twitter.com/username -> username
        const twitterMatch = pathname.match(/^\/([^\/]+)\/?$/);
        return twitterMatch ? twitterMatch[1] : null;
        
      case 'facebook':
        // Facebook: various formats, try to extract identifier
        const facebookMatch = pathname.match(/^\/([^\/]+)\/?$/);
        return facebookMatch ? facebookMatch[1] : null;
        
      default:
        return url;
    }
  } catch (error) {
    console.log(`Could not parse URL: ${url}`);
    return null;
  }
}

export async function updateSpeakersSocialMedia() {
  try {
    // Read the social media data
    const socialMediaPath = path.join(process.cwd(), 'social_media_updates.json');
    const socialMediaData: SocialMediaSpeaker[] = JSON.parse(
      fs.readFileSync(socialMediaPath, 'utf8')
    );

    console.log(`📱 Loading ${socialMediaData.length} speakers with social media data...`);

    // Get all speakers from database
    const dbSpeakers = await db.select().from(speakers);
    console.log(`🗃️ Found ${dbSpeakers.length} speakers in database`);
    
    let matchedCount = 0;
    let updatedCount = 0;
    const updateLog: Array<{ name: string; id: number; updates: any }> = [];
    
    for (const socialSpeaker of socialMediaData) {
      const normalizedSocialName = normalizeName(socialSpeaker.name);
      
      // Try to find matching speaker in database
      let matchedSpeaker = null;
      
      // First, try exact name match
      matchedSpeaker = dbSpeakers.find(dbSpeaker => 
        normalizeName(dbSpeaker.name) === normalizedSocialName
      );
      
      // If no exact match, try partial matches
      if (!matchedSpeaker) {
        // Try matching by last name (only for names longer than 3 chars to avoid false matches)
        const socialLastName = normalizedSocialName.split(' ').pop();
        if (socialLastName && socialLastName.length > 3) {
          matchedSpeaker = dbSpeakers.find(dbSpeaker => {
            const dbLastName = normalizeName(dbSpeaker.name).split(' ').pop();
            return dbLastName === socialLastName;
          });
        }
      }
      
      if (matchedSpeaker) {
        matchedCount++;
        
        // Extract handles from URLs
        const instagramHandle = extractHandle(socialSpeaker.instagram, 'instagram');
        const facebookHandle = extractHandle(socialSpeaker.facebook, 'facebook');
        const xHandle = extractHandle(socialSpeaker.twitter, 'twitter');
        const linkedinHandle = extractHandle(socialSpeaker.linkedin, 'linkedin');
        
        // Check if any social media data needs updating
        const needsUpdate = 
          (instagramHandle && instagramHandle !== matchedSpeaker.instagramHandle) ||
          (facebookHandle && facebookHandle !== matchedSpeaker.facebookHandle) ||
          (xHandle && xHandle !== matchedSpeaker.xHandle) ||
          (linkedinHandle && linkedinHandle !== matchedSpeaker.linkedinHandle);
        
        if (needsUpdate) {
          // Update the speaker with new social media handles
          const updateData: any = {};
          if (instagramHandle) updateData.instagramHandle = instagramHandle;
          if (facebookHandle) updateData.facebookHandle = facebookHandle;
          if (xHandle) updateData.xHandle = xHandle;
          if (linkedinHandle) updateData.linkedinHandle = linkedinHandle;
          
          await db
            .update(speakers)
            .set(updateData)
            .where(eq(speakers.id, matchedSpeaker.id));
          
          updatedCount++;
          updateLog.push({
            name: matchedSpeaker.name,
            id: matchedSpeaker.id,
            updates: updateData
          });
          
          console.log(`✅ Updated ${matchedSpeaker.name} (ID: ${matchedSpeaker.id})`);
          if (instagramHandle) console.log(`   📸 Instagram: ${instagramHandle}`);
          if (facebookHandle) console.log(`   📘 Facebook: ${facebookHandle}`);
          if (xHandle) console.log(`   🐦 X/Twitter: ${xHandle}`);
          if (linkedinHandle) console.log(`   💼 LinkedIn: ${linkedinHandle}`);
        }
      } else {
        console.log(`❌ No match found for: ${socialSpeaker.name}`);
      }
    }
    
    console.log(`\n📊 === SOCIAL MEDIA UPDATE SUMMARY ===`);
    console.log(`Total social media records processed: ${socialMediaData.length}`);
    console.log(`Matched speakers: ${matchedCount}`);
    console.log(`Updated speakers: ${updatedCount}`);
    console.log(`Unmatched records: ${socialMediaData.length - matchedCount}`);
    
    // Save update log
    const logPath = path.join(process.cwd(), 'social_media_update_log.json');
    fs.writeFileSync(logPath, JSON.stringify(updateLog, null, 2));
    console.log(`📝 Update log saved to social_media_update_log.json`);
    
    return {
      total: socialMediaData.length,
      matched: matchedCount,
      updated: updatedCount,
      unmatched: socialMediaData.length - matchedCount,
      updateLog
    };
    
  } catch (error) {
    console.error('❌ Error updating social media:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSpeakersSocialMedia()
    .then(result => {
      console.log('🎉 Social media update completed successfully!', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Social media update failed:', error);
      process.exit(1);
    });
}