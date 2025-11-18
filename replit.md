## Overview
"SpeakerSphere Reviews" is a full-stack platform connecting healthcare professionals with medical speakers for discovery, evaluation, and booking. It features advanced speaker search, a multi-dimensional review system, and direct inquiry management. The platform utilizes real speaking topics extracted from CSV data, replacing generic categories with a topic-based organization. Its goal is to be a leading resource for evaluating speaker quality, showcasing expertise through detailed profiles and video portfolios, and streamlining the booking process.

## Recent Changes
- **November 18, 2025**: Migrated speaker images to Replit object storage - successfully re-hosted 357 of 565 speaker images (63%) from external URLs to Google Cloud Storage, eliminating most "Image unavailable" issues caused by external blocking
- **November 18, 2025**: Reset all speaker ratings - all speakers now have reviewCount set to 0 and overallRating set to 0.00 (previously populated reviews were test data)
- **November 18, 2025**: Implemented topic limit enforcement for basic tier speakers - basic tier speakers (those without paid subscriptions) now display only 3 randomly selected topics on their profiles, while Pro and Premier tier speakers can display all their topics
- **November 18, 2025**: Removed contact information card from all speaker profiles - email, phone, and website contact details no longer displayed on public profiles
- **November 18, 2025**: Removed speakerType badges from all speaker profiles - clinical/non-clinical designation no longer displayed in the UI
- **November 17, 2025**: Fixed review submission blocking issue - made photo upload optional in review form validation to match backend behavior (photo field was incorrectly required on frontend)
- **November 17, 2025**: Fixed review count bug - implemented automatic recalculation of speaker reviewCount and overallRating when reviews are approved or rejected in both MemStorage and DatabaseStorage classes
- **November 17, 2025**: Implemented DevRight TM Color logo embedded as base64 in all email templates - logo displays at 200px width, embedded directly in HTML to ensure visibility across all email clients
- **November 17, 2025**: Created centralized email-logo.ts module to manage logo embedding across email.ts and email-service.ts
- **November 17, 2025**: Removed speaker inquiry notification email template - all inquiries are admin-managed, speakers do not receive direct notifications regardless of tier
- **November 17, 2025**: Removed inquiry management from subscription tier features - all inquiries are managed by admin regardless of subscription level
- **November 17, 2025**: Reduced Pro tier storage limit from 300 MB to 250 MB
- **November 17, 2025**: Removed social media functionality from Featured (Pro) tier - only Premier speakers can add social media profile links to their profiles
- **November 17, 2025**: Updated subscription upgrade page to show all three tiers (Basic, Pro, Premier) for easy comparison regardless of current tier
- **November 17, 2025**: Fixed critical download bug - updated download endpoint to stream files from Replit object storage instead of local filesystem using Google Cloud Storage client
- **November 17, 2025**: Updated social media fields in speaker dashboard - Premier tier speakers see "Profile Link" labels with URL placeholders
- **November 17, 2025**: Enhanced speaker card social media links to support both handles (@username) and full profile URLs
- **November 17, 2025**: Added "Resume Subscription" feature for canceled subscriptions still within paid period, showing expiration date and allowing reactivation
- **November 14, 2025**: Added success message with "Return Home" button to speaker application page after submission
- **November 14, 2025**: Implemented "Send Credentials" feature for admins to resend login credentials to approved speakers with 10-second toast notification displaying email and password
- **November 14, 2025**: Verified complete credential workflow: speaker approval generates password, stores hash in database, sends email, and allows immediate login
- **November 13, 2025**: Redesigned speaker application to use topic-based selection - applicants now select exactly 3 speaking topics from 942 topics organized by category with search and filter capabilities
- **November 13, 2025**: Created TopicSelector component with category filtering dropdown and search functionality for easier navigation of the speaking topics database
- **November 13, 2025**: Updated admin approval workflow to automatically assign selected topics to new speakers via speakerTopics junction table and derive speaker categories from topic metadata
- **November 13, 2025**: Added /api/topics/grouped endpoint that returns all speaking topics organized by category for the application form
- **November 13, 2025**: Implemented 300 MB storage limit enforcement for Pro tier with usage display and upload prevention
- **November 13, 2025**: Removed Word and PowerPoint upload options - speakers can now only upload PDFs and images
- **November 13, 2025**: Fixed speaker profile resources tab layout with proper white background and text truncation

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Frameworks**: React 18 with TypeScript, Vite.
- **Routing**: Wouter.
- **State Management**: TanStack React Query for server state.
- **UI Components**: shadcn/ui based on Radix UI, styled with Tailwind CSS.
- **Forms**: React Hook Form with Zod validation.
- **UI/UX Decisions**: Monorepo structure, component-based UI, responsive mobile-first design, consistent speaker information presentation, advanced filtering, and validated form components.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM for PostgreSQL.
- **Database Provider**: Neon serverless PostgreSQL.
- **File Handling**: Multer for media uploads.
- **Session Management**: PostgreSQL session storage.
- **Monorepo Structure**: Shared TypeScript schemas for end-to-end type safety.

### System Design Choices
- **Key Design Decisions**: Monorepo architecture, end-to-end TypeScript, modular and reusable component-based UI, responsive mobile-first design, performance optimization via caching and optimistic updates.
- **Core Features**: Comprehensive speaker discovery (search, filter by category, location, expertise, ratings), detailed speaker profiles (video portfolios, reviews), multi-criteria review system, direct inquiry management, access code system for content sharing and download tracking.
- **Database Schema**: Includes Speakers, Reviews, Inquiries, Categories, Videos, ContentAccessCodes, and ContentDownloads.

## External Dependencies

### Core Libraries
- `@tanstack/react-query`: Server state management.
- `wouter`: Client-side routing.
- `drizzle-orm`: Type-safe ORM for PostgreSQL.
- `@neondatabase/serverless`: Serverless PostgreSQL client.
- `zod`: Runtime type validation.
- `react-hook-form`: Form state management.
- `@hookform/resolvers`: React Hook Form and Zod integration.

### UI/UX Libraries
- `@radix-ui/*`: Primitive UI components.
- `tailwindcss`: CSS framework.
- `class-variance-authority`: Component variant management.
- `clsx`: Conditional className utility.
- `lucide-react`: Icon library.

### Development Tools
- `typescript`: Type safety.
- `vite`: Build tool and dev server.
- `drizzle-kit`: Database migration and schema management.
- `esbuild`: JavaScript bundler.

### External APIs
- **Perplexity AI**: Enhanced search functionality.
- **Multer**: File upload handling.
- **Google Analytics**: Platform-wide traffic and conversion tracking.
- **Stripe**: Payment processing for subscription tiers.