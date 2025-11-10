# replit.md

## Overview
This project, "SpeakerSphere Reviews," is a full-stack healthcare speaker review platform connecting healthcare professionals with medical speakers. Its primary purpose is to facilitate speaker discovery, evaluation, and booking. Key capabilities include advanced speaker search, a multi-dimensional review system, and direct inquiry management. The platform uses real speaking topics extracted from CSV data with 942 unique topics linked to 562 speakers, replacing generic categories with actual topic-based organization. The platform aims to be a leading resource for evaluating speaker quality, showcasing expertise through detailed profiles and video portfolios, and streamlining the booking process.

## Recent Changes
- **November 10, 2025**: Completed Stripe subscription integration - configured actual Price IDs from Stripe Dashboard, upgraded to API version 2025-10-29.clover, fixed TypeScript errors, created comprehensive webhook setup documentation (STRIPE_SETUP.md)
- **November 10, 2025**: Fixed speaker login authentication issue - created speaker profile for orphaned user account and added foreign key constraint to prevent future data integrity issues
- **November 10, 2025**: Restored 558 of 562 speaker headshots by matching original CSV data with current database using speaker names
- **November 7, 2025**: Implemented featured speaker priority sorting - Premier and Pro speakers now appear first on Find Speakers page and within category filters
- **November 7, 2025**: Assigned 30 Premier tier and 60 Pro tier speakers based on ratings and review count for homepage featured rotation
- **November 7, 2025**: Fixed Badge component console errors by implementing React.forwardRef for proper ref handling
- **November 7, 2025**: Removed Sleep Medicine category (reassigned 5 speakers and 6 topics to Anesthesia & Sedation) - now 17 core categories
- **November 7, 2025**: Completed category reorganization - consolidated platform to core categories with proper distribution of all 562 speakers
- **November 7, 2025**: Fixed 942 speaking topics using keyword-based categorization (Practice Management: 327 topics, Implant Dentistry: 119 topics, etc.)
- **November 7, 2025**: Rebuilt 4,496 speaker-topic relationships using textual analysis of speaker bio, lectures, and expertise (average 8 topics per speaker)
- **November 7, 2025**: Updated all speaker categories based on their speaking topics for accurate categorization (top categories: Practice Management: 366, Education & Training: 336, Implant Dentistry: 235)
- **November 7, 2025**: Fixed CSV parser to accept rows with missing trailing columns (relaxed from requiring 18 to just 4 essential columns)
- **November 7, 2025**: Successfully expanded speaker database from 62 to 562 speakers (exceeded 508 target) through comprehensive CSV import and event-specific imports
- **November 7, 2025**: Fixed category deduplication in database query to merge duplicate category names and combine speaker counts
- **November 6, 2025**: Completed Phase 4 - Google Analytics integration for general traffic tracking with automatic page view tracking and event tracking for key user actions
- **November 6, 2025**: Implemented GA conversion tracking for subscription upgrades, speaker inquiries, applications, and social sharing
- **November 6, 2025**: Created hybrid analytics approach: custom speaker-specific tracking for individual speaker performance + Google Analytics for platform-wide traffic insights
- **January 10, 2025**: Completed Phase 1 - Stripe subscription system integration with Pro ($29/mo or $290/yr) and Premier ($99/mo or $990/yr) tiers
- **January 10, 2025**: Implemented subscription checkout, billing portal, webhook handler, and automatic tier updates based on payment status
- **January 10, 2025**: Created subscription upgrade page with pricing comparison and monthly/annual billing toggle
- **January 10, 2025**: Added subscription tracking fields to database (stripeCustomerId, stripeSubscriptionId, subscriptionStatus, subscriptionPeriodEnd)
- **January 10, 2025**: Completed Phase 0 - Added subscription tier system with Basic (free), Pro (featured), Premier (top placement) tiers
- **January 10, 2025**: Created TierBadge component and updated homepage, speaker profiles, speaker cards, For Speakers page, and admin dashboard with tier management
- **January 9, 2025**: Fixed email verification workflow - verification links now direct to user-friendly frontend page with loading states, success messages, and automatic redirect to login
- **January 9, 2025**: Updated speaker application approval to require email verification - approved speakers now receive combined welcome email with temporary password and verification link
- **January 9, 2025**: Re-enabled email verification requirement for user profile creation
- **January 8, 2025**: Temporarily disabled email verification requirement to allow immediate user sign-in during domain setup issues
- **January 8, 2025**: Removed categories dropdown from search bar to prevent redundancy with Filter Speakers sidebar
- **December 27, 2025**: Updated Categories page to display real speaking topics from CSV data instead of generic categories
- **December 27, 2025**: Added speaking_topics and speaker_topics database tables with 942 unique topics from speaker database
- **December 27, 2025**: Implemented topic-based speaker organization system with API endpoints for topics and speaker-topic relationships
- **December 27, 2025**: Populated database with real speaker topics data linking speakers to their specific speaking subjects

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool.
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack React Query for efficient server state management.
- **UI Components**: Built with shadcn/ui on top of Radix UI primitives, styled using Tailwind CSS with custom design tokens.
- **Forms**: Managed with React Hook Form, integrated with Zod for validation.
- **UI/UX Decisions**: Employs a monorepo structure for shared schemas, a component-based UI, and a responsive mobile-first design. Focuses on consistent presentation of speaker information, advanced filtering interfaces, and validated form components.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM for PostgreSQL.
- **Database Provider**: Neon serverless PostgreSQL, shared for real-time synchronization between development and production environments.
- **File Handling**: Multer for media uploads.
- **Session Management**: Configured for PostgreSQL session storage.
- **Monorepo Structure**: Shared TypeScript schemas ensure end-to-end type safety between client and server.

### System Design Choices
- **Key Design Decisions**: Monorepo architecture, end-to-end TypeScript for type safety, modular and reusable component-based UI, and responsive mobile-first design. Performance is optimized through caching and optimistic updates.
- **Core Features**: Includes comprehensive speaker discovery with search and filtering by category, location, expertise, and ratings. Provides detailed speaker profiles with video portfolios and review sections, a multi-criteria review system, and direct inquiry management for booking requests. Also incorporates an access code system for secure content sharing and download tracking.
- **Database Schema**: Central entities include Speakers (profile, ratings, expertise, verification), Reviews (multi-criteria), Inquiries (booking requests), Categories, Videos, ContentAccessCodes, and ContentDownloads.

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
- **Perplexity AI**: Used for enhanced search functionality.
- **Multer**: Used for file upload handling.
- **Google Analytics**: Used for platform-wide traffic and conversion tracking.
- **Stripe**: Payment processing for subscription tiers.

## Analytics & Tracking

### Hybrid Analytics Approach
The platform uses a dual analytics system:

1. **Custom Analytics** (Speaker-Specific Metrics)
   - Tracks individual speaker performance metrics
   - Stored in PostgreSQL database
   - Visible to individual speakers in their dashboard
   - Includes: profile views, video plays, contact clicks, inquiry submissions, social shares
   - Located in: `client/src/lib/analytics.ts` (custom tracking functions)

2. **Google Analytics** (Platform-Wide Traffic)
   - Tracks general platform traffic and user behavior
   - Provides aggregate insights for platform performance
   - Conversion tracking for subscriptions and key events
   - Visible through Google Analytics dashboard
   - Located in: `client/src/lib/analytics.ts` (GA tracking functions)

### Google Analytics Setup

**Configuration:**
1. Add your GA4 Measurement ID to your Replit Secrets:
   - Secret name: `VITE_GA_MEASUREMENT_ID`
   - Value: Your GA4 Measurement ID (format: `G-XXXXXXXXXX`)

2. The GA script automatically loads in `client/index.html` when the environment variable is set

**Tracked Events:**
- **Page Views**: Automatic tracking on all route changes
- **Speaker Interactions**: Profile views, contact clicks, inquiry submissions
- **Search & Discovery**: Search queries, category filtering, location filtering
- **Applications**: Speaker application submissions (success/failure)
- **Social Sharing**: LinkedIn, Twitter, Facebook, native share, copy link
- **Subscriptions**: Checkout initiation, purchase completion, tier upgrades
- **Video Engagement**: Video plays with speaker and video IDs
- **Reviews**: Review submissions with ratings

**Implementation Details:**
- GA tracking is optional and gracefully degrades if not configured
- All tracking functions check `isGAEnabled()` before sending events
- Event parameters follow GA4 recommended event structure
- Conversion events use consistent naming for e-commerce tracking

**Files:**
- `client/index.html`: GA script loader
- `client/src/lib/analytics.ts`: GA helper functions and event definitions
- `client/src/App.tsx`: Automatic page view tracking
- Integration points: speaker-profile.tsx, for-speakers.tsx, social-share.tsx, subscription-upgrade.tsx