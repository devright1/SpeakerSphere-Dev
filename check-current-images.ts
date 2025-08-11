import { db } from './server/db';
import { speakers } from './shared/schema';

async function checkImageStatus() {
  try {
    const allSpeakers = await db.select().from(speakers);
    
    // Count different types of images
    const placeholder300 = allSpeakers.filter(s => s.imageUrl === '/api/placeholder/300/300');
    const placeholder150 = allSpeakers.filter(s => s.imageUrl === '/api/placeholder/150/150');
    const localAssets = allSpeakers.filter(s => s.imageUrl && s.imageUrl.startsWith('/attached_assets/'));
    const devUrls = allSpeakers.filter(s => s.imageUrl && s.imageUrl.includes('dev-right-conference'));
    const emptyImages = allSpeakers.filter(s => !s.imageUrl || s.imageUrl === '');
    const goodImages = allSpeakers.filter(s => 
      s.imageUrl && 
      !s.imageUrl.startsWith('/api/placeholder/') &&
      !s.imageUrl.startsWith('/attached_assets/') &&
      !s.imageUrl.includes('dev-right-conference') &&
      s.imageUrl !== ''
    );
    
    console.log('📊 Current image status:');
    console.log(`📦 Placeholder 300x300: ${placeholder300.length}`);
    console.log(`📦 Placeholder 150x150: ${placeholder150.length}`);
    console.log(`📁 Local assets: ${localAssets.length}`);
    console.log(`🔗 Dev URLs: ${devUrls.length}`);
    console.log(`❌ Empty/null: ${emptyImages.length}`);
    console.log(`✅ Good images: ${goodImages.length}`);
    console.log(`📷 Total speakers: ${allSpeakers.length}`);
    
    const totalNeedingUpdate = placeholder300.length + placeholder150.length + localAssets.length + devUrls.length + emptyImages.length;
    console.log(`🎯 Total needing updates: ${totalNeedingUpdate}`);
    
    if (placeholder300.length > 0) {
      console.log('\n📦 Speakers with 300x300 placeholders:');
      placeholder300.slice(0, 20).forEach(s => {
        console.log(`- ${s.name}`);
      });
    }

    if (placeholder150.length > 0) {
      console.log('\n📦 Speakers with 150x150 placeholders:');
      placeholder150.slice(0, 10).forEach(s => {
        console.log(`- ${s.name}`);
      });
    }

    if (localAssets.length > 0) {
      console.log('\n📁 Speakers with local asset paths:');
      localAssets.slice(0, 10).forEach(s => {
        console.log(`- ${s.name}: ${s.imageUrl}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImageStatus();