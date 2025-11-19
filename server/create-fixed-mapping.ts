import fs from 'fs';

// The Word document has an unusual structure around Charles Goodacre:
// - Charles Goodacre (name)
// - "Distinguished Professor" (subtitle text)
// - IMAGE 7 (positioned after the subtitle)
// - Christopher Brendemuhl (name)
// - IMAGE 8

// This means IMAGE 7 might belong to Charles (just positioned oddly),
// but the user says Christopher's image is wrong.
// Let's try: Christopher → IMAGE 9 instead of IMAGE 8

const speakerImageMap = [
  { name: "Adrian McCovy", imageIndex: 0 },
  { name: "Allen Robinson", imageIndex: 1 },
  { name: "Allison Horn", imageIndex: 2 },
  { name: "Arian B. Deutsch, CDT", imageIndex: 3 },
  { name: "Brandon Dickerman", imageIndex: 4 },
  { name: "Brody Hildebrand", imageIndex: 5 },
  { name: "Catrise Austin", imageIndex: 6 },
  { name: "Charles Goodacre, DDS, MSD, FACP", imageIndex: 7 },
  { name: "Christopher Brendemuhl", imageIndex: 9 },  // Changed from 8 to 9
  { name: "Cyrus Lee", imageIndex: 10 },  // Shifted +1
  { name: "Darin Dichter, DMD", imageIndex: 11 },  // Shifted +1
  // Continue the pattern...
];

// Load original to get full list
const original = JSON.parse(fs.readFileSync('/tmp/sequential_matches.json', 'utf-8'));

const fixedMatches = original.map((match: any) => {
  // Skip "Distinguished Professor"
  if (match.speakerName === "Distinguished Professor") {
    return null;
  }
  
  // For Christopher, use image 9 instead of 8  
  if (match.speakerName.includes("Christopher Brendemuhl")) {
    return {
      speakerName: match.speakerName,
      imageIndex: 9,
      imagePath: '/tmp/speaker_headshot_9.jpg'
    };
  }
  
  // For speakers after Christopher (index 9+), shift by +1
  if (match.imageIndex > 8) {
    return {
      speakerName: match.speakerName,
      imageIndex: match.imageIndex + 1,
      imagePath: `/tmp/speaker_headshot_${match.imageIndex + 1}.jpg`
    };
  }
  
  // Everyone else stays the same
  return match;
}).filter(Boolean);

fs.writeFileSync('/tmp/fixed_matches.json', JSON.stringify(fixedMatches, null, 2));
console.log(`✓ Created fixed mapping with ${fixedMatches.length} speakers`);
console.log('\nChanges:');
console.log('- Christopher Brendemuhl: Image 8 → Image 9');
console.log('- All speakers after Christopher: shifted +1');
