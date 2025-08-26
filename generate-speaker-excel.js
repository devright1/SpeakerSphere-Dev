import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function generateSpeakerExcel() {
  try {
    console.log('Connecting to database...');
    
    const query = `
      SELECT 
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
      ORDER BY name;
    `;
    
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} speakers`);
    
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
    
    result.rows.forEach(row => {
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
    const filename = 'all_speakers_complete.csv';
    fs.writeFileSync(filename, csvContent);
    
    console.log(`Excel file created: ${filename}`);
    console.log(`Total speakers exported: ${result.rows.length}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('Error generating Excel file:', error);
    process.exit(1);
  }
}

generateSpeakerExcel();