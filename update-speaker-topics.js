import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSpeakerTopics() {
  try {
    console.log('Reading CSV file...');
    
    // Read the CSV file and handle Windows line endings
    const csvContent = fs.readFileSync('attached_assets/Table for Speaker Categories _1756303172921.csv', 'utf-8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    console.log(`Found ${dataLines.length} speaker records to process`);
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    for (const line of dataLines) {
      try {
        // Remove quotes and split by comma (first comma separates name from topics)
        const cleanLine = line.replace(/^"|"$/g, '');
        const commaIndex = cleanLine.indexOf(',');
        
        if (commaIndex === -1) {
          console.log(`Skipping malformed line: ${line.substring(0, 50)}...`);
          continue;
        }
        
        const name = cleanLine.substring(0, commaIndex).trim();
        const topicsString = cleanLine.substring(commaIndex + 1).trim();
        const topics = topicsString.split(';').map(topic => topic.trim()).filter(topic => topic.length > 0);
        
        console.log(`Updating ${name} with ${topics.length} topics`);
        
        // Update speaker expertise in database
        const result = await pool.query(
          'UPDATE speakers SET expertise = $1 WHERE name = $2',
          [topics, name]
        );
        
        if (result.rowCount > 0) {
          updated++;
          console.log(`✅ Updated ${name}`);
        } else {
          notFound++;
          console.log(`❌ Speaker not found: ${name}`);
        }
        
      } catch (error) {
        errors++;
        console.error(`Error processing speaker: ${error.message}`);
      }
    }
    
    console.log('\n=== Update Summary ===');
    console.log(`✅ Updated: ${updated} speakers`);
    console.log(`❌ Not found: ${notFound} speakers`);
    console.log(`⚠️ Errors: ${errors} speakers`);
    
    await pool.end();
    
  } catch (error) {
    console.error('Error updating speaker topics:', error);
    process.exit(1);
  }
}

updateSpeakerTopics();