# replit.md

## Overview
This project is a full-stack healthcare speaker review platform, "SpeakerSphere Reviews," designed to connect healthcare professionals with medical speakers. It enables users to discover, browse, search, and review speakers across various healthcare specialties. The platform aims to be a comprehensive resource for evaluating speaker quality, facilitating bookings, and showcasing speaker expertise through detailed profiles and video portfolios. Its core capabilities include advanced speaker discovery, a multi-dimensional review system, and direct inquiry management, supporting the business vision of becoming a leading platform for healthcare speaker evaluation and booking.

## Recent Changes (January 2025)
- **Critical Admin Bug Fix**: Resolved "db is not defined" error in admin-routes.ts preventing bulk speaker operations (January 13, 2025)
- **Admin Panel Functionality Restored**: Fixed bulk contact and ratings visibility controls that were failing due to missing database imports
- **Social Media Batch Update Complete**: Successfully processed 244 social media records, updating 191 speakers with Instagram, LinkedIn, Facebook, and X/Twitter handles
- **Enhanced Social Media Coverage**: Platform now has 379 speakers with LinkedIn (68%), 209 with Instagram (37.5%), 76 each with Facebook and X/Twitter (13.6%)
- **Social Media Analytics**: Reduced speakers without social media presence to 144 (26%) with comprehensive handle extraction from social media URLs
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