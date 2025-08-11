# replit.md

## Overview

This is a full-stack healthcare speaker review platform called "SpeakerSphere Reviews" (also referenced as "SpeakerConnect Pro" in UI components). The application allows users to browse, search, and review healthcare speakers and medical professionals. It's built with a modern React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens matching DevRight brand colors
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **API Integration**: Perplexity AI for enhanced search capabilities
- **File Handling**: Multer for image uploads (speakers, reviews)
- **Session Management**: Configured for PostgreSQL session storage

### Key Design Decisions
- **Monorepo Structure**: Shared TypeScript schemas between client and server
- **Type Safety**: End-to-end TypeScript with shared validation schemas
- **Component-Based UI**: Modular, reusable components following shadcn/ui patterns
- **Performance**: React Query for caching and optimistic updates
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Key Components

### Database Schema (`shared/schema.ts`)
- **Speakers**: Core entity with profile information, ratings, expertise, and verification status
- **Reviews**: Detailed multi-criteria reviews with ratings across different dimensions
- **Inquiries**: Contact forms for speaker booking requests
- **Categories**: Speaker categorization system
- **Videos**: Speaker portfolio videos with metadata

### Core Features
1. **Speaker Discovery**: Search and filter speakers by category, location, expertise, ratings
2. **Detailed Profiles**: Comprehensive speaker profiles with videos, reviews, and contact options
3. **Review System**: Multi-dimensional rating system for speaking quality assessment
4. **Inquiry Management**: Direct contact system for booking requests
5. **Video Portfolios**: Embedded video content for speaker demonstrations

### UI Components
- **Responsive Layout**: Header, footer, and page layouts optimized for all devices
- **Search Interface**: Advanced filtering with real-time search suggestions
- **Speaker Cards**: Consistent presentation of speaker information
- **Review Components**: Detailed review display with rating visualizations
- **Form Components**: Validated forms for inquiries and reviews

## Data Flow

### Speaker Discovery Flow
1. User searches/filters on homepage or speakers page
2. Frontend queries `/api/speakers` with filter parameters
3. Backend applies filters and returns paginated results
4. React Query caches results for performance
5. Speaker cards render with lazy-loaded images

### Speaker Profile Flow
1. User navigates to speaker profile via slug-based routing
2. Parallel queries fetch speaker data, reviews, and videos
3. Profile renders with tabbed interface for different content sections
4. Inquiry form allows direct contact with validation

### Review System Flow
1. Users can submit detailed reviews with multiple rating criteria
2. Reviews are validated on both client and server
3. Average ratings are calculated and cached
4. Reviews display with rich formatting and user context

## External Dependencies

### Core Libraries
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **zod**: Runtime type validation and schema definition
- **react-hook-form**: Form state management with validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### UI/UX Libraries
- **@radix-ui/***: Primitive components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility
- **lucide-react**: Icon library

### Development Tools
- **typescript**: Type safety across the stack
- **vite**: Build tool and dev server
- **drizzle-kit**: Database migration and schema management
- **esbuild**: Fast JavaScript bundler for production

### External APIs
- **Perplexity AI**: Enhanced search functionality for speaker discovery
- **Multer**: File upload handling for images and media

## Deployment Strategy

### Development Setup
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL and PERPLEXITY_API_KEY required

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles server to ESM format in `dist/`
- **Database Migrations**: Drizzle Kit handles schema changes via `db:push`

### Architecture Benefits
1. **Type Safety**: Shared schemas eliminate runtime type errors
2. **Performance**: React Query caching and Neon's serverless architecture
3. **Scalability**: Stateless backend design with database connection pooling
4. **Developer Experience**: Hot reloading, TypeScript intellisense, and component library
5. **Maintainability**: Clear separation of concerns and modular component architecture

The application is designed for healthcare industry professionals seeking to discover and evaluate medical speakers for conferences, training sessions, and educational events.

## Recent Changes

### January 24, 2025 - Comprehensive Bulk Speaker Import System Integration

- **Successfully completed bulk speaker import from dentalsymposiumhub.com**
- **Imported 29 new speakers automatically** with professional headshots transferred to Google Cloud Storage
- **Enhanced object storage integration** with comprehensive image handling and transfer capabilities
- **Added bulk import functionality to admin panel** with "Bulk Import Speakers" button in Speaker Accounts section
- **Implemented intelligent duplicate prevention** - 12 existing speakers were detected and skipped to prevent duplicates
- **Created comprehensive BulkSpeakerImporter service** that scrapes speaker data and transfers images from external sources
- **Enhanced admin panel with progress tracking** and detailed error handling for import operations
- **Integrated with existing speaker management system** - all imported speakers appear in standard speaker listings
- **Total speaker database now contains 91 professionals** (62 existing + 29 newly imported) with comprehensive profiles

### January 24, 2025 - Major Admin Panel Reorganization and Enhanced Separation

- **Completely reorganized admin panel with distinct "Speaker Accounts" and "Applications" sections**
- **Enhanced Speaker Accounts Management:**
  - Created dedicated section with comprehensive header and statistics
  - Added visual distinction between application-based and manually-added speakers
  - Implemented gradient card designs with enhanced visual hierarchy
  - Added detailed application timeline tracking (applied date, approved date, application ID)
  - Created separate statistics for Application-Based Accounts, Manual Accounts, and Total Speakers
  - Enhanced account management controls with improved visibility toggles

- **Enhanced Applications Review System:**
  - Created dedicated application review section with comprehensive header
  - Added detailed application status overview with color-coded statistics cards
  - Implemented enhanced application queue with detailed applicant information
  - Added comprehensive application details display (contact info, specialty, experience, topics)
  - Enhanced approval workflow with clear action buttons and status indicators
  - Added cross-navigation between Applications and Speaker Accounts tabs

- **Fixed API Parameter Order Issues:**
  - Corrected speaker application form submission API call parameter order
  - Fixed sign-in mutation parameter order in for-speakers page
  - Applications now submit successfully without unhandled promise rejections

### January 23, 2025 - Complete Speaker Application Management System

- **Created "Speaker Accounts" tab in admin panel** specifically for speakers who joined through application approval process
- Tab displays only speakers created from approved applications (currently empty as intended)
- Shows application timeline (applied date, approved date, application ID) for full traceability
- Added application-specific statistics: Active Speaker Accounts, Pending Applications, Rejected Applications
- Includes management controls for visibility and account settings specific to application-derived speakers

### January 23, 2025 - Speaker Onboarding System and Enhanced UX
- **Created comprehensive "For Speakers" page** with professional sign-in and application forms
- Added dedicated `/for-speakers` route with tabbed interface for existing speakers and new applicants
- Implemented detailed speaker application form with sections for:
  * Personal information (name, email, phone, website)
  * Professional credentials (title, specialty, experience, qualifications)
  * Speaking expertise (topics, formats, travel preferences)
  * Biography and references for verification
- **Enhanced favorite speaker authentication prompts** with beautiful modal dialogs
- Replaced toast notifications with user-friendly dialogs explaining account benefits
- Added compelling call-to-action with clear sign-in/create account options
- Fixed heart color transitions using inline styles with explicit hex colors (#ef4444 for red, #6b7280 for gray)
- Updated both speaker cards and profile pages with consistent authentication dialogs

### January 23, 2025 - Complete Favorite Speaker System Implementation
- **Implemented complete favorite speaker functionality** with authentication integration
- Added bookmark API endpoints (/api/users/:userId/bookmarks) with proper authentication middleware
- Updated speaker cards with single heart button in top-right corner with smooth color transitions
- **Fixed duplicate heart issue** - removed duplicate hearts, keeping only the overlay button
- Enhanced heart button visual feedback - transitions from gray outline to red filled when favorited
- Added scaling and hover effects for better user interaction
- Implemented authentication prompts for non-logged-in users trying to favorite speakers
- Updated profile page to display user's favorite speakers in responsive grid layout
- Added proper database persistence with userBookmarks table integration
- Fixed speaker search filter system with "Clear All" functionality
- **Added multiple category filtering** - users can now select multiple topics and see combined results
- Updated speaker counts in filter section to show accurate numbers for each category (e.g., "Periodontics (13)")
- Implemented OR logic for multiple categories - shows speakers from any selected category

### Previous Updates - Analytics and Featured Speakers
- Created comprehensive Speaker Performance Analytics component with sorting by total views (highest to lowest)
- Added alphabetical sorting for tied view counts in performance analytics
- Implemented new Performance tab in admin panel for detailed speaker analytics tracking
- Updated Featured Speakers to display maximum 16 cards with responsive grid layout (1-2-3-4 cards per row)
- Added shuffle functionality to rotate all featured speakers on each page load for fair exposure
- Shows all speakers in performance analytics even with no data (analytics populate as users interact)
- Fixed admin icon visibility by converting Link to Button with onClick handler
- Fixed Sign In button functionality by replacing Link with Button and onClick navigation
- Implemented consistent featured speaker card heights (600px fixed height with flexbox layout)
- Updated mobile menu Sign In buttons to use proper onClick handlers
- All authentication buttons now use `window.location.href = '/auth'` for reliable navigation