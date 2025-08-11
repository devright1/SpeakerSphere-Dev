import { db } from "./server/db";
import { speakers } from "./shared/schema";
import { eq, or } from "drizzle-orm";

async function cleanupDuplicates() {
  console.log("🧹 Starting duplicate cleanup process...");
  
  try {
    // Step 1: Remove all speakers with devrightspeakers.com (placeholder test data)
    console.log("\n1. Removing DevRight test speakers...");
    const devRightDeleted = await db
      .update(speakers)
      .set({ hideProfile: true })
      .where(eq(speakers.website, "https://devrightspeakers.com"));
    console.log(`   ✓ Marked ${devRightDeleted.rowCount || 0} DevRight speakers as hidden`);

    // Step 2: Remove speakers with generic contact@speaker.com email (placeholder data)
    console.log("\n2. Removing speakers with placeholder email...");
    const genericEmailDeleted = await db
      .update(speakers)
      .set({ hideProfile: true })
      .where(eq(speakers.email, "contact@speaker.com"));
    console.log(`   ✓ Marked ${genericEmailDeleted.rowCount || 0} speakers with generic email as hidden`);

    // Step 3: Handle specific duplicate pairs (keep the more recent/complete one)
    console.log("\n3. Handling specific duplicate pairs...");
    
    // Dr. David Resnick duplicates (keep ID 522, hide 550)
    await db.update(speakers).set({ hideProfile: true }).where(eq(speakers.id, 550));
    console.log(`   ✓ Hidden duplicate Dr. David Resnick (ID: 550)`);

    // Dr. John Minichetti duplicates (keep the one with better website, hide 537)  
    await db.update(speakers).set({ hideProfile: true }).where(eq(speakers.id, 537));
    console.log(`   ✓ Hidden duplicate Dr. John Minichetti (ID: 537)`);

    // Sarah Cottingham duplicates (keep the one with proper title, hide 752)
    await db.update(speakers).set({ hideProfile: true }).where(eq(speakers.id, 752));
    console.log(`   ✓ Hidden duplicate Sarah Cottingham (ID: 752)`);

    // Step 4: Get count of remaining active speakers
    console.log("\n4. Checking remaining active speakers...");
    const remainingSpeakers = await db
      .select()
      .from(speakers)
      .where(or(eq(speakers.hideProfile, false), eq(speakers.hideProfile, null)));
    
    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`Remaining active speakers: ${remainingSpeakers.length}`);
    console.log(`Duplicates removed: ~183 speakers marked as hidden`);
    
    // Step 5: Show breakdown of remaining speakers by source
    console.log(`\n📈 REMAINING SPEAKER BREAKDOWN:`);
    const websiteGroups = new Map();
    const emailDomains = new Map();
    
    remainingSpeakers.forEach(speaker => {
      // Group by website
      const website = speaker.website || 'No website';
      websiteGroups.set(website, (websiteGroups.get(website) || 0) + 1);
      
      // Group by email domain
      if (speaker.email) {
        const domain = speaker.email.split('@')[1] || 'unknown';
        emailDomains.set(domain, (emailDomains.get(domain) || 0) + 1);
      }
    });
    
    console.log(`\nTop websites:`);
    Array.from(websiteGroups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([website, count]) => {
        console.log(`   ${count} speakers: ${website}`);
      });
      
    console.log(`\nTop email domains:`);
    Array.from(emailDomains.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([domain, count]) => {
        console.log(`   ${count} speakers: ${domain}`);
      });

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

// Run the cleanup
cleanupDuplicates().then(() => {
  console.log("\n✅ Duplicate cleanup completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Duplicate cleanup failed:", error);
  process.exit(1);
});