import AdmZip from 'adm-zip';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

interface SpeakerImageMapping {
  speakerName: string;
  speakerTitle: string;
  imageIndex: number;
  imageBuffer: Buffer;
  imageExt: string;
}

async function extractImagesFromWordDoc() {
  const docPath = path.join(process.cwd(), 'attached_assets', 'SpeakerSphere Headshots 1-100_1763501090851.docx');
  
  console.log('Extracting Word document:', docPath);
  
  // Extract images using zip
  const zip = new AdmZip(docPath);
  const zipEntries = zip.getEntries();
  
  const imageEntries = zipEntries.filter(entry => 
    entry.entryName.startsWith('word/media/') && 
    (entry.entryName.endsWith('.jpg') || 
     entry.entryName.endsWith('.jpeg') || 
     entry.entryName.endsWith('.png'))
  );
  
  console.log(`Found ${imageEntries.length} images`);
  
  // Extract text using mammoth for better text extraction
  const result = await mammoth.extractRawText({ path: docPath });
  const text = result.value;
  
  // Split into lines and clean up
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log(`Extracted ${lines.length} lines of text`);
  console.log('First 20 lines:');
  lines.slice(0, 20).forEach((line, i) => {
    console.log(`  ${i}: ${line}`);
  });
  
  // Process lines in pairs (name, then title)
  const mappings: SpeakerImageMapping[] = [];
  let imageIndex = 0;
  
  for (let i = 0; i < lines.length - 1; i += 2) {
    const nameLine = lines[i];
    const titleLine = lines[i + 1];
    
    // Skip if these don't look like name/title pairs
    if (nameLine.length < 3 || titleLine.length < 3) {
      continue;
    }
    
    // Check if we have an image for this speaker
    if (imageIndex < imageEntries.length) {
      const imageEntry = imageEntries[imageIndex];
      const ext = path.extname(imageEntry.entryName);
      
      mappings.push({
        speakerName: nameLine,
        speakerTitle: titleLine,
        imageIndex: imageIndex,
        imageBuffer: imageEntry.getData(),
        imageExt: ext
      });
      
      imageIndex++;
    }
  }
  
  console.log(`\nCreated ${mappings.length} speaker-to-image mappings`);
  
  // Save to temp directory
  const tempDir = path.join(process.cwd(), 'temp_extracted_images_v2');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Clear existing files
  const existingFiles = fs.readdirSync(tempDir);
  existingFiles.forEach(file => {
    fs.unlinkSync(path.join(tempDir, file));
  });
  
  mappings.forEach((mapping) => {
    const safeName = mapping.speakerName.replace(/[^a-zA-Z0-9\s\-]/g, '').replace(/\s+/g, '_');
    const filename = `${mapping.imageIndex.toString().padStart(3, '0')}_${safeName}${mapping.imageExt}`;
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, mapping.imageBuffer);
  });
  
  console.log(`\nSaved ${mappings.length} images to ${tempDir}`);
  
  // Save mapping to JSON file for reference
  const mappingData = mappings.map(m => ({
    name: m.speakerName,
    title: m.speakerTitle,
    imageIndex: m.imageIndex
  }));
  
  fs.writeFileSync(
    path.join(tempDir, 'mapping.json'),
    JSON.stringify(mappingData, null, 2)
  );
  
  return mappings;
}

// Run the extraction
extractImagesFromWordDoc()
  .then(mappings => {
    console.log('\n=== Successfully extracted images ===');
    mappings.forEach((m, i) => {
      console.log(`${i + 1}. ${m.speakerName}`);
      console.log(`   ${m.speakerTitle}`);
    });
  })
  .catch(error => {
    console.error('Error extracting images:', error);
    process.exit(1);
  });
