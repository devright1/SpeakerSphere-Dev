import { db } from "./server/db";
import { speakers } from "./shared/schema";
import { or, eq, sql } from "drizzle-orm";

async function checkActiveSpeakers() {
  console.log("🔍 Checking current active speaker count...");
  
  try {
    // Count active speakers (not hidden)
    const activeSpeakers = await db
      .select()
      .from(speakers)
      .where(or(eq(speakers.hideProfile, false), sql`${speakers.hideProfile} IS NULL`));
    
    // Count total speakers
    const totalSpeakers = await db.select().from(speakers);
    
    console.log(`\n✅ PLATFORM STATUS AFTER CLEANUP:`);
    console.log(`Active speakers visible to users: ${activeSpeakers.length}`);
    console.log(`Total speakers in database: ${totalSpeakers.length}`);
    console.log(`Hidden/deleted speakers: ${totalSpeakers.length - activeSpeakers.length}`);
    
    // Show speaker sources
    const sources = new Map<string, number>();
    activeSpeakers.forEach(speaker => {
      const domain = speaker.email ? speaker.email.split('@')[1] : 'no-email';
      sources.set(domain, (sources.get(domain) || 0) + 1);
    });
    
    console.log(`\n📊 Active speakers by email domain:`);
    Array.from(sources.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([domain, count]) => {
        console.log(`  ${count} speakers from ${domain}`);
      });

  } catch (error) {
    console.error("❌ Error checking speakers:", error);
  }
}

checkActiveSpeakers().then(() => process.exit(0));