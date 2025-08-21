# replit.md

## Overview
This project is a full-stack healthcare speaker review platform, "SpeakerSphere Reviews," designed to connect healthcare professionals with medical speakers. It enables users to discover, browse, search, and review speakers across various healthcare specialties. The platform aims to be a comprehensive resource for evaluating speaker quality, facilitating bookings, and showcasing speaker expertise through detailed profiles and video portfolios. Its core capabilities include advanced speaker discovery, a multi-dimensional review system, and direct inquiry management, supporting the business vision of becoming a leading platform for healthcare speaker evaluation and booking.

## Recent Changes (January 2025)
- **Content Management Enhancement**: Replaced drag-and-drop with intuitive upload buttons for different file types (PDF, images, videos, documents, audio) and added comprehensive content visibility controls allowing speakers to toggle between public/private for each uploaded file (January 21, 2025)
- **Speaker Resources Integration**: Successfully implemented "Speaker Resources" tab on speaker profiles that displays only public content from approved speakers, with organized file categories and download tracking
- **Upload Interface Redesign**: Removed problematic drag-and-drop functionality that was opening PDFs in new tabs, replaced with dedicated upload cards for each file type with visual icons and clear descriptions
- **User Management System Complete**: Fixed missing user deletion and update endpoints in admin panel - users can now be successfully deleted and modified through the admin interface with real-time UI updates (January 20, 2025)
- **Admin API Endpoints Added**: Implemented missing DELETE `/api/admin/users/:id` and PATCH `/api/admin/users/:id` endpoints for complete user management functionality
- **Password Change Detection Fixed**: Resolved critical admin panel bug where password changes by users weren't being displayed correctly - admin panel now properly shows "Password Changed by User" warning instead of generated password when users update their credentials (January 20, 2025)
- **User API Endpoint Restored**: Fixed `/api/admin/users` endpoint that was failing due to storage layer conflicts - implemented direct database query to retrieve user data for password change detection
- **TypeScript Compilation Issues Resolved**: Cleaned up duplicate function implementations and variable name conflicts in database storage layer that were causing API failures
- **Real-time Password Status Detection**: Admin panel now accurately compares updatedAt vs createdAt timestamps to identify when application-based speakers have changed their original generated passwords
- **Inquiry System Fully Operational**: Fixed API endpoint mismatch and budget parsing errors - inquiry submissions now work correctly with comma-formatted numbers (January 19, 2025)
- **Budget Field Enhancement**: Added automatic cleaning of budget values to handle formats like "10,000" and "$5,000" before database storage
- **API Endpoint Correction**: Updated frontend to use correct `/api/inquiries` endpoint instead of non-existent speaker-specific endpoint
- **Speaker Fees Hidden Platform-Wide**: Removed all speaking fee displays from speaker profiles, listings, and sorting options to focus on inquiry-based communication (January 19, 2025)
- **Centralized Inquiry Management**: All speaker inquiries now route through admin panel instead of directly to speakers, with comprehensive status tracking and client communication tools
- **Speaker Login System Fixed**: Resolved authentication issues with application-based speaker accounts - added express-session middleware and corrected password hashing (January 19, 2025)
- **Credentials Display Enhanced**: Admin panel now shows persistent passwords for application-based speakers with copy functionality for easy sharing 
- **Session Management Implemented**: Added proper express-session configuration to enable speaker account login functionality
- **Speaker Application System Complete**: Fully functional approval workflow generating secure credentials for manual distribution to approved speakers
- **Performance Optimization**: Added pagination to speakers page (20 per page) to handle 557 speakers efficiently with improved loading times (January 13, 2025)
- **Featured Speakers Update**: Increased featured speakers display from 16 to 24 to better showcase larger speaker database
- **User Experience Enhancement**: Added pagination controls with Previous/Next buttons and page numbers for seamless navigation
- **Critical Admin Bug Fix**: Resolved "db is not defined" error in admin-routes.ts preventing bulk speaker operations (January 13, 2025)
- **Admin Panel Functionality Restored**: Fixed bulk contact and ratings visibility controls that were failing due to missing database imports
- **Social Media Integration Complete**: Updated 288 speakers with Instagram, LinkedIn, Facebook, and X/Twitter links with proper conditional rendering
- **Social Media Analytics**: Identified 135 speakers (24% of database) without social media links for targeted outreach campaigns
- **Major Database Expansion**: Platform now contains 557 verified medical and dental professionals, up from initial 290 speakers
- **Bulk Import Success**: Successfully imported 267 new speakers from comprehensive CSV file with automatic duplicate detection (37 duplicates skipped)
- **Professional Headshot Updates**: Updated 54 speakers with high-quality professional headshots from university websites, practice sites, and conference photography (94.7% success rate)
- **Production URL Migration**: Generated complete CSV file with all 557 speaker profile URLs using production domain (https://thespeakersphere.com)
- **Event Coverage Expansion**: Platform provides speaker discovery across 13+ major dental/medical events with comprehensive specialties including oral surgery, anesthesia, sleep medicine, digital technology, periodontology, prosthodontics, implant dentistry, and dental lab technology
- **Import System Enhancement**: Robust bulk speaker import functionality with automatic web scraping, duplicate detection, name matching algorithms, and comprehensive error handling
- **Image Quality Improvement**: Replaced local asset paths and development URLs with professional headshots from authoritative sources

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS, custom design tokens for branding
- **Forms**: React Hook Form with Zod validation
- **UI/UX Decisions**: Monorepo structure for shared schemas, component-based UI, responsive design (mobile-first), performance optimization via React Query, consistent card designs and detailed review displays. Visuals include consistent presentation of speaker information, advanced filtering interfaces, and validated form components.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM (PostgreSQL dialect)
- **Database Provider**: Neon serverless PostgreSQL
- **File Handling**: Multer for image uploads
- **Session Management**: Configured for PostgreSQL session storage
- **Monorepo Structure**: Shared TypeScript schemas between client and server for end-to-end type safety.

### System Design Choices
- **Key Design Decisions**: Monorepo structure, end-to-end TypeScript for type safety, modular and reusable component-based UI, performance optimization through caching and optimistic updates, and responsive mobile-first design.
- **Core Features**: Speaker discovery (search, filter by category, location, expertise, ratings), detailed speaker profiles (videos, reviews, contact), multi-dimensional review system, direct inquiry management for bookings, and video portfolios.
- **Database Schema**: Core entities include Speakers (profile, ratings, expertise, verification), Reviews (multi-criteria), Inquiries (booking requests), Categories, and Videos.

## External Dependencies

### Core Libraries
- `@tanstack/react-query`: Server state management and caching.
- `wouter`: Lightweight client-side routing.
- `drizzle-orm`: Type-safe database ORM.
- `@neondatabase/serverless`: Serverless PostgreSQL client.
- `zod`: Runtime type validation and schema definition.
- `react-hook-form`: Form state management with validation.
- `@hookform/resolvers`: Integration between React Hook Form and Zod.

### UI/UX Libraries
- `@radix-ui/*`: Primitive components for accessibility.
- `tailwindcss`: Utility-first CSS framework.
- `class-variance-authority`: Component variant management.
- `clsx`: Conditional className utility.
- `lucide-react`: Icon library.

### Development Tools
- `typescript`: Type safety across the stack.
- `vite`: Build tool and dev server.
- `drizzle-kit`: Database migration and schema management.
- `esbuild`: Fast JavaScript bundler for production.

### External APIs
- **Perplexity AI**: Enhanced search functionality for speaker discovery.
- **Multer**: File upload handling for images and media.