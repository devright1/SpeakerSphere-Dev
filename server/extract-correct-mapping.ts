import mammoth from 'mammoth';
import fs from 'fs/promises';
import { db } from './db';
import { speakers } from '../shared/schema';

interface SpeakerImageMapping {
  speakerName: string;
  speakerId: number;
  imageIndex: number;
  imagePath: string;
}

async function extractCorrectMapping() {
  const docPath = '../attached_assets/SpeakerSphere Headshots 1-100_1763501891748.docx';
  
  console.log('Loading all speakers from database...\n');
  const allSpeakers = await db.select().from(speakers);
  console.log(`Found ${allSpeakers.length} total speakers in database`);
  
  console.log('\nExtracting Word document with stateful parsing...\n');
  
  let imageCounter = 0;
  let textCounter = 0;
  const textElements: string[] = [];
  const imageMap = new Map<number, string>(); // imageIndex -> filepath
  
  // Extract all text and images
  await mammoth.convertToHtml(
    { path: docPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const buffer = await image.read();
        const outputPath = `/tmp/correct_image_${imageCounter}.jpg`;
        await fs.writeFile(outputPath, buffer);
        
        imageMap.set(imageCounter, outputPath);
        console.log(`Image ${imageCounter}: ${buffer.length} bytes`);
        imageCounter++;
        
        return { src: `placeholder_${imageCounter - 1}` };
      })
    }
  );
  
  // Parse HTML to extract text in order
  const result = await mammoth.extractRawText({ path: docPath });
  const lines = result.value.split('\n').filter(line => line.trim());
  
  console.log(`\nExtracted ${lines.length} text lines and ${imageCounter} images`);
  
  // Stateful parser: match each known speaker to the next available image
  const mappings: SpeakerImageMapping[] = [];
  let currentImageIndex = 0;
  
  console.log('\n=== Matching speakers to images ===\n');
  
  for (const line of lines) {
    const cleanedLine = line.trim();
    
    // Try to match this line to a speaker in the database
    const matchedSpeaker = allSpeakers.find(speaker => {
      const speakerNameCore = speaker.name
        .toLowerCase()
        .replace(/[,\\.]/g, '')
        .replace(/\s+(dds|dmd|msd|phd|facp|cdt|ms|md|bds|mchd|dsc|mba|msc|daboi|id|dicoi|fagd|faaid|afaaid|mhba|aboi)/gi, '')
        .trim();
      
      const lineCore = cleanedLine
        .toLowerCase()
        .replace(/[,\\.]/g, '')
        .replace(/\s+(dental professional|vice president|certified dental technician|lab equipment|department chair|executive dental director|private practice|acp president|board-certified|distinguished professor|dental specialist|key opinion leader|international speaker|sleep medicine|owner|ceo|prosthodontist|full arch specialist|complication prevention|emergency management|honored fellow|past president|clinical professor|fellow academy|associate fellow|office-based anesthesia|professional development|sleep medicine specialist|full-arch therapy|periodontal|implant specialist|full-arch implantology|robotics technology expert|valedictorian|multi-state implant educator).*/gi, '')
        .replace(/\s+(dds|dmd|msd|phd|facp|cdt|ms|md|bds|mchd|dsc|mba|msc|daboi|id|dicoi|fagd|faaid|afaaid|mhba|aboi|amp).*/gi, '')
        .trim();
      
      return lineCore.includes(speakerNameCore) || speakerNameCore.includes(lineCore);
    });
    
    if (matchedSpeaker) {
      // This line is a speaker name - assign the next image to them
      if (currentImageIndex < imageCounter) {
        const imagePath = imageMap.get(currentImageIndex);
        if (imagePath) {
          mappings.push({
            speakerName: matchedSpeaker.name,
            speakerId: matchedSpeaker.id,
            imageIndex: currentImageIndex,
            imagePath: imagePath
          });
          
          console.log(`✓ ${mappings.length}. "${matchedSpeaker.name}" → Image ${currentImageIndex}`);
          currentImageIndex++;
        }
      }
    } else {
      // This line is probably a subtitle or unmatched text - skip it
      if (cleanedLine.length > 10 && !cleanedLine.match(/^(dr\.|professor|distinguished)/i)) {
        console.log(`  ⏭️  Skipped: "${cleanedLine.substring(0, 50)}..."`);
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total mappings created: ${mappings.length}`);
  console.log(`Images used: ${currentImageIndex} of ${imageCounter}`);
  
  // Save mapping
  await fs.writeFile('/tmp/correct_speaker_mappings.json', JSON.stringify(mappings, null, 2));
  
  console.log('\n✅ Saved correct mapping to: /tmp/correct_speaker_mappings.json');
  
  // Show first 15 for verification
  console.log('\n=== First 15 mappings ===');
  mappings.slice(0, 15).forEach(m => {
    console.log(`${m.imageIndex}: ${m.speakerName}`);
  });
}

extractCorrectMapping().catch(console.error);
