// Centralized DevRight logo rotation for email templates
// This ensures consistent logo URLs and rotation logic across all email modules

// Array of all DevRight logo variations for rotation
const DEVRIGHT_LOGOS = [
  'https://thespeakersphere.org/api/devright-logo-1.png', // Color icon
  'https://thespeakersphere.org/api/devright-logo-2.png', // White icon
  'https://thespeakersphere.org/api/devright-logo-3.png', // TM Color
];

// Get a random logo URL from the rotation
export function getDevRightLogoUrl(): string {
  const randomIndex = Math.floor(Math.random() * DEVRIGHT_LOGOS.length);
  return DEVRIGHT_LOGOS[randomIndex];
}

// Email header with rotating DevRight logo
export function getEmailLogoHeader(): string {
  const logoUrl = getDevRightLogoUrl();
  return `
  <div style="text-align: center; padding: 20px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
    <img src="${logoUrl}" alt="DevRight Logo" style="max-width: 100px; height: auto;" />
  </div>
`;
}
