import mammoth from 'mammoth';
import fs from 'fs';

async function debugWordStructure() {
  const docPath = '../attached_assets/SpeakerSphere Headshots 1-100_1763501891748.docx';
  
  // Extract with detailed element tracking
  const result = await mammoth.convertToHtml({ path: docPath });
  const htmlContent = result.value;
  
  // Also extract raw structure
  const rawResult = await mammoth.extractRawText({ path: docPath });
  const lines = rawResult.value.split('\n').filter(line => line.trim());
  
  console.log('First 30 lines of raw text:\n');
  lines.slice(0, 30).forEach((line, i) => {
    console.log(`Line ${i}: "${line}"`);
  });
  
  console.log('\n\n=== Looking around Charles Goodacre ===\n');
  const goodacreIndex = lines.findIndex(line => line.includes('Charles Goodacre'));
  if (goodacreIndex >= 0) {
    lines.slice(goodacreIndex - 2, goodacreIndex + 5).forEach((line, i) => {
      console.log(`${goodacreIndex - 2 + i}: "${line}"`);
    });
  }
}

debugWordStructure().catch(console.error);
