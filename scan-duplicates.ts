import { db } from "./server/db";
import { speakers } from "./shared/schema";

// Function to normalize names for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Function to calculate Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  const m = str1.length;
  const n = str2.length;

  for (let i = 0; i <= n; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (str1[j - 1] === str2[i - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[n][m];
}

// Function to check if two names are similar
function areNamesSimilar(name1: string, name2: string, threshold: number = 2): boolean {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // Check if one name contains the other (for cases like "Dr. John Smith" vs "John Smith")
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Use Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(norm1, norm2);
  return distance <= threshold;
}

async function scanForDuplicates() {
  console.log("🔍 Scanning for duplicate speaker profiles...");
  
  try {
    // Get all speakers from the database
    const allSpeakers = await db.select().from(speakers);
    console.log(`📊 Found ${allSpeakers.length} total speakers in database`);
    
    const duplicateGroups: any[][] = [];
    const processedIds = new Set<number>();
    
    // Compare each speaker with others
    for (let i = 0; i < allSpeakers.length; i++) {
      const speaker1 = allSpeakers[i];
      
      // Skip if already processed as part of a duplicate group
      if (processedIds.has(speaker1.id)) continue;
      
      const currentGroup = [speaker1];
      
      for (let j = i + 1; j < allSpeakers.length; j++) {
        const speaker2 = allSpeakers[j];
        
        // Skip if already processed
        if (processedIds.has(speaker2.id)) continue;
        
        // Check for duplicates using multiple criteria
        const nameMatch = areNamesSimilar(speaker1.name, speaker2.name);
        const emailMatch = speaker1.email && speaker2.email && 
                          speaker1.email.toLowerCase() === speaker2.email.toLowerCase();
        const websiteMatch = speaker1.website && speaker2.website && 
                            speaker1.website === speaker2.website;
        
        if (nameMatch || emailMatch || websiteMatch) {
          currentGroup.push(speaker2);
          processedIds.add(speaker2.id);
        }
      }
      
      // If we found duplicates, add to duplicate groups
      if (currentGroup.length > 1) {
        duplicateGroups.push(currentGroup);
        currentGroup.forEach(speaker => processedIds.add(speaker.id));
      }
    }
    
    // Report results
    console.log(`\n📈 DUPLICATE SCAN RESULTS:`);
    console.log(`Total speakers scanned: ${allSpeakers.length}`);
    console.log(`Duplicate groups found: ${duplicateGroups.length}`);
    console.log(`Total duplicate speakers: ${duplicateGroups.reduce((sum, group) => sum + group.length, 0)}`);
    
    if (duplicateGroups.length > 0) {
      console.log(`\n🚨 DETECTED DUPLICATES:\n`);
      
      duplicateGroups.forEach((group, index) => {
        console.log(`--- Duplicate Group ${index + 1} ---`);
        group.forEach((speaker, speakerIndex) => {
          console.log(`  ${speakerIndex + 1}. ID: ${speaker.id} | Name: "${speaker.name}" | Email: "${speaker.email || 'N/A'}" | Website: "${speaker.website || 'N/A'}" | Hidden: ${speaker.hideProfile || false}`);
        });
        console.log('');
      });
      
      // Create a summary CSV
      const csvLines = ['ID,Name,Email,Website,Hidden,Group'];
      duplicateGroups.forEach((group, groupIndex) => {
        group.forEach(speaker => {
          csvLines.push(`${speaker.id},"${speaker.name}","${speaker.email || ''}","${speaker.website || ''}",${speaker.hideProfile || false},${groupIndex + 1}`);
        });
      });
      
      console.log(`\n📄 CSV Export (copy this to a file):`);
      console.log(csvLines.join('\n'));
    } else {
      console.log(`\n✅ No duplicate speaker profiles found!`);
    }
    
    // Check for specific patterns that might indicate duplicates
    console.log(`\n🔍 ADDITIONAL ANALYSIS:`);
    
    // Group by normalized name
    const nameGroups = new Map<string, any[]>();
    allSpeakers.forEach(speaker => {
      const normalized = normalizeName(speaker.name);
      if (!nameGroups.has(normalized)) {
        nameGroups.set(normalized, []);
      }
      nameGroups.get(normalized)!.push(speaker);
    });
    
    const multipleNameGroups = Array.from(nameGroups.entries()).filter(([name, speakers]) => speakers.length > 1);
    console.log(`Speakers with identical normalized names: ${multipleNameGroups.length}`);
    
    if (multipleNameGroups.length > 0) {
      multipleNameGroups.forEach(([normalizedName, speakers]) => {
        console.log(`  "${normalizedName}" -> ${speakers.length} speakers: ${speakers.map(s => `${s.id}:${s.name}`).join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error scanning for duplicates:", error);
    throw error;
  }
}

// Run the scan
scanForDuplicates().then(() => {
  console.log("✅ Duplicate scan completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Duplicate scan failed:", error);
  process.exit(1);
});