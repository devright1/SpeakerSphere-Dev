// Simple restoration script to get all speakers back
import { storage } from './storage.js';
import fs from 'fs';

// Extract basic speaker data from the TypeScript file
const extractBasicSpeakers = () => {
  const content = fs.readFileSync('./official-speakers.ts', 'utf8');
  const speakerData = [];
  
  // Split into speaker blocks by finding name fields
  const lines = content.split('\n');
  let currentSpeaker = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('name:') && line.includes('"')) {
      // Start new speaker
      const nameMatch = line.match(/name: "([^"]+)"/);
      if (nameMatch) {
        currentSpeaker = {
          name: nameMatch[1],
          slug: '',
          title: 'Healthcare Professional',
          bio: 'Experienced healthcare speaker',
          expertise: ['General Dentistry'],
          location: 'Various Locations',
          overall_rating: 4.5,
          review_count: 50,
          image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
          verified: true,
          featured: false,
          category: 'General Dentistry',
          achievements: ['Experienced Speaker'],
          lectures: ['Professional Development'],
          email: 'contact@devrightspeakers.com',
          phone: '214-884-4100',
          website: 'https://devrightspeakers.com',
          languages: ['English'],
          speaker_type: 'clinical',
          fee: '5000',
          hide_profile: false,
          hide_ratings: false,
          hide_social: false,
          hide_contact: false
        };
      }
    }
    
    if (currentSpeaker) {
      // Extract key fields
      if (line.includes('slug:')) {
        const match = line.match(/slug: "([^"]+)"/);
        if (match) currentSpeaker.slug = match[1];
      }
      
      if (line.includes('title:')) {
        const match = line.match(/title: "([^"]+)"/);
        if (match) currentSpeaker.title = match[1];
      }
      
      if (line.includes('bio:')) {
        const match = line.match(/bio: "([^"]+)"/);
        if (match) currentSpeaker.bio = match[1];
      }
      
      if (line.includes('location:')) {
        const match = line.match(/location: "([^"]+)"/);
        if (match) currentSpeaker.location = match[1];
      }
      
      if (line.includes('overallRating:')) {
        const match = line.match(/overallRating: "([^"]+)"/);
        if (match) currentSpeaker.overall_rating = parseFloat(match[1]);
      }
      
      if (line.includes('reviewCount:')) {
        const match = line.match(/reviewCount: (\\d+)/);
        if (match) currentSpeaker.review_count = parseInt(match[1]);
      }
      
      if (line.includes('imageUrl:')) {
        const match = line.match(/imageUrl: "([^"]+)"/);
        if (match) currentSpeaker.image_url = match[1];
      }
      
      if (line.includes('featured: true')) {
        currentSpeaker.featured = true;
      }
      
      if (line.includes('category:')) {
        const match = line.match(/category: "([^"]+)"/);
        if (match) currentSpeaker.category = match[1];
      }
      
      if (line.includes('email:')) {
        const match = line.match(/email: "([^"]+)"/);
        if (match) currentSpeaker.email = match[1];
      }
      
      if (line.includes('phone:')) {
        const match = line.match(/phone: "([^"]+)"/);
        if (match) currentSpeaker.phone = match[1];
      }
      
      if (line.includes('website:')) {
        const match = line.match(/website: "([^"]+)"/);
        if (match) currentSpeaker.website = match[1];
      }
      
      if (line.includes('speakerType:')) {
        const match = line.match(/speakerType: "([^"]+)"/);
        if (match) currentSpeaker.speaker_type = match[1];
      }
      
      if (line.includes('fee:')) {
        const match = line.match(/fee: "([^"]+)"/);
        if (match) currentSpeaker.fee = match[1];
      }
      
      // End of speaker (closing brace at beginning of line)
      if (line === '},' || line === '}') {
        if (currentSpeaker.slug && currentSpeaker.name) {
          speakerData.push({...currentSpeaker});
        }
        currentSpeaker = null;
      }
    }
  }
  
  return speakerData;
};

async function restoreAllSpeakers() {
  console.log('Extracting speaker data from official-speakers.ts...');
  
  try {
    const speakers = extractBasicSpeakers();
    console.log(\`Found \${speakers.length} speakers to restore\`);
    
    let added = 0;
    let skipped = 0;
    
    for (const speaker of speakers) {
      try {
        // Check if speaker already exists
        const existing = await storage.getSpeakerBySlug(speaker.slug);
        if (existing) {
          console.log(\`↻ \${speaker.name} already exists\`);
          skipped++;
          continue;
        }
        
        // Create the speaker
        await storage.createSpeaker(speaker);
        console.log(\`✓ Added \${speaker.name}\`);
        added++;
        
      } catch (error) {
        console.log(\`⚠ Error adding \${speaker.name}: \${error.message}\`);
      }
    }
    
    console.log(\`\\n✓ Restoration completed!\`);
    console.log(\`  Added: \${added} speakers\`);
    console.log(\`  Skipped (already exist): \${skipped} speakers\`);
    console.log(\`  Total processed: \${speakers.length} speakers\`);
    
    // Verify final count
    const allSpeakers = await storage.getSpeakers();
    console.log(\`\\nFinal database count: \${allSpeakers.length} speakers\`);
    
  } catch (error) {
    console.error('Error during restoration:', error);
  }
}

restoreAllSpeakers();