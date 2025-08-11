const fs = require('fs');

// Read the speakers data from the API response
const speakersData = JSON.parse(fs.readFileSync('speakers_data.json', 'utf8'));

// Create a map of speaker names to their slugs for fast lookup
const speakerMap = new Map();
speakersData.forEach(speaker => {
  // Create normalized name variations for matching
  const normalizedName = speaker.name.toLowerCase().replace(/[,\.\s]+/g, '');
  speakerMap.set(normalizedName, speaker.slug);
  
  // Also add with Dr. prefix removed
  const nameWithoutDr = speaker.name.replace(/^Dr\.\s*/i, '').toLowerCase().replace(/[,\.\s]+/g, '');
  speakerMap.set(nameWithoutDr, speaker.slug);
  
  // Add exact name match
  speakerMap.set(speaker.name.toLowerCase(), speaker.slug);
});

console.log(`Loaded ${speakerMap.size} speaker mappings`);

// Read the CSV file
const csvContent = fs.readFileSync('attached_assets/speakers_export_1754933022773.csv', 'utf8');
const lines = csvContent.split('\n');

// Process each line
const updatedLines = lines.map((line, index) => {
  if (index === 0) {
    // Header line - return as is
    return line;
  }
  
  if (line.trim() === '') {
    return line;
  }
  
  // Parse CSV line with proper handling of quoted fields
  const columns = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  columns.push(current); // Add the last column
  
  if (columns.length < 7) {
    return line;
  }
  
  const speakerId = columns[0];
  const speakerName = columns[1];
  
  // Try to find a matching speaker in our database
  let matchingSlug = null;
  
  // Try various normalized forms of the name
  const nameVariants = [
    speakerName.toLowerCase(),
    speakerName.toLowerCase().replace(/[,\.\s]+/g, ''),
    speakerName.replace(/^Dr\.\s*/i, '').toLowerCase().replace(/[,\.\s]+/g, ''),
    speakerName.replace(/^Dr\.\s*/i, '').toLowerCase()
  ];
  
  for (const variant of nameVariants) {
    if (speakerMap.has(variant)) {
      matchingSlug = speakerMap.get(variant);
      break;
    }
  }
  
  // Generate the profile URL if we found a match
  let profileUrl = '';
  if (matchingSlug) {
    profileUrl = `https://replit.app/speakers/${matchingSlug}`;
  }
  
  // Update the profile_url column (index 6)
  columns[6] = profileUrl;
  
  if (matchingSlug) {
    console.log(`✅ Matched: ${speakerName} -> /speakers/${matchingSlug}`);
  } else {
    console.log(`❌ No match found for: ${speakerName}`);
  }
  
  // Properly format CSV output by quoting fields that contain commas
  const formattedColumns = columns.map(column => {
    if (column.includes(',') || column.includes('"')) {
      return `"${column.replace(/"/g, '""')}"`;
    }
    return column;
  });
  
  return formattedColumns.join(',');
});

// Write the updated CSV
const updatedContent = updatedLines.join('\n');
fs.writeFileSync('attached_assets/speakers_export_updated.csv', updatedContent);

console.log('\n✅ CSV file updated with profile URLs');
console.log('Updated file saved as: attached_assets/speakers_export_updated.csv');