import { importSpeakersFromCSV } from './server/comprehensive-speaker-import';

async function runImport() {
  try {
    console.log('🚀 Starting CSV import...');
    const results = await importSpeakersFromCSV();
    console.log('✅ Import completed:', results);
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

runImport();