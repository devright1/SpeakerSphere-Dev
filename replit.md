## Overview
"SpeakerSphere Reviews" is a full-stack platform connecting healthcare professionals with medical speakers for discovery, evaluation, and booking. It features advanced speaker search, a multi-dimensional review system, and direct inquiry management. The platform utilizes real speaking topics extracted from CSV data, replacing generic categories with a topic-based organization. Its goal is to be a leading resource for evaluating speaker quality, showcasing expertise through detailed profiles and video portfolios, and streamlining the booking process.

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