import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

interface SequentialMatch {
  speakerName: string;
  imageIndex: number;
  imagePath: string;
}

async function extractHeadshotsSequential() {
  try {
    const docPath = path.join(process.cwd(), '..', 'attached_assets', 'SpeakerSphere Headshots 1-100_1763501891748.docx');
    
    console.log('Extracting images and text from Word document...');
    
    const result = await mammoth.convertToHtml(
      { path: docPath },
      {
        convertImage: mammoth.images.imgElement((image) => {
          return image.read("base64").then((imageBuffer) => {
            return {
              src: `data:image/jpeg;base64,${imageBuffer}`
            };
          });
        })
      }
    );
    
    const html = result.value;
    
    const textMatches = html.match(/<p[^>]*>([^<]+)<\/p>/g) || [];
    const imageMatches = html.match(/<img[^>]*src="data:image\/[^;]+;base64,([^"]+)"[^>]*>/g) || [];
    
    const speakerNames: string[] = [];
    for (const match of textMatches) {
      const text = match.replace(/<\/?p[^>]*>/g, '').trim();
      if (text && text.length > 0 && !text.startsWith('data:')) {
        speakerNames.push(text);
      }
    }
    
    const imageData: string[] = [];
    for (const match of imageMatches) {
      const base64Match = match.match(/base64,([^"]+)/);
      if (base64Match) {
        imageData.push(base64Match[1]);
      }
    }
    
    console.log(`Found ${speakerNames.length} speaker names`);
    console.log(`Found ${imageData.length} images`);
    
    if (speakerNames.length !== imageData.length) {
      console.warn(`⚠️  Mismatch: ${speakerNames.length} names but ${imageData.length} images`);
    }
    
    const matches: SequentialMatch[] = [];
    const minCount = Math.min(speakerNames.length, imageData.length);
    
    for (let i = 0; i < minCount; i++) {
      const imagePath = `/tmp/speaker_headshot_${i}.jpg`;
      const buffer = Buffer.from(imageData[i], 'base64');
      fs.writeFileSync(imagePath, buffer);
      
      matches.push({
        speakerName: speakerNames[i],
        imageIndex: i,
        imagePath: imagePath
      });
      
      console.log(`${i + 1}. ${speakerNames[i]}`);
    }
    
    fs.writeFileSync('/tmp/sequential_matches.json', JSON.stringify(matches, null, 2));
    console.log(`\n✅ Created ${matches.length} sequential matches`);
    console.log('Saved to: /tmp/sequential_matches.json');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

extractHeadshotsSequential();
