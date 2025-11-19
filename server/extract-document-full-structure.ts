import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

async function extractFullStructure() {
  const docPath = '../attached_assets/SpeakerSphere Headshots 1-100_1763501891748.docx';
  
  console.log('Extracting images from Word document...\n');
  
  let imageCounter = 0;
  
  const result = await mammoth.convertToHtml(
    { path: docPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const buffer = await image.read();
        const outputPath = `/tmp/debug_image_${imageCounter}.jpg`;
        await fs.writeFile(outputPath, buffer);
        
        console.log(`Image #${imageCounter}: Saved to ${outputPath} (${buffer.length} bytes)`);
        imageCounter++;
        
        return { src: `placeholder_${imageCounter - 1}` };
      })
    }
  );
  
  // Parse the HTML to show structure
  const htmlLines = result.value.split('\n');
  
  console.log('\n\n=== Document Structure (Text and Images) ===\n');
  
  let textCounter = 0;
  result.value.split('</p>').slice(0, 20).forEach((segment, i) => {
    const text = segment.replace(/<[^>]*>/g, '').trim();
    if (text && !text.startsWith('placeholder')) {
      console.log(`Text #${textCounter}: "${text}"`);
      textCounter++;
    }
    if (segment.includes('placeholder_')) {
      const imgNum = segment.match(/placeholder_(\d+)/)?.[1];
      console.log(`  └─> [IMAGE ${imgNum}]`);
    }
  });
  
  console.log(`\n✓ Total images extracted: ${imageCounter}`);
}

extractFullStructure().catch(console.error);
