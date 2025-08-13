import fs from 'fs';

// Read the CSV file
const csvData = fs.readFileSync('social_media_data.csv', 'utf8');
const lines = csvData.split('\n');

const speakers = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Remove the outer quotes and split by comma, but be careful with quoted commas
  let content = line.replace(/^"|"$/g, '');
  
  // Simple split approach - since we know the structure
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < content.length; j++) {
    const char = content[j];
    
    if (char === '"' && (j === 0 || content[j-1] === ',')) {
      inQuotes = true;
      continue;
    } else if (char === '"' && j < content.length - 1 && content[j+1] === ',') {
      inQuotes = false;
      continue;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  if (current) parts.push(current.trim());
  
  if (parts.length >= 4) {
    const speaker = {
      name: parts[0],
      profession: parts[1] || '',
      specialty: parts[2] || '',
      instagram: parts[3] && parts[3] !== 'N/A' ? parts[3] : null,
      facebook: parts[4] && parts[4] !== 'N/A' ? parts[4] : null,
      twitter: parts[5] && parts[5] !== 'N/A' ? parts[5] : null,
      linkedin: parts[6] && parts[6] !== 'N/A' ? parts[6] : null
    };
    speakers.push(speaker);
  }
}

console.log(`Parsed ${speakers.length} speakers`);

// Show some examples with social media
const speakersWithSocial = speakers.filter(s => s.instagram || s.facebook || s.twitter || s.linkedin);
console.log(`\nSpeakers with social media: ${speakersWithSocial.length}`);

speakersWithSocial.slice(0, 3).forEach(speaker => {
  console.log(`\n${speaker.name}:`);
  if (speaker.instagram) console.log(`  Instagram: ${speaker.instagram}`);
  if (speaker.facebook) console.log(`  Facebook: ${speaker.facebook}`);
  if (speaker.twitter) console.log(`  Twitter: ${speaker.twitter}`);  
  if (speaker.linkedin) console.log(`  LinkedIn: ${speaker.linkedin}`);
});

// Stats
const stats = {
  total: speakers.length,
  withInstagram: speakers.filter(s => s.instagram).length,
  withFacebook: speakers.filter(s => s.facebook).length,
  withTwitter: speakers.filter(s => s.twitter).length,
  withLinkedIn: speakers.filter(s => s.linkedin).length
};

console.log('\nSocial Media Statistics:');
console.log(`Total speakers: ${stats.total}`);
console.log(`Instagram: ${stats.withInstagram}`);
console.log(`Facebook: ${stats.withFacebook}`);
console.log(`Twitter: ${stats.withTwitter}`);
console.log(`LinkedIn: ${stats.withLinkedIn}`);

// Save processed data
fs.writeFileSync('social_media_updates.json', JSON.stringify(speakers, null, 2));
console.log('\nData saved to social_media_updates.json');