import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSpeakerTopicsFromCSV() {
  try {
    console.log('Reading CSV file...');
    
    // Read the CSV file
    const csvContent = fs.readFileSync('attached_assets/Table for Speaker Categories _1756304430638.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header and process data
    const speakerTopics = [];
    const allTopics = new Set();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV - handle complex quoting
      let name = '';
      let topicsString = '';
      
      // Remove outer quotes if present
      let cleanLine = line;
      if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
        cleanLine = cleanLine.slice(1, -1);
      }
      
      // Find the first comma that separates name from topics
      const commaIndex = cleanLine.indexOf(',');
      if (commaIndex === -1) {
        console.log(`No comma found in line ${i}: ${line}`);
        continue;
      }
      
      name = cleanLine.substring(0, commaIndex).trim();
      topicsString = cleanLine.substring(commaIndex + 1).trim();
      
      // Remove quotes from topics if present
      if (topicsString.startsWith('"') && topicsString.endsWith('"')) {
        topicsString = topicsString.slice(1, -1);
      }
      
      if (!name || !topicsString) {
        console.log(`Incomplete data in line ${i}: name="${name}", topics="${topicsString}"`);
        continue;
      }
      
      // Split topics by semicolon and clean them
      const topics = topicsString
        .split(';')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0);
      
      if (topics.length > 0) {
        speakerTopics.push({ name, topics });
        topics.forEach(topic => allTopics.add(topic));
        console.log(`✓ Processed: ${name} - ${topics.length} topics`);
      } else {
        console.log(`No topics found for: ${name}`);
      }
    }
    
    console.log(`Processed ${speakerTopics.length} speakers with ${allTopics.size} unique topics`);
    
    // Create categories from all unique topics
    console.log('\nUpdating categories table...');
    
    // Clear existing categories
    await pool.query('DELETE FROM categories');
    
    // Insert new categories based on actual topics
    const topicArray = Array.from(allTopics).sort();
    for (const topic of topicArray) {
      // Count speakers for this topic
      const speakerCount = speakerTopics.filter(speaker => 
        speaker.topics.some(t => t === topic)
      ).length;
      
      await pool.query(
        'INSERT INTO categories (name, description, speaker_count) VALUES ($1, $2, $3)',
        [topic, `Specialists in ${topic}`, speakerCount]
      );
    }
    
    console.log(`Created ${topicArray.length} categories`);
    
    // Update speaker profiles with accurate topics
    console.log('\nUpdating speaker profiles...');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const { name, topics } of speakerTopics) {
      // Find speaker by name (try exact match first, then fuzzy match)
      let speaker = await pool.query(
        'SELECT id, name FROM speakers WHERE LOWER(name) = LOWER($1)',
        [name]
      );
      
      if (speaker.rows.length === 0) {
        // Try fuzzy match - remove Dr. prefix and other variations
        const normalizedName = name.replace(/^Dr\.\s+/, '').trim();
        speaker = await pool.query(
          'SELECT id, name FROM speakers WHERE LOWER(name) LIKE LOWER($1) OR LOWER(name) LIKE LOWER($2)',
          [`%${normalizedName}%`, `Dr. ${normalizedName}`]
        );
      }
      
      if (speaker.rows.length > 0) {
        const speakerId = speaker.rows[0].id;
        const speakerDbName = speaker.rows[0].name;
        
        // Update speaker with new topics
        await pool.query(
          'UPDATE speakers SET expertise = $1 WHERE id = $2',
          [topics, speakerId]
        );
        
        updatedCount++;
        console.log(`✓ Updated "${speakerDbName}" with ${topics.length} topics`);
      } else {
        notFoundCount++;
        console.log(`✗ Speaker not found: "${name}"`);
      }
    }
    
    console.log(`\nUpdate Summary:`);
    console.log(`- Updated: ${updatedCount} speakers`);
    console.log(`- Not found: ${notFoundCount} speakers`);
    console.log(`- Categories created: ${topicArray.length}`);
    
    // Show sample of new categories
    console.log('\nSample of new categories:');
    const sampleCategories = await pool.query(
      'SELECT name, speaker_count FROM categories ORDER BY speaker_count DESC LIMIT 10'
    );
    
    sampleCategories.rows.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.speaker_count} speakers`);
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('Error updating speaker topics:', error);
    process.exit(1);
  }
}

updateSpeakerTopicsFromCSV();