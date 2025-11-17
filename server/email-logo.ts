// Centralized DevRight logo rotation for email templates
// This ensures consistent logo URLs and rotation logic across all email modules

import { objectStorageClient } from './objectStorage';

// Logo file paths in object storage
const LOGO_FILES = [
  'devright-logo-color.png',     // Color icon
  'devright-logo-white.png',     // White icon
  'devright-logo-tm-color.png',  // TM Color
];

// Cache for base64 encoded logos to avoid repeated file reads
let logoCache: string[] | null = null;

// Load all logos from object storage and convert to base64 data URIs
async function loadLogosAsBase64(): Promise<string[]> {
  if (logoCache) {
    return logoCache;
  }

  const publicSearchPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',').map(p => p.trim()) || [];
  if (publicSearchPaths.length === 0) {
    console.error('PUBLIC_OBJECT_SEARCH_PATHS not set, falling back to empty logos');
    return [];
  }

  const base64Logos: string[] = [];

  for (const logoFile of LOGO_FILES) {
    try {
      // Try to find the logo in public search paths
      let found = false;
      for (const searchPath of publicSearchPaths) {
        const fullPath = `${searchPath}/${logoFile}`;
        const pathParts = fullPath.split('/');
        const bucketName = pathParts[1];
        const objectName = pathParts.slice(2).join('/');

        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);

        const [exists] = await file.exists();
        if (exists) {
          // Download file contents
          const [contents] = await file.download();
          const base64 = contents.toString('base64');
          base64Logos.push(`data:image/png;base64,${base64}`);
          found = true;
          break;
        }
      }

      if (!found) {
        console.error(`Logo file not found: ${logoFile}`);
      }
    } catch (error) {
      console.error(`Error loading logo ${logoFile}:`, error);
    }
  }

  logoCache = base64Logos;
  return base64Logos;
}

// Get a random logo as base64 data URI
export async function getDevRightLogoBase64(): Promise<string> {
  const logos = await loadLogosAsBase64();
  if (logos.length === 0) {
    // Fallback: return a minimal transparent 1x1 PNG
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
  const randomIndex = Math.floor(Math.random() * logos.length);
  return logos[randomIndex];
}

// Email header with rotating DevRight logo (embedded as base64)
export async function getEmailLogoHeader(): Promise<string> {
  const logoBase64 = await getDevRightLogoBase64();
  return `
  <div style="text-align: center; padding: 20px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
    <img src="${logoBase64}" alt="DevRight Logo" style="max-width: 100px; height: auto;" />
  </div>
`;
}
