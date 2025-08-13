import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const filePath = path.join(__dirname, 'attached_assets', 'Social media handles for Sphere_1755098132591.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet names:', workbook.SheetNames);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON for easier processing
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log('Total rows:', data.length);
  console.log('Sample data (first 3 rows):');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
  
  // Convert to CSV for easier viewing
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  fs.writeFileSync('social_media_data.csv', csv);
  console.log('CSV file created: social_media_data.csv');
  
  // Also save as JSON for processing
  fs.writeFileSync('social_media_data.json', JSON.stringify(data, null, 2));
  console.log('JSON file created: social_media_data.json');
  
} catch (error) {
  console.error('Error reading file:', error);
}