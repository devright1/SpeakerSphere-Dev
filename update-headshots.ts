import { db } from './server/db';
import { speakers } from './shared/schema';
import { eq, isNull, or } from 'drizzle-orm';
import fs from 'fs';

interface HeadshotData {
  id: string;
  name: string;
  headshot_url: string;
  profession: string;
  specialty: string;
  event_title: string;
}

async function updateSpeakerHeadshots() {
  try {
    console.log('📸 Starting headshot update process...');
    
    // Read and parse CSV file
    const csvContent = fs.readFileSync('attached_assets/speakers_headshots_1754938527779.csv', 'utf8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    const headshotData: HeadshotData[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Simple CSV parsing that handles commas in quoted fields
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim().replace(/^"|"$/g, '')); // Don't forget the last part
      
      if (parts.length >= 6) {
        const [id, name, headshot_url, profession, specialty, event_title] = parts;
        
        if (headshot_url && !headshot_url.startsWith('/attached_assets/') && name && name.length > 5) {
          headshotData.push({
            id: id.trim(),
            name: name.trim(),
            headshot_url: headshot_url.trim(),
            profession: profession.trim(),
            specialty: specialty.trim(),
            event_title: event_title.trim()
          });
        }
      }
    }
    
    console.log(`📋 Found ${headshotData.length} headshots to process`);
    
    // Get speakers that need better headshots
    const allSpeakers = await db.select().from(speakers);
    const speakersNeedingHeadshots = allSpeakers.filter(speaker => 
      !speaker.imageUrl || 
      speaker.imageUrl === '' ||
      speaker.imageUrl === '/api/placeholder/300/300' ||
      speaker.imageUrl === '/api/placeholder/150/150' ||
      speaker.imageUrl.startsWith('/attached_assets/') ||
      speaker.imageUrl.includes('dev-right-conference')
    );
    
    console.log(`🔍 Found ${speakersNeedingHeadshots.length} speakers without proper headshots`);
    
    let updated = 0;
    let matched = 0;
    let unmatched: string[] = [];
    
    // Match and update speakers
    for (const speaker of speakersNeedingHeadshots) {
      // Try to find matching headshot by name
      const headshotMatch = headshotData.find(headshot => {
        // Normalize names for comparison
        const speakerName = speaker.name.toLowerCase().trim();
        const headshotName = headshot.name.toLowerCase().trim();
        
        // Direct match
        if (speakerName === headshotName) return true;
        
        // Match without "Dr." prefix
        const speakerNameNoTitle = speakerName.replace(/^dr\.?\s*/i, '');
        const headshotNameNoTitle = headshotName.replace(/^dr\.?\s*/i, '');
        if (speakerNameNoTitle === headshotNameNoTitle) return true;
        
        // Match by last name + first name (handle cases like "Dr. John Smith" vs "John Smith")
        const speakerParts = speakerNameNoTitle.split(' ').filter(p => p.length > 0);
        const headshotParts = headshotNameNoTitle.split(' ').filter(p => p.length > 0);
        
        if (speakerParts.length >= 2 && headshotParts.length >= 2) {
          const speakerLastFirst = `${speakerParts[speakerParts.length - 1]} ${speakerParts[0]}`;
          const headshotLastFirst = `${headshotParts[headshotParts.length - 1]} ${headshotParts[0]}`;
          if (speakerLastFirst === headshotLastFirst) return true;
        }
        
        // Try partial matches for complex names
        if (speakerParts.length >= 2 && headshotParts.length >= 2) {
          // Check if all speaker name parts appear in headshot name
          const allPartsMatch = speakerParts.every(part => 
            headshotParts.some(hPart => hPart.includes(part) || part.includes(hPart))
          );
          if (allPartsMatch) return true;
        }
        
        return false;
      });
      
      if (headshotMatch) {
        matched++;
        console.log(`✅ Matched: ${speaker.name} -> ${headshotMatch.headshot_url}`);
        
        // Update speaker with headshot
        await db.update(speakers)
          .set({ imageUrl: headshotMatch.headshot_url })
          .where(eq(speakers.id, speaker.id));
        
        updated++;
      } else {
        unmatched.push(speaker.name);
      }
    }
    
    // Show some unmatched names for debugging
    if (unmatched.length > 0) {
      console.log(`\n❌ First 10 unmatched speakers:`);
      unmatched.slice(0, 10).forEach(name => console.log(`- ${name}`));
      
      console.log(`\n📋 Sample headshot names for reference:`);
      headshotData.slice(0, 10).forEach(h => console.log(`- ${h.name}`));
    }
    
    console.log(`\n📊 Headshot Update Summary:`);
    console.log(`🔍 Speakers needing headshots: ${speakersNeedingHeadshots.length}`);
    console.log(`🎯 Names matched: ${matched}`);
    console.log(`✅ Headshots updated: ${updated}`);
    console.log(`📸 Headshot sources available: ${headshotData.length}`);
    
    // Show some examples of updated speakers
    if (updated > 0) {
      console.log(`\n📋 Sample updated speakers:`);
      const updatedSpeakers = await db.select()
        .from(speakers)
        .where(
          or(
            ...headshotData.slice(0, 5).map(h => eq(speakers.name, h.name))
          )
        )
        .limit(5);
      
      updatedSpeakers.forEach(speaker => {
        console.log(`- ${speaker.name}: ${speaker.imageUrl}`);
      });
    }
    
    return { matched, updated, total: speakersNeedingHeadshots.length };
    
  } catch (error) {
    console.error('❌ Failed to update headshots:', error);
    throw error;
  }
}

updateSpeakerHeadshots();