import { db } from "./db";
import { sql } from "drizzle-orm";

export async function migrateContentCategories() {
  const legacyMap: Record<string, string> = {
    document: "documents",
    presentation: "documents",
    video: "documents",
    audio: "documents",
    image: "images",
  };

  for (const [oldCat, newCat] of Object.entries(legacyMap)) {
    const result = await db.execute(
      sql`UPDATE speaker_content SET category = ${newCat} WHERE category = ${oldCat}`
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log(`Migrated ${result.rowCount} content items: "${oldCat}" -> "${newCat}"`);
    }
  }
}
