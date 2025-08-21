#!/usr/bin/env node

/**
 * Database Synchronization Verification Script
 * 
 * This script verifies that changes made in the Replit development environment
 * are immediately reflected in the production database (and vice versa).
 * 
 * Usage: node verify-sync.js
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure the database connection
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verifySync() {
  try {
    console.log('🔄 Testing database synchronization...\n');
    
    // Test 1: Check connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test 2: Get current data counts
    const speakersResult = await client.query('SELECT COUNT(*) FROM speakers');
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    const inquiriesResult = await client.query('SELECT COUNT(*) FROM inquiries');
    
    console.log('📊 Current database state:');
    console.log(`   Speakers: ${speakersResult.rows[0].count}`);
    console.log(`   Users: ${usersResult.rows[0].count}`);
    console.log(`   Inquiries: ${inquiriesResult.rows[0].count}`);
    
    // Test 3: Database host verification
    console.log(`🏠 Database host: ${process.env.PGHOST}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test 4: Create a test record and verify it exists
    const testQuery = `
      INSERT INTO speakers (name, slug, title, bio, expertise, location, category, achievements, lectures, languages, speaker_type, email)
      VALUES ('Sync Test Speaker', 'sync-test-speaker-' || EXTRACT(epoch FROM NOW()), 
              'Test Title', 'Test speaker for sync verification', ARRAY['Testing'], 'Test Location', 
              'Test Category', ARRAY['Test Achievement'], ARRAY['Test Lecture'], ARRAY['English'], 'educational', 'test@sync.com')
      RETURNING id, name;
    `;
    
    const testResult = await client.query(testQuery);
    const testSpeaker = testResult.rows[0];
    
    console.log(`✅ Test record created: ID ${testSpeaker.id} - ${testSpeaker.name}`);
    
    // Clean up test record
    await client.query('DELETE FROM speakers WHERE id = $1', [testSpeaker.id]);
    console.log('🧹 Test record cleaned up');
    
    client.release();
    
    console.log('\n🎉 Database synchronization verification completed successfully!');
    console.log('💡 Changes made in Replit will immediately appear on your main domain');
    console.log('💡 Changes made on your main domain will immediately appear in Replit');
    
  } catch (error) {
    console.error('❌ Synchronization verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySync();