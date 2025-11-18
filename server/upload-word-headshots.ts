import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { speakers } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { objectStorageClient } from './objectStorage';
import { randomUUID } from 'crypto';

const PUBLIC_OBJECT_SEARCH_PATHS = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
const publicPath = PUBLIC_OBJECT_SEARCH_PATHS.split(',')[0].trim();

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

// Manual mapping based on document structure (name + title combined, one per line before each image)
const speakerMappings = [
  { fullText: "Adrian McCovy Dental Professional", name: "Adrian McCovy" },
  { fullText: "allen robinson robotics technology expert", name: "Allen Robinson" },
  { fullText: "Allison Horn Vice President, Marketing", name: "Allison Horn" },
  { fullText: "Arian B. Deutsch, CDT Certified Dental Technician", name: "Arian B. Deutsch, CDT" },
  { fullText: "Brandon Dickerman Lab Equipment", name: "Brandon Dickerman" },
  { fullText: "Brody Hildebrand DDS", name: "Brody Hildebrand" },
  { fullText: "Catrise Austin Dental Professional", name: "Catrise Austin" },
  { fullText: "Charles Goodacre, DDS, MSD, FACP Distinguished Professor", name: "Charles Goodacre, DDS, MSD, FACP" },
  { fullText: "Christopher Brendemuhl DMD, Department Chair", name: "Christopher Brendemuhl" },
  { fullText: "Cyrus Lee DMD, Executive Dental Director", name: "Cyrus Lee" },
  { fullText: "Darin Dichter, DMD Private Practice", name: "Darin Dichter, DMD" },
  { fullText: "Douglas Benting, DDS, MS, FACP ACP President", name: "Douglas Benting, DDS, MS, FACP" },
  { fullText: "Dr. Algirdas Puisys DDS, PhD", name: "Dr. Algirdas Puisys" },
  { fullText: "Dr. Allie Rascon Board-Certified Periodontist & Implant Specialist", name: "Dr. Allie Rascon" },
  { fullText: "Dr. Alonso Carrasco-Labra DDS, MSc, PhD", name: "Dr. Alonso Carrasco-Labra" },
  { fullText: "Dr. Andy Burton Dental Specialist", name: "Dr. Andy Burton" },
  { fullText: "Dr. Angel Garcia-Cañas Contemporary Implant Dentistry Specialist", name: "Dr. Angel Garcia-Cañas" },
  { fullText: "Dr. Anthony Sallustio DDS", name: "Dr. Anthony Sallustio" },
  { fullText: "Dr. Arndt Guentsch DMD, PhD, MHBA, MS", name: "Dr. Arndt Guentsch" },
  { fullText: "Dr. Athena Goodarzi Key Opinion Leader Straumann Group - Full-Arch Specialist", name: "Dr. Athena Goodarzi" },
  { fullText: "Dr. Azam Saeed International Speaker - Straumann Digital Excellence Center", name: "Dr. Azam Saeed" },
  { fullText: "Dr. Ben Kellum DDS, Full Arch Specialist", name: "Dr. Ben Kellum" },
  { fullText: "Dr. Benjamin Pliska Sleep Medicine", name: "Dr. Benjamin Pliska" },
  { fullText: "Dr. Bradley Ross DMD", name: "Dr. Bradley Ross" },
  { fullText: "Dr. Brent Barta Owner & CEO, West 10th Dental Group", name: "Dr. Brent Barta" },
  { fullText: "Dr. Brian J. Jackson DDS, DABOI/ID, Honored Fellow AAID", name: "Dr. Brian J. Jackson" },
  { fullText: "Dr. Bruce G. Freund DDS", name: "Dr. Bruce G. Freund" },
  { fullText: "Dr. Carlos de Carvalho Prosthodontist", name: "Dr. Carlos de Carvalho" },
  { fullText: "Dr. Christian Coachman CDT, DDS", name: "Dr. Christian Coachman" },
  { fullText: "Dr. Christian Hart DDS, Full Arch Specialist", name: "Dr. Christian Hart" },
  { fullText: "Dr. Clark Damon CEO Texas Implant Institute - Nobel Biocare Lecturer", name: "Dr. Clark Damon" },
  { fullText: "Dr. Craig I. Aronson DDS, FAGD, FAAID, DABOI/ID", name: "Dr. Craig I. Aronson" },
  { fullText: "Dr. Craig M. Misch Complication Prevention", name: "Dr. Craig M. Misch" },
  { fullText: "Dr. Dan Holtzclaw Extramaxillary Implants", name: "Dr. Dan Holtzclaw" },
  { fullText: "Dr. Daniel Domingue DDS, DABOI/ID, DICOI", name: "Dr. Daniel Domingue" },
  { fullText: "Dr. David A. Fenton Emergency Management", name: "Dr. David A. Fenton" },
  { fullText: "Dr. David L. Cochran DDS, PhD", name: "Dr. David L. Cochran" },
  { fullText: "Dr. David Resnick DDS, FAAID, DABOI/ID", name: "Dr. David Resnick" },
  { fullText: "Dr. DeVonte Johnson DMD, Dentist and Owner, Eastside Dental Group", name: "Dr. DeVonte Johnson" },
  { fullText: "Dr. Dean Morton Prosthodontist", name: "Dr. Dean Morton" },
  { fullText: "Dr. Dimitris N. Tatakis DDS, PhD", name: "Dr. Dimitris N. Tatakis" },
  { fullText: "Dr. Donald J. Provenzale DDS, DABOI/ID, AFAAID", name: "Dr. Donald J. Provenzale" },
  { fullText: "Dr. Drew Phillips Valedictorian & Multi-State Implant Educator", name: "Dr. Drew Phillips" },
  { fullText: "Dr. Duke Heller DDS, MS, Honored Fellow AAID", name: "Dr. Duke Heller" },
  { fullText: "Dr. Ed R. Kusek DDS, FAAID, DABOI/ID, Past President AAID", name: "Dr. Ed R. Kusek" },
  { fullText: "Dr. Fadi Hasan DDS, MSD", name: "Dr. Fadi Hasan" },
  { fullText: "Dr. Frank Caputo DDS, AAID Diplomate", name: "Dr. Frank Caputo" },
  { fullText: "Dr. Frank M. Spear DDS, MSD", name: "Dr. Frank M. Spear" },
  { fullText: "Dr. Galip Gurel DDS, MSc", name: "Dr. Galip Gurel" },
  { fullText: "Dr. George Arvanitis DDS, DABOI, Honored Fellow AAID", name: "Dr. George Arvanitis" },
  { fullText: "Dr. George Tysowsky Dental Technology Economist", name: "Dr. George Tysowsky" },
  { fullText: "Dr. Gerard J. Chiche DDS", name: "Dr. Gerard J. Chiche" },
  { fullText: "Dr. Giorgio Tabanella DDS, MS", name: "Dr. Giorgio Tabanella" },
  { fullText: "Dr. Gustavo Giordani DDS", name: "Dr. Gustavo Giordani" },
  { fullText: "Dr. Hesham Nouh DSc, Clinical Professor", name: "Dr. Hesham Nouh" },
  { fullText: "Dr. Howard Gluckman BDS, MChD, PhD", name: "Dr. Howard Gluckman" },
  { fullText: "Dr. Hussam Batal DMD, Clinical Professor", name: "Dr. Hussam Batal" },
  { fullText: "Dr. Ihab Hanna DDS, FAAID-DABOI, DICOI", name: "Dr. Ihab Hanna" },
  { fullText: "Dr. Isabella Rocchietta DDS, MSc", name: "Dr. Isabella Rocchietta" },
  { fullText: "Dr. Istvan Urban DMD, MD, PhD", name: "Dr. Istvan Urban" },
  { fullText: "Dr. JB White DDS, AAID Member", name: "Dr. JB White" },
  { fullText: "Dr. Jaideep R. Deshpande MBA, Executive Director, Strategy and Marketing", name: "Dr. Jaideep R. Deshpande" },
  { fullText: "Dr. James Fetsch Fellow Academy of General Dentistry - Implant Specialist", name: "Dr. James Fetsch" },
  { fullText: "Dr. James Nager DMD, Associate Fellow AAID", name: "Dr. James Nager" },
  { fullText: "Dr. Janice Wang DDS, ABOI/ID Diplomate, AAID Fellow", name: "Dr. Janice Wang" },
  { fullText: "Dr. Jason Kim DDS, AAID Fellow, ABOI/ID Diplomate", name: "Dr. Jason Kim" },
  { fullText: "Dr. Jeff Briney Comprehensive Dentistry & Laser Specialist", name: "Dr. Jeff Briney" },
  { fullText: "Dr. Jim Janakievski DDS, MSD", name: "Dr. Jim Janakievski" },
  { fullText: "Dr. John Minichetti DMD, DABOI/ID, Fellow AAID", name: "Dr. John Minichetti" },
  { fullText: "Dr. John Sorensen Prosthodontist", name: "Dr. John Sorensen" },
  { fullText: "Dr. Jonathan Tsang DMD, DABOI/ID", name: "Dr. Jonathan Tsang" },
  { fullText: "Dr. Joseph Leonetti DMD, DABOI/ID, FAAID", name: "Dr. Joseph Leonetti" },
  { fullText: "Dr. Junji Tagami DDS, PhD", name: "Dr. Junji Tagami" },
  { fullText: "Dr. Kathryn Alderman Chief Executive Officer, Intelligent Care Alliance; Director, AI and Technology Integration, Dental AI Association", name: "Dr. Kathryn Alderman" },
  { fullText: "Dr. Keith Long Implant Specialist", name: "Dr. Keith Long" },
  { fullText: "Dr. Kwan M. Lee DDS, DABOI, DICOI", name: "Dr. Kwan M. Lee" },
  { fullText: "Dr. Laura Williams Professor", name: "Dr. Laura Williams" },
  { fullText: "Dr. Lily Hu DMD, Board-Certified Anesthesiologist", name: "Dr. Lily Hu" },
  { fullText: "Dr. Loren Israelsen DDS, Founder and CEO", name: "Dr. Loren Israelsen" },
  { fullText: "Dr. Louis K. Rafetto Office-Based Anesthesia", name: "Dr. Louis K. Rafetto" },
  { fullText: "Dr. Marco Veneziani DDS", name: "Dr. Marco Veneziani" },
  { fullText: "Dr. Markus Hurzeler DDS, PhD", name: "Dr. Markus Hürzeler" },
  { fullText: "Dr. Marta Revilla Leon Prosthodontist", name: "Dr. Marta Revilla León" },
  { fullText: "Dr. Martin Mendelson Professional Development", name: "Dr. Martin Mendelson" },
  { fullText: "Dr. Matthew Fay Sleep Medicine Specialist", name: "Dr. Matthew Fay" },
  { fullText: "Dr. Matthew Fien DDS", name: "Dr. Matthew Fien" },
  { fullText: "Dr. Michael A. Pikos Full-Arch Therapy", name: "Dr. Michael A. Pikos" },
  { fullText: "Dr. Michael Cohen Periodontal & Implant Specialist - Founder of Seattle Study Club", name: "Dr. Michael Cohen" },
  { fullText: "Dr. Michael D. Scherer Full-Arch Implantology", name: "Dr. Michael D. Scherer" },
  { fullText: "Dr. Michael R. Andersen Prosthodontist & Maxillofacial Prosthetist", name: "Dr. Michael R. Andersen" },
];

async function uploadHeadshotsToStorage() {
  const docPath = path.join(process.cwd(), 'attached_assets', 'SpeakerSphere Headshots 1-100_1763501090851.docx');
  
  console.log('Extracting images from Word document...');
  
  // Extract images using AdmZip
  const zip = new AdmZip(docPath);
  const zipEntries = zip.getEntries();
  
  const imageEntries = zipEntries.filter(entry => 
    entry.entryName.startsWith('word/media/') && 
    (entry.entryName.endsWith('.jpg') || 
     entry.entryName.endsWith('.jpeg') || 
     entry.entryName.endsWith('.png'))
  );
  
  console.log(`Found ${imageEntries.length} images in document`);
  console.log(`Have ${speakerMappings.length} speaker mappings`);
  
  if (!publicPath) {
    throw new Error("PUBLIC_OBJECT_SEARCH_PATHS environment variable is not set");
  }
  
  let uploadCount = 0;
  let updateCount = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < Math.min(imageEntries.length, speakerMappings.length); i++) {
    const imageEntry = imageEntries[i];
    const mapping = speakerMappings[i];
    
    try {
      // Find speaker in database
      const [speaker] = await db
        .select()
        .from(speakers)
        .where(eq(speakers.name, mapping.name))
        .limit(1);
      
      if (!speaker) {
        errors.push(`Speaker not found in database: ${mapping.name}`);
        continue;
      }
      
      // Upload image to object storage
      const imageBuffer = imageEntry.getData();
      const ext = path.extname(imageEntry.entryName);
      
      // Determine content type
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      
      // Generate unique filename
      const objectId = randomUUID();
      const fullPath = `${publicPath}/speaker-images/${objectId}${ext}`;
      
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Upload the file
      await file.save(imageBuffer, {
        metadata: {
          contentType,
        },
      });
      
      uploadCount++;
      
      // Update speaker record with the new image URL
      const imageUrl = `/api/speaker-images/${objectId}${ext}`;
      await db
        .update(speakers)
        .set({ imageUrl })
        .where(eq(speakers.id, speaker.id));
      
      updateCount++;
      
      console.log(`✓ ${i + 1}/${speakerMappings.length}: ${mapping.name} -> ${imageUrl}`);
      
    } catch (error) {
      const errMsg = `Failed to process ${mapping.name}: ${error}`;
      errors.push(errMsg);
      console.error(`✗ ${errMsg}`);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Images uploaded: ${uploadCount}`);
  console.log(`Speakers updated: ${updateCount}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n=== Errors ===`);
    errors.forEach(err => console.log(`  - ${err}`));
  }
}

// Run the upload
uploadHeadshotsToStorage()
  .then(() => {
    console.log('\n✅ Upload complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  });
