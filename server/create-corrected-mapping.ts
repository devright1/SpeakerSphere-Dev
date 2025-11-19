import fs from 'fs';

interface SequentialMatch {
  speakerName: string;
  imageIndex: number;
  imagePath: string;
}

// Load the original extraction
const rawMatches: SequentialMatch[] = JSON.parse(
  fs.readFileSync('/tmp/sequential_matches.json', 'utf-8')
);

console.log('Creating corrected name-to-image mapping...\n');

// The issue: "Distinguished Professor" at index 8 is NOT a speaker name
// It's a title/subtitle that got extracted between Charles Goodacre and his image
// Image 8 should actually go to Christopher Brendemuhl

const correctedMatches: SequentialMatch[] = [];

for (let i = 0; i < rawMatches.length; i++) {
  const match = rawMatches[i];
  
  // Skip "Distinguished Professor" - it's not a speaker
  if (match.speakerName === "Distinguished Professor") {
    console.log(`⏭️  Skipping index ${match.imageIndex}: "${match.speakerName}" (subtitle/title, not a speaker)`);
    continue;
  }
  
  // For entries after "Distinguished Professor", shift image index back by 1
  if (match.imageIndex > 8) {
    const correctedImageIndex = match.imageIndex - 1;
    const correctedImagePath = `/tmp/speaker_headshot_${correctedImageIndex}.jpg`;
    
    correctedMatches.push({
      speakerName: match.speakerName,
      imageIndex: correctedImageIndex,
      imagePath: correctedImagePath
    });
    
    console.log(`✏️  Corrected: "${match.speakerName}" → Image ${match.imageIndex} changed to Image ${correctedImageIndex}`);
  } else {
    // Entries before index 8 are correct
    correctedMatches.push(match);
    console.log(`✓  Kept: "${match.speakerName}" → Image ${match.imageIndex}`);
  }
}

// Save corrected mapping
fs.writeFileSync('/tmp/corrected_matches.json', JSON.stringify(correctedMatches, null, 2));

console.log(`\n✅ Created corrected mapping with ${correctedMatches.length} speakers`);
console.log('Saved to: /tmp/corrected_matches.json');
