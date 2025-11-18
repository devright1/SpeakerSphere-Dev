import { db } from "./db";
import { speakers } from "@shared/schema";
import { objectStorageClient } from "./objectStorage";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR || "";

interface MigrationResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: { speakerId: number; name: string; url: string; error: string }[];
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.log(`Failed to download: ${url} - Status: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    
    // Check if it's actually an image
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`Not an image: ${url} - Content-Type: ${contentType}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log(`Error downloading ${url}:`, error);
    return null;
  }
}

async function uploadToStorage(imageBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const objectId = randomUUID();
  const extension = contentType.split('/')[1] || 'jpg';
  const fullPath = `${PRIVATE_OBJECT_DIR}/speaker-images/${objectId}.${extension}`;

  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  // Upload the file
  await file.save(imageBuffer, {
    metadata: {
      contentType,
    },
  });

  // Make the file publicly accessible
  await file.makePublic();

  // Return the public URL
  return `https://storage.googleapis.com/${bucketName}/${objectName}`;
}

export async function migrateSpeakerImages(limit?: number): Promise<MigrationResult> {
  console.log("Starting speaker image migration...");
  
  if (!PRIVATE_OBJECT_DIR) {
    throw new Error("PRIVATE_OBJECT_DIR environment variable is not set");
  }

  const result: MigrationResult = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Fetch all speakers
    const allSpeakers = await db.select().from(speakers);
    const speakersToProcess = limit ? allSpeakers.slice(0, limit) : allSpeakers;
    
    result.total = speakersToProcess.length;
    console.log(`Found ${result.total} speakers to process`);

    for (let i = 0; i < speakersToProcess.length; i++) {
      const speaker = speakersToProcess[i];
      console.log(`\n[${i + 1}/${result.total}] Processing: ${speaker.name}`);
      console.log(`Current URL: ${speaker.imageUrl}`);

      // Skip if already using our storage
      if (speaker.imageUrl.includes('storage.googleapis.com')) {
        console.log(`✓ Already migrated, skipping`);
        result.skipped++;
        continue;
      }

      try {
        // Download the image
        console.log(`Downloading image...`);
        const imageBuffer = await downloadImage(speaker.imageUrl);

        if (!imageBuffer) {
          console.log(`✗ Failed to download image`);
          result.failed++;
          result.errors.push({
            speakerId: speaker.id,
            name: speaker.name,
            url: speaker.imageUrl,
            error: "Failed to download or not a valid image",
          });
          continue;
        }

        // Determine content type from URL or default to jpeg
        let contentType = 'image/jpeg';
        const urlLower = speaker.imageUrl.toLowerCase();
        if (urlLower.includes('.png')) contentType = 'image/png';
        else if (urlLower.includes('.gif')) contentType = 'image/gif';
        else if (urlLower.includes('.webp')) contentType = 'image/webp';

        // Upload to our storage
        console.log(`Uploading to storage...`);
        const newUrl = await uploadToStorage(imageBuffer, speaker.slug, contentType);
        console.log(`New URL: ${newUrl}`);

        // Update the database
        await db
          .update(speakers)
          .set({ imageUrl: newUrl })
          .where(eq(speakers.id, speaker.id));

        console.log(`✓ Successfully migrated`);
        result.successful++;

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`✗ Error processing speaker:`, error);
        result.failed++;
        result.errors.push({
          speakerId: speaker.id,
          name: speaker.name,
          url: speaker.imageUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Total speakers: ${result.total}`);
    console.log(`Successfully migrated: ${result.successful}`);
    console.log(`Already migrated (skipped): ${result.skipped}`);
    console.log(`Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log("\nFailed speakers:");
      result.errors.forEach(err => {
        console.log(`- ${err.name} (ID: ${err.speakerId}): ${err.error}`);
      });
    }

    return result;
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateSpeakerImages()
    .then(() => {
      console.log("\nMigration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
