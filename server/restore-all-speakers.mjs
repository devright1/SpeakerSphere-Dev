import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';

// Configure neon
neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Read and parse the TypeScript file to extract speaker data
const extractSpeakersFromFile = () => {
  const content = fs.readFileSync('./official-speakers.ts', 'utf8');
  
  // Find all speaker objects in the array
  const speakerObjects = [];
  let currentSpeaker = {};
  let inSpeaker = false;
  let braceCount = 0;
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start of a speaker object
    if (line.includes('name:') && line.includes('"') && !inSpeaker) {
      inSpeaker = true;
      braceCount = 0;
      currentSpeaker = {};
      
      // Extract name
      const nameMatch = line.match(/name: "([^"]+)"/);
      if (nameMatch) currentSpeaker.name = nameMatch[1];
    }
    
    if (inSpeaker) {
      // Count braces to track object boundaries
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      // Extract fields
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
        const match = line.match(/reviewCount: (\d+)/);
        if (match) currentSpeaker.review_count = parseInt(match[1]);
      }
      
      if (line.includes('imageUrl:')) {
        const match = line.match(/imageUrl: "([^"]+)"/);
        if (match) currentSpeaker.image_url = match[1];
      }
      
      if (line.includes('verified:')) {
        currentSpeaker.verified = line.includes('true');
      }
      
      if (line.includes('featured:')) {
        currentSpeaker.featured = line.includes('true');
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
      
      // End of speaker object
      if (braceCount === 0 && line.includes('}')) {
        inSpeaker = false;
        
        // Set defaults for required fields
        currentSpeaker.expertise = currentSpeaker.expertise || ['General'];
        currentSpeaker.achievements = currentSpeaker.achievements || [];
        currentSpeaker.lectures = currentSpeaker.lectures || [];
        currentSpeaker.languages = currentSpeaker.languages || ['English'];
        currentSpeaker.hide_profile = false;
        currentSpeaker.hide_ratings = false;
        currentSpeaker.hide_social = false;
        currentSpeaker.hide_contact = false;
        
        if (currentSpeaker.name && currentSpeaker.slug) {
          speakerObjects.push({...currentSpeaker});
        }
        currentSpeaker = {};
      }
    }
  }
  
  return speakerObjects;
};

async function migrateSpeakers() {
  console.log('Extracting speakers from TypeScript file...');
  
  try {
    const speakers = extractSpeakersFromFile();
    console.log(\`Found \${speakers.length} speakers to migrate\`);
    
    let successCount = 0;
    
    for (const speaker of speakers) {
      try {
        const query = \`
          INSERT INTO speakers (
            name, slug, title, bio, expertise, location, overall_rating, review_count, 
            image_url, verified, featured, category, achievements, lectures, email, phone, 
            website, languages, speaker_type, fee, hide_profile, hide_ratings, hide_social, hide_contact
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          ON CONFLICT (slug) DO NOTHING
        \`;
        
        const values = [
          speaker.name,
          speaker.slug,
          speaker.title || 'Healthcare Professional',
          speaker.bio || 'Experienced healthcare speaker',
          speaker.expertise || ['General'],
          speaker.location || 'Various Locations',
          speaker.overall_rating || 4.5,
          speaker.review_count || 0,
          speaker.image_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
          speaker.verified !== false,
          speaker.featured === true,
          speaker.category || 'General',
          speaker.achievements || [],
          speaker.lectures || [],
          speaker.email || 'contact@devrightspeakers.com',
          speaker.phone || '214-884-4100',
          speaker.website || 'https://devrightspeakers.com',
          speaker.languages || ['English'],
          speaker.speaker_type || 'clinical',
          speaker.fee || '5000',
          false,
          false,
          false,
          false
        ];
        
        await pool.query(query, values);
        successCount++;
        console.log(\`✓ Added \${speaker.name}\`);
        
      } catch (error) {
        console.log(\`⚠ Error adding \${speaker.name}: \${error.message}\`);
      }
    }
    
    console.log(\`\n✓ Migration completed! Added \${successCount} speakers\`);
    
    // Show final count
    const result = await pool.query('SELECT COUNT(*) as count FROM speakers');
    console.log(\`Total speakers in database: \${result.rows[0].count}\`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

migrateSpeakers();