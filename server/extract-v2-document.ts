import mammoth from 'mammoth';
import fs from 'fs/promises';
import { db } from './db';
import { speakers } from '../shared/schema';

interface SpeakerImagePair {
  speakerName: string;
  speakerId: number;
  imageIndex: number;
  imagePath: string;
}

async function extractV2Document() {
  const docPath = '../attached_assets/speaker 0-100 v2_1763563871617.docx';
  
  console.log('Loading speakers from database...\n');
  const allSpeakers = await db.select().from(speakers);
  
  console.log('Extracting Word document v2...\n');
  
  let imageCounter = 0;
  const extractedImages: string[] = [];
  
  // Extract all images in order
  await mammoth.convertToHtml(
    { path: docPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const buffer = await image.read();
        const outputPath = `/tmp/v2_image_${imageCounter}.jpg`;
        await fs.writeFile(outputPath, buffer);
        
        extractedImages.push(outputPath);
        console.log(`Image ${imageCounter}: ${buffer.length} bytes → ${outputPath}`);
        imageCounter++;
        
        return { src: `placeholder_${imageCounter - 1}` };
      })
    }
  );
  
  // Extract text lines
  const result = await mammoth.extractRawText({ path: docPath });
  const lines = result.value.split('\n').filter(line => line.trim());
  
  console.log(`\nExtracted ${lines.length} text lines and ${imageCounter} images`);
  console.log('\n=== Matching Names to Images (Sequential Pairs) ===\n');
  
  const pairs: SpeakerImagePair[] = [];
  let currentImageIndex = 0;
  
  for (const line of lines) {
    const cleanedLine = line.trim();
    if (!cleanedLine || cleanedLine.length < 5) continue;
    
    // Try to match this line to a speaker in database
    const matchedSpeaker = allSpeakers.find(speaker => {
      const speakerCore = speaker.name
        .toLowerCase()
        .replace(/[,\\.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const lineCore = cleanedLine
        .toLowerCase()
        .replace(/[,\\.]/g, ' ')
        .replace(/\s+(dmd|dds|msd|phd|facp|cdt|ms|md|bds|mchd|dsc|mba|msc|daboi|id|dicoi|fagd|faaid|afaaid|mhba|aboi|amp|department chair|executive dental director|private practice|acp president|board-certified|periodontist|implant specialist|dental specialist|contemporary implant dentistry specialist|key opinion leader|straumann group|full-arch specialist|international speaker|straumann digital excellence center|sleep medicine|owner|ceo|west 10th dental group|honored fellow aaid|prosthodontist|texas implant institute|nobel biocare lecturer|complication prevention|extramaxillary implants|emergency management|dentist and owner|eastside dental group|valedictorian|multi-state implant educator|past president aaid|aaid diplomate|dental technology economist|clinical professor|fellow academy|general dentistry|associate fellow|comprehensive dentistry|laser specialist|chief executive officer|intelligent care alliance|director|ai and technology integration|dental ai association|founder and ceo|office-based anesthesia|professional development|periodontal|founder of seattle study club|maxillofacial prosthetist).*$/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      return speakerCore.includes(lineCore) || lineCore.includes(speakerCore.split(' ').slice(0, 2).join(' '));
    });
    
    if (matchedSpeaker && currentImageIndex < extractedImages.length) {
      pairs.push({
        speakerName: matchedSpeaker.name,
        speakerId: matchedSpeaker.id,
        imageIndex: currentImageIndex,
        imagePath: extractedImages[currentImageIndex]
      });
      
      console.log(`✓ ${pairs.length}. "${matchedSpeaker.name}" → Image ${currentImageIndex}`);
      currentImageIndex++;
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total pairs: ${pairs.length}`);
  console.log(`Images used: ${currentImageIndex} of ${imageCounter}`);
  
  // Save mapping
  await fs.writeFile('/tmp/v2_speaker_mappings.json', JSON.stringify(pairs, null, 2));
  
  console.log('\n✅ Saved v2 mapping to: /tmp/v2_speaker_mappings.json');
  
  // Show first 10
  console.log('\n=== First 10 mappings ===');
  pairs.slice(0, 10).forEach(p => {
    console.log(`${p.imageIndex}: ${p.speakerName}`);
  });
}

extractV2Document().catch(console.error);
