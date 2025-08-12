import { db } from "./server/db";
import { speakers } from "./shared/schema";
import { eq } from "drizzle-orm";

async function makeAllSpeakersVisible() {
  console.log("🔄 Making all speakers visible on admin page...");
  
  try {
    // First, check how many speakers are currently hidden
    const hiddenSpeakers = await db
      .select()
      .from(speakers)
      .where(eq(speakers.hideProfile, true));
    
    console.log(`Found ${hiddenSpeakers.length} currently hidden speakers`);
    
    if (hiddenSpeakers.length > 0) {
      console.log("Hidden speakers:");
      hiddenSpeakers.forEach(speaker => {
        console.log(`  - ID: ${speaker.id}, Name: "${speaker.name}"`);
      });
      
      // Make all speakers visible by setting hideProfile to false
      const result = await db
        .update(speakers)
        .set({ hideProfile: false })
        .where(eq(speakers.hideProfile, true));
      
      console.log(`✅ Made ${result.rowCount || 0} speakers visible`);
    } else {
      console.log("✅ All speakers are already visible");
    }
    
    // Get final count
    const allSpeakers = await db.select().from(speakers);
    const visibleSpeakers = await db
      .select()
      .from(speakers)
      .where(eq(speakers.hideProfile, false));
    
    console.log(`\n📊 FINAL STATUS:`);
    console.log(`Total speakers in database: ${allSpeakers.length}`);
    console.log(`Visible speakers: ${visibleSpeakers.length}`);
    console.log(`Hidden speakers: ${allSpeakers.length - visibleSpeakers.length}`);
    
  } catch (error) {
    console.error("❌ Error making speakers visible:", error);
    throw error;
  }
}

makeAllSpeakersVisible().then(() => {
  console.log("\n✅ All speakers are now visible on the admin page!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Failed to make speakers visible:", error);
  process.exit(1);
});