import { db } from './server/db';
import { speakers } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updateRemainingHeadshots() {
  try {
    const updates = [
      {
        name: 'Dr. Panos Papaspyridakis',
        imageUrl: 'https://dental.tufts.edu/sites/g/files/lrezom626/files/styles/large/public/ppapas01.jpeg?itok=qyKDbI82'
      },
      {
        name: 'Dr. Allie Rascon',
        imageUrl: 'https://www.conferenceharvester.com/uploads/harvester/photos/cropUBQCTSJF-Presenter-RasconA.jpg'
      },
      {
        name: 'Sam Alawie', 
        imageUrl: 'https://media.licdn.com/dms/image/v2/C4E03AQEo5w4YdGaQ3g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1645736726935?e=2147483647&v=beta&t=gKxVrDKNLdFQLQN7U-0FIgfKgHKAT0QnOvPokUxTfQM'
      },
      {
        name: 'Dr. Curry Leavitt',
        imageUrl: 'https://www.conferenceharvester.com/uploads/harvester/photos/cropUBQCTSJF-Presenter-LeavittC.jpg'
      },
      {
        name: 'Dr. Lorenzo Tavelli',
        imageUrl: 'https://www.conferenceharvester.com/uploads/harvester/photos/cropUBQCTSJF-Presenter-TavelliL.jpg'
      },
      {
        name: 'Dr. Sascha Jovanovic',
        imageUrl: 'https://www.conferenceharvester.com/uploads/harvester/photos/cropUBQCTSJF-Presenter-JovanovicS.jpg'
      },
      {
        name: 'Dr. Phil Walton',
        imageUrl: 'https://www.conferenceharvester.com/uploads/harvester/photos/cropUBQCTSJF-Presenter-WaltonP.jpg'
      }
    ];

    let updated = 0;
    for (const update of updates) {
      const result = await db.update(speakers)
        .set({ imageUrl: update.imageUrl })
        .where(eq(speakers.name, update.name));
      
      console.log(`Updated ${update.name}: ${update.imageUrl}`);
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} speakers with professional headshots`);
    
    // Check final status
    const allSpeakers = await db.select().from(speakers);
    const needingUpdates = allSpeakers.filter(speaker => 
      !speaker.imageUrl || 
      speaker.imageUrl === '' ||
      speaker.imageUrl === '/api/placeholder/300/300' ||
      speaker.imageUrl === '/api/placeholder/150/150' ||
      speaker.imageUrl.startsWith('/attached_assets/') ||
      speaker.imageUrl.includes('dev-right-conference')
    );

    console.log(`\n📊 Final status: ${needingUpdates.length} speakers still need headshots out of ${allSpeakers.length} total`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateRemainingHeadshots();