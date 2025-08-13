import fs from 'fs';

// Read the CSV file and parse it properly
const csvData = fs.readFileSync('social_media_data.csv', 'utf8');
const lines = csvData.split('\n');

// Skip the header line and process each data line
const speakers = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV line considering quoted fields
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  let quoteCount = 0;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"') {
      quoteCount++;
      if (quoteCount % 2 === 1) {
        inQuotes = true;
      } else {
        inQuotes = false;
      }
      // Add quote to field if it's part of the content
      if (quoteCount > 1 && j < line.length - 1 && line[j + 1] === '"') {
        currentField += char;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add the last field
  if (currentField) {
    fields.push(currentField.trim());
  }
  
  // Parse the fields - format: Name,Profession,Specialty,Instagram,Facebook,X (Twitter),LinkedIn
  if (fields.length >= 4) {
    const speaker = {
      name: fields[0].replace(/^"|"$/g, ''),
      profession: fields[1] ? fields[1].replace(/^"|"$/g, '') : '',
      specialty: fields[2] ? fields[2].replace(/^"|"$/g, '') : '',
      instagram: fields[3] && fields[3] !== 'N/A' ? fields[3].replace(/^"|"$/g, '') : null,
      facebook: fields[4] && fields[4] !== 'N/A' ? fields[4].replace(/^"|"$/g, '') : null,
      twitter: fields[5] && fields[5] !== 'N/A' ? fields[5].replace(/^"|"$/g, '') : null,
      linkedin: fields[6] && fields[6] !== 'N/A' ? fields[6].replace(/^"|"$/g, '') : null
    };
    speakers.push(speaker);
  }
}

console.log(`Parsed ${speakers.length} speakers with social media data`);

// Show some examples
console.log('\nSample speakers with social media:');
speakers.slice(0, 5).forEach(speaker => {
  console.log(`${speaker.name}:`);
  if (speaker.instagram) console.log(`  Instagram: ${speaker.instagram}`);
  if (speaker.facebook) console.log(`  Facebook: ${speaker.facebook}`);
  if (speaker.twitter) console.log(`  Twitter: ${speaker.twitter}`);
  if (speaker.linkedin) console.log(`  LinkedIn: ${speaker.linkedin}`);
  console.log('');
});

// Count speakers with each social media platform
const counts = {
  instagram: speakers.filter(s => s.instagram).length,
  facebook: speakers.filter(s => s.facebook).length,
  twitter: speakers.filter(s => s.twitter).length,
  linkedin: speakers.filter(s => s.linkedin).length
};

console.log('Social media counts:');
console.log(`Instagram: ${counts.instagram}`);
console.log(`Facebook: ${counts.facebook}`);
console.log(`Twitter: ${counts.twitter}`);
console.log(`LinkedIn: ${counts.linkedin}`);

// Save the processed data
fs.writeFileSync('processed_social_media.json', JSON.stringify(speakers, null, 2));
console.log('\nProcessed data saved to processed_social_media.json');