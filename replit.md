# replit.md

## Overview
This project, "SpeakerSphere Reviews," is a full-stack healthcare speaker review platform connecting healthcare professionals with medical speakers. Its primary purpose is to facilitate speaker discovery, evaluation, and booking. Key capabilities include advanced speaker search, a multi-dimensional review system, and direct inquiry management. The platform uses real speaking topics extracted from CSV data with 942 unique topics linked to 508 speakers, replacing generic categories with actual topic-based organization. The platform aims to be a leading resource for evaluating speaker quality, showcasing expertise through detailed profiles and video portfolios, and streamlining the booking process.

## Recent Changes
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
- **December 27, 2025**: Populated database with real speaker topics data linking 508 speakers to their specific speaking subjects

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