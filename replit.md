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