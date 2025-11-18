import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { speakers } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

interface SpeakerImageMapping {
  speakerName: string;
  speakerTitle: string;
  imagePath: string;
  imageBuffer: Buffer;
}

async function extractImagesFromWordDoc() {
  const docPath = path.join(process.cwd(), 'attached_assets', 'SpeakerSphere Headshots 1-100_1763501090851.docx');
  
  console.log('Extracting Word document:', docPath);
  
  // Extract the .docx file (it's a ZIP archive)
  const zip = new AdmZip(docPath);
  const zipEntries = zip.getEntries();
  
  // Find all images in word/media folder
  const imageEntries = zipEntries.filter(entry => 
    entry.entryName.startsWith('word/media/') && 
    (entry.entryName.endsWith('.jpg') || 
     entry.entryName.endsWith('.jpeg') || 
     entry.entryName.endsWith('.png'))
  );
  
  console.log(`Found ${imageEntries.length} images in the document`);
  
  // Extract document.xml to parse text
  const documentXml = zip.readAsText('word/document.xml');
  
  // Parse the XML to extract text runs (this is a simplified parser)
  // In Word XML, text is in <w:t> tags and images are referenced via relationships
  const textMatches = documentXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  const textContent = textMatches.map(match => {
    const text = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
    return text.trim();
  }).filter(text => text.length > 0);
  
  console.log(`Extracted ${textContent.length} text segments`);
  
  // Map speakers based on name/title pattern
  const mappings: SpeakerImageMapping[] = [];
  let currentSpeaker: { name: string; title: string } | null = null;
  let imageIndex = 0;
  
  for (let i = 0; i < textContent.length; i++) {
    const text = textContent[i];
    
    // Check if this line looks like a name (contains "Dr." or capitals)
    // and the next line is likely a title
    if (i + 1 < textContent.length) {
      const nextText = textContent[i + 1];
      
      // Simple heuristic: if current text is a name and next is a title
      if (text.length > 3 && nextText.length > 3) {
        currentSpeaker = {
          name: text,
          title: nextText
        };
        
        // Skip the title line
        i++;
        
        // Associate with the next image
        if (imageIndex < imageEntries.length) {
          const imageEntry = imageEntries[imageIndex];
          mappings.push({
            speakerName: currentSpeaker.name,
            speakerTitle: currentSpeaker.title,
            imagePath: imageEntry.entryName,
            imageBuffer: imageEntry.getData()
          });
          imageIndex++;
        }
      }
    }
  }
  
  console.log(`Created ${mappings.length} speaker-to-image mappings`);
  
  // Save extracted images to a temp directory for inspection
  const tempDir = path.join(process.cwd(), 'temp_extracted_images');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  mappings.forEach((mapping, index) => {
    const ext = path.extname(mapping.imagePath);
    const filename = `${index}_${mapping.speakerName.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, mapping.imageBuffer);
  });
  
  console.log(`Saved ${mappings.length} images to ${tempDir}`);
  
  return mappings;
}

// Run the extraction
extractImagesFromWordDoc()
  .then(mappings => {
    console.log('\nSuccessfully extracted images:');
    mappings.forEach((m, i) => {
      console.log(`${i + 1}. ${m.speakerName} - ${m.speakerTitle}`);
    });
  })
  .catch(error => {
    console.error('Error extracting images:', error);
    process.exit(1);
  });
