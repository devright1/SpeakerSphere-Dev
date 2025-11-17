// DevRight logo for email templates
// Uses a single logo embedded as base64 for all emails

import { readFileSync } from 'fs';
import { join } from 'path';

// Cache for the base64 encoded logo to avoid repeated file reads
let logoBase64Cache: string | null = null;

// Load the DevRight logo and convert to base64 data URI
function getDevRightLogoBase64(): string {
  if (logoBase64Cache) {
    return logoBase64Cache;
  }

  try {
    // Read the logo file from attached_assets
    const logoPath = join(process.cwd(), 'attached_assets', 'DevRight TM - Color_1763410602237.png');
    const logoBuffer = readFileSync(logoPath);
    const base64 = logoBuffer.toString('base64');
    logoBase64Cache = `data:image/png;base64,${base64}`;
    return logoBase64Cache;
  } catch (error) {
    console.error('Error loading DevRight logo:', error);
    // Fallback: return a minimal transparent 1x1 PNG
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

// Email header with DevRight logo (embedded as base64, larger size)
export function getEmailLogoHeader(): string {
  const logoBase64 = getDevRightLogoBase64();
  return `
  <div style="text-align: center; padding: 20px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
    <img src="${logoBase64}" alt="DevRight Logo" style="max-width: 200px; height: auto;" />
  </div>
`;
}
