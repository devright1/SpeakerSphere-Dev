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
    const logoPath = join(process.cwd(), 'attached_assets', 'DevRight_TM_-_White_1774385465926.png');
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
  <div style="text-align: center; padding: 24px 20px 16px; background: #1e4347;">
    <img src="${logoBase64}" alt="DevRight Logo" style="max-width: 180px; height: auto;" />
  </div>
`;
}

export function getEmailWrapper(content: string): string {
  const logoBase64 = getDevRightLogoBase64();
  return `
  <div style="background-color: #f0f4f5; padding: 40px 20px; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(30,67,71,0.08);">
      <div style="text-align: center; padding: 28px 20px 20px; background: #1e4347;">
        <img src="${logoBase64}" alt="DevRight Logo" style="max-width: 160px; height: auto;" />
        <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 10px 0 0; letter-spacing: 0.5px;">SPEAKERSPHERE</p>
      </div>
      <div style="padding: 32px 36px;">
        ${content}
      </div>
      <div style="background: #f7fafa; padding: 20px 36px; border-top: 1px solid #e2e8e9; text-align: center;">
        <p style="color: #6b8285; font-size: 12px; margin: 0;">SpeakerSphere by DevRight &middot; <a href="https://thespeakersphere.com" style="color: #1e4347; text-decoration: none;">thespeakersphere.com</a></p>
      </div>
    </div>
  </div>
`;
}
