import { db } from "./db";
import { speakers } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';

interface SocialMediaData {
  name: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
}

// Function to normalize social media URLs
function normalizeUrl(url: string, platform: string): string {
  if (!url || url.trim() === '') return '';
  
  const cleanUrl = url.trim();
  
  // Handle different URL formats
  switch (platform) {
    case 'instagram':
      if (cleanUrl.includes('instagram.com/')) {
        return cleanUrl;
      } else if (cleanUrl.startsWith('@')) {
        return `https://instagram.com/${cleanUrl.substring(1)}`;
      } else {
        return `https://instagram.com/${cleanUrl}`;
      }
      
    case 'twitter':
      if (cleanUrl.includes('twitter.com/') || cleanUrl.includes('x.com/')) {
        return cleanUrl;
      } else if (cleanUrl.startsWith('@')) {
        return `https://x.com/${cleanUrl.substring(1)}`;
      } else {
        return `https://x.com/${cleanUrl}`;
      }
      
    case 'facebook':
      if (cleanUrl.includes('facebook.com/')) {
        return cleanUrl;
      } else {
        return `https://facebook.com/${cleanUrl}`;
      }
      
    case 'linkedin':
      if (cleanUrl.includes('linkedin.com/')) {
        return cleanUrl;
      } else {
        return `https://linkedin.com/in/${cleanUrl}`;
      }
      
    default:
      return cleanUrl;
  }
}

// Function to extract handle from URL
function extractHandle(url: string, platform: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    switch (platform) {
      case 'instagram':
        return pathname.replace('/', '').replace(/\/$/, '');
      case 'twitter':
        return pathname.replace('/', '').replace(/\/$/, '');
      case 'facebook':
        return pathname.replace('/', '').replace(/\/$/, '');
      case 'linkedin':
        return pathname.replace('/in/', '').replace(/\/$/, '');
      default:
        return pathname.replace('/', '').replace(/\/$/, '');
    }
  } catch (error) {
    // If URL parsing fails, try to extract handle manually
    if (platform === 'instagram' && url.includes('instagram.com/')) {
      return url.split('instagram.com/')[1]?.split('/')[0] || '';
    }
    if ((platform === 'twitter' || platform === 'x') && (url.includes('twitter.com/') || url.includes('x.com/'))) {
      return url.split(/(?:twitter\.com\/|x\.com\/)/)[1]?.split('/')[0] || '';
    }
    if (platform === 'facebook' && url.includes('facebook.com/')) {
      return url.split('facebook.com/')[1]?.split('/')[0] || '';
    }
    if (platform === 'linkedin' && url.includes('linkedin.com/in/')) {
      return url.split('linkedin.com/in/')[1]?.split('/')[0] || '';
    }
    return '';
  }
}

// Function to parse CSV data
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Function to find speaker by name (fuzzy matching)
function findSpeakerByName(searchName: string, speakers: any[]): any | null {
  const normalizedSearchName = searchName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  // Try exact match first
  let match = speakers.find(s => 
    s.name.toLowerCase().replace(/[^a-z\s]/g, '').trim() === normalizedSearchName
  );
  
  if (match) return match;
  
  // Try partial match
  match = speakers.find(s => {
    const normalizedSpeakerName = s.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    return normalizedSpeakerName.includes(normalizedSearchName) || 
           normalizedSearchName.includes(normalizedSpeakerName);
  });
  
  if (match) return match;
  
  // Try name parts matching
  const searchParts = normalizedSearchName.split(' ');
  const firstNamePart = searchParts[0];
  const lastNamePart = searchParts[searchParts.length - 1];
  
  match = speakers.find(s => {
    const normalizedSpeakerName = s.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    return normalizedSpeakerName.includes(firstNamePart) && normalizedSpeakerName.includes(lastNamePart);
  });
  
  return match || null;
}

async function importSocialMediaData() {
  console.log("🚀 Starting social media data import...");
  
  try {
    // Get all speakers from database
    const allSpeakers = await db.select().from(speakers);
    console.log(`📊 Found ${allSpeakers.length} speakers in database`);
    
    // Read and parse first CSV file
    const csvPath1 = path.join(process.cwd(), 'attached_assets', 'speakers_social_media_export_1755092337211.csv');
    const csvPath2 = path.join(process.cwd(), 'attached_assets', 'speakers_social_media_links_1755092338675.csv');
    
    let socialMediaData: SocialMediaData[] = [];
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Process first CSV file
    if (fs.existsSync(csvPath1)) {
      console.log("📄 Processing first CSV file...");
      const csvContent1 = fs.readFileSync(csvPath1, 'utf-8');
      const lines1 = csvContent1.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines1.length; i++) {
        const parts = parseCsvLine(lines1[i]);
        if (parts.length >= 6) {
          const [name, title, instagram, twitter, facebook, linkedin] = parts;
          
          if (name && name !== 'Name') {
            socialMediaData.push({
              name: name.trim(),
              instagram: instagram?.trim() || '',
              twitter: twitter?.trim() || '',
              facebook: facebook?.trim() || '',
              linkedin: linkedin?.trim() || ''
            });
          }
        }
      }
    }
    
    // Process second CSV file
    if (fs.existsSync(csvPath2)) {
      console.log("📄 Processing second CSV file...");
      const csvContent2 = fs.readFileSync(csvPath2, 'utf-8');
      const lines2 = csvContent2.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines2.length; i++) {
        const parts = parseCsvLine(lines2[i]);
        if (parts.length >= 9) {
          const [name, profession, event, linkedin, twitter, instagram, facebook] = parts;
          
          if (name && name !== 'name') {
            // Check if we already have this speaker from first CSV
            const existing = socialMediaData.find(s => s.name.toLowerCase() === name.toLowerCase());
            
            if (existing) {
              // Merge data, preferring non-empty values
              existing.instagram = existing.instagram || instagram?.trim() || '';
              existing.twitter = existing.twitter || twitter?.trim() || '';
              existing.facebook = existing.facebook || facebook?.trim() || '';
              existing.linkedin = existing.linkedin || linkedin?.trim() || '';
            } else {
              socialMediaData.push({
                name: name.trim(),
                instagram: instagram?.trim() || '',
                twitter: twitter?.trim() || '',
                facebook: facebook?.trim() || '',
                linkedin: linkedin?.trim() || ''
              });
            }
          }
        }
      }
    }
    
    console.log(`📋 Parsed ${socialMediaData.length} records from CSV files`);
    
    // Update speakers with social media data
    for (const socialData of socialMediaData) {
      const speaker = findSpeakerByName(socialData.name, allSpeakers);
      
      if (speaker) {
        const socialMediaUrls = [];
        let instagramHandle = '';
        let facebookHandle = '';
        let xHandle = '';
        let linkedinHandle = '';
        
        // Process Instagram
        if (socialData.instagram) {
          const normalizedInstagram = normalizeUrl(socialData.instagram, 'instagram');
          if (normalizedInstagram) {
            socialMediaUrls.push(normalizedInstagram);
            instagramHandle = extractHandle(normalizedInstagram, 'instagram');
          }
        }
        
        // Process Twitter/X
        if (socialData.twitter) {
          const normalizedTwitter = normalizeUrl(socialData.twitter, 'twitter');
          if (normalizedTwitter) {
            socialMediaUrls.push(normalizedTwitter);
            xHandle = extractHandle(normalizedTwitter, 'twitter');
          }
        }
        
        // Process Facebook
        if (socialData.facebook) {
          const normalizedFacebook = normalizeUrl(socialData.facebook, 'facebook');
          if (normalizedFacebook) {
            socialMediaUrls.push(normalizedFacebook);
            facebookHandle = extractHandle(normalizedFacebook, 'facebook');
          }
        }
        
        // Process LinkedIn
        if (socialData.linkedin) {
          const normalizedLinkedin = normalizeUrl(socialData.linkedin, 'linkedin');
          if (normalizedLinkedin) {
            socialMediaUrls.push(normalizedLinkedin);
            linkedinHandle = extractHandle(normalizedLinkedin, 'linkedin');
          }
        }
        
        // Update speaker if there's social media data
        if (socialMediaUrls.length > 0) {
          await db
            .update(speakers)
            .set({
              socialMedia: socialMediaUrls,
              instagramHandle,
              facebookHandle,
              xHandle,
              linkedinHandle,
            })
            .where(eq(speakers.id, speaker.id));
          
          console.log(`✅ Updated ${speaker.name} with ${socialMediaUrls.length} social media links`);
          updatedCount++;
        }
      } else {
        console.log(`❌ Could not find speaker: ${socialData.name}`);
        notFoundCount++;
      }
    }
    
    console.log(`\n🎉 Social media import completed!`);
    console.log(`✅ Updated: ${updatedCount} speakers`);
    console.log(`❌ Not found: ${notFoundCount} speakers`);
    
  } catch (error) {
    console.error("❌ Error importing social media data:", error);
    throw error;
  }
}

// Run the import if this file is executed directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  importSocialMediaData()
    .then(() => {
      console.log("✅ Import completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Import failed:", error);
      process.exit(1);
    });
}

export { importSocialMediaData };