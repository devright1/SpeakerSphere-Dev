import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function generateCleanSpeakerExcel() {
  try {
    console.log('Connecting to database...');
    
    // Get all speakers data
    const query = `
      SELECT 
        id,
        name,
        title,
        array_to_string(expertise, ', ') as speaking_topics,
        array_to_string(medical_specialties, ', ') as medical_specialties,
        location,
        overall_rating,
        review_count,
        email,
        phone,
        website,
        speaker_type,
        fee,
        experience,
        education,
        certifications,
        affiliations,
        bio,
        verified,
        featured
      FROM speakers 
      WHERE name IS NOT NULL 
        AND name != ''
      ORDER BY name, id;
    `;
    
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} total speakers`);
    
    // Function to normalize names (remove Dr. prefix for comparison)
    const normalizeName = (name) => {
      if (name.startsWith('Dr. ')) {
        return name.substring(4).trim();
      }
      return name.trim();
    };
    
    // Function to score records (higher score = better record to keep)
    const scoreRecord = (record) => {
      let score = 0;
      
      // Prefer records with real email addresses (not @example.com or contact@speaker.com)
      if (record.email && !record.email.includes('@example.com') && !record.email.includes('contact@speaker.com')) {
        score += 10;
      }
      
      // Prefer records with phone numbers
      if (record.phone && record.phone.trim() !== '') {
        score += 5;
      }
      
      // Prefer records with websites
      if (record.website && record.website.trim() !== '') {
        score += 3;
      }
      
      // Prefer records with more detailed speaking topics
      if (record.speaking_topics && record.speaking_topics.length > 50) {
        score += 5;
      }
      
      // Prefer records with bio
      if (record.bio && record.bio.length > 100) {
        score += 3;
      }
      
      // Prefer verified records
      if (record.verified) {
        score += 2;
      }
      
      // Prefer featured records
      if (record.featured) {
        score += 2;
      }
      
      // Prefer records with higher ratings
      if (record.overall_rating > 0) {
        score += Math.floor(record.overall_rating);
      }
      
      // Prefer records with more reviews
      if (record.review_count > 0) {
        score += Math.min(record.review_count / 10, 5); // Cap at 5 points
      }
      
      // Prefer records with experience data
      if (record.experience && record.experience > 0) {
        score += 2;
      }
      
      return score;
    };
    
    // Group records by normalized name
    const nameGroups = {};
    result.rows.forEach(record => {
      const normalizedName = normalizeName(record.name);
      if (!nameGroups[normalizedName]) {
        nameGroups[normalizedName] = [];
      }
      nameGroups[normalizedName].push(record);
    });
    
    // Select best record from each group
    const cleanedRecords = [];
    let duplicatesRemoved = 0;
    
    Object.keys(nameGroups).forEach(normalizedName => {
      const group = nameGroups[normalizedName];
      
      if (group.length > 1) {
        console.log(`\nDuplicate group for "${normalizedName}":`);
        group.forEach(record => {
          const score = scoreRecord(record);
          console.log(`  - ID ${record.id}: "${record.name}" (Score: ${score}) - ${record.email}`);
        });
        
        // Sort by score (highest first) and take the best one
        group.sort((a, b) => scoreRecord(b) - scoreRecord(a));
        cleanedRecords.push(group[0]);
        duplicatesRemoved += group.length - 1;
        
        console.log(`  -> Keeping: ID ${group[0].id}: "${group[0].name}" (Score: ${scoreRecord(group[0])})`);
      } else {
        cleanedRecords.push(group[0]);
      }
    });
    
    console.log(`\nDuplicates removed: ${duplicatesRemoved}`);
    console.log(`Clean records: ${cleanedRecords.length}`);
    
    // Create CSV content
    const headers = [
      'Name',
      'Title',
      'Speaking Topics',
      'Medical Specialties',
      'Location',
      'Overall Rating',
      'Review Count',
      'Email',
      'Phone',
      'Website',
      'Speaker Type',
      'Fee',
      'Experience (Years)',
      'Education',
      'Certifications',
      'Affiliations',
      'Bio',
      'Verified',
      'Featured'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    cleanedRecords.forEach(row => {
      const csvRow = [
        `"${(row.name || '').replace(/"/g, '""')}"`,
        `"${(row.title || '').replace(/"/g, '""')}"`,
        `"${(row.speaking_topics || '').replace(/"/g, '""')}"`,
        `"${(row.medical_specialties || '').replace(/"/g, '""')}"`,
        `"${(row.location || '').replace(/"/g, '""')}"`,
        row.overall_rating || '0',
        row.review_count || '0',
        `"${(row.email || '').replace(/"/g, '""')}"`,
        `"${(row.phone || '').replace(/"/g, '""')}"`,
        `"${(row.website || '').replace(/"/g, '""')}"`,
        `"${(row.speaker_type || '').replace(/"/g, '""')}"`,
        `"${(row.fee || '').replace(/"/g, '""')}"`,
        row.experience || '',
        `"${(row.education || '').replace(/"/g, '""')}"`,
        `"${(row.certifications || '').replace(/"/g, '""')}"`,
        `"${(row.affiliations || '').replace(/"/g, '""')}"`,
        `"${(row.bio || '').replace(/"/g, '""').substring(0, 500)}"`,
        row.verified ? 'Yes' : 'No',
        row.featured ? 'Yes' : 'No'
      ];
      csvContent += csvRow.join(',') + '\n';
    });
    
    // Write to file
    const filename = 'speakers_cleaned_no_duplicates.csv';
    fs.writeFileSync(filename, csvContent);
    
    console.log(`\nCleaned Excel file created: ${filename}`);
    console.log(`Original speakers: ${result.rows.length}`);
    console.log(`Cleaned speakers: ${cleanedRecords.length}`);
    console.log(`Duplicates removed: ${duplicatesRemoved}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('Error generating cleaned Excel file:', error);
    process.exit(1);
  }
}

generateCleanSpeakerExcel();