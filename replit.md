## Overview
"SpeakerSphere Reviews" is a full-stack platform connecting healthcare professionals with medical speakers for discovery, evaluation, and booking. It features advanced speaker search, a multi-dimensional review system, and direct inquiry management. The platform utilizes real speaking topics extracted from CSV data, replacing generic categories with a topic-based organization. Its goal is to be a leading resource for evaluating speaker quality, showcasing expertise through detailed profiles and video portfolios, and streamlining the booking process.

## Recent Changes
- **July 8, 2026**: Added a Topics section to the speaker profile page's Discipline block — previously the page fetched each speaker's actual assigned topics (`/api/speakers/:id/topics`, tier-limited server-side) but never rendered them; now displayed as badges directly below the Discipline badge.
- **July 8, 2026**: Replaced the native browser `confirm()` popup with an in-app AlertDialog for deleting topics and disciplines in the admin Disciplines page.
- **July 8, 2026**: Fixed admin-approved speaker topic requests being invisible to every other speaker — the approval endpoint was mislabeling the new topic's `categories` row with the discipline's own name instead of the topic's name (so it never appeared as its own selectable item), and separately the nightly discipline/category seed sync was deleting any dynamically-created category on every server restart since it only preserves categories from the hardcoded list. Added an `isCustom` flag to `categories` so admin-approved topics survive the sync and are selectable by any speaker in that discipline; backfilled the 3 previously-approved test topic requests so they now appear correctly.
- **July 1, 2026**: Merged 25 duplicate speaker profile pairs (50 rows → 25 canonical records) that were inflating discipline counts — same person had two speaker IDs (e.g. "Dr. John Smith" and "John Smith"), typically from separate CSV import passes; kept the record with the more complete bio as canonical, reassigned all referencing rows (speakerInteractions, userLikes, userBookmarks, images, etc.) to the canonical ID before deleting the duplicate; also deduplicated `server/discipline-source-data.ts` itself (removed 21 redundant name-variant rows, resolving 3 name pairs that had conflicting target disciplines by matching whichever variant was kept as canonical in the DB) so future re-runs of the discipline migration won't cross-contaminate two DB records that share a normalized name. Post-cleanup discipline counts now track the spreadsheet closely (Periodontics 150, Miscellaneous 101, Oral Surgery 98, Prosthodontics 92, General Dentistry 45, Orthodontics 15, Dental Lab 9, Dental Hygiene 7, Pediatrics 5, Endodontics 1).
- **July 1, 2026**: Replaced algorithmic speaker-discipline matching with the client's authoritative name→discipline spreadsheet as ground truth — added `server/discipline-source-data.ts` (548-row embedded mapping) and `applyAuthoritativeDisciplineAssignments()` in `server/seed-disciplines.ts`, run on every startup before the best-effort auto-matcher so it always wins and survives future re-migrations/checkpoint restores/admin bulk actions; ships to production on next deploy since the startup logic runs there too.
- **June 30, 2026**: Fixed production speaker-discipline tagging — reapplied the improved exact-name discipline matching (multi-discipline support via `speakerDisciplineIds`, accurate `getDisciplines`/`/api/disciplines/:id/speakers` counts) that had been lost to a checkpoint restore; reapplied the unrelated speaker-dashboard duplicate topic-section cleanup; extended the one-time startup reset in `server/index.ts` to also catch speakers stuck on a stale `disciplineMigrationStatus = "confirmed"` (set in bulk by the admin "confirm-auto" action, not real review) so every speaker missing `speakerDisciplineIds` gets recomputed with the current logic, while preserving disciplines chosen explicitly through the speaker application flow.
- **April 14, 2026**: Added review likes/dislikes and comment threads — `review_reactions` table stores thumbs-up/down per visitor (identified by localStorage UUID, no login required); toggle behavior (click again to undo); `review_comments` table stores name + comment per review; 4 new API endpoints; ReviewInteractions component renders below each approved review with live like/dislike counts, expandable comment thread, name + message inputs, and Enter-to-submit; works for both logged-in and anonymous users.
- **April 7, 2026**: Implemented Speaker Upcoming Events feature — added `speakerEvents` table (id, speakerId, eventName, eventDate, location, eventUrl); tier-gated limits (basic:0, pro:2, premier:5); full CRUD API at `/api/speakers/:id/events`; Events tab in speaker dashboard with add/edit/delete dialogs; Events tab on public speaker profile (only shown when events exist); public endpoint returns only future events; dashboard shows all events regardless of date.
- **March 23, 2026**: Implemented dual password login system — speakers can log in with both the admin-assigned password (always shown in admin panel, never changes) and a self-set password via Change Password; added `userPasswordHash` column to users table; login checks both hashes; Change Password stores new hash in `userPasswordHash` only, leaving admin password untouched; Forgot Password resets admin password and clears user-set password; admin password reset also clears user-set password
- **March 18, 2026**: Fixed speaker profile email handling — cleared 555 fake CSV-imported emails from unclaimed speaker profiles; updated link-existing endpoint to set speaker email from application; corrected Will Martin (ID 1231) and Alexander Wuensche (ID 1795) emails to match their applications; added admin endpoint `/api/admin/fix-speaker-emails` for bulk email corrections; SEO structured data now omits email for speakers with no email
- **March 18, 2026**: Added Forgot Password feature — generates cryptographically secure temporary password, emails it via branded template, only commits password change after confirmed email delivery; fixed Change Password endpoint auth (X-User-ID contains session token, not user ID — now resolves via getUserSession); fixed auth.tsx to store session token instead of user ID; removed debug middleware that logged plaintext passwords; consolidated forgot-password handler in auth-routes.ts (removed duplicate in routes.ts)
- **March 18, 2026**: Fixed "Link to Existing" button in admin application review — now triggers duplicate check API and includes speaker search box so admin can find any speaker to link; fixed link-existing backend to set application.createdSpeakerId; added `/api/admin/speaker-accounts` endpoint that properly queries users with speakerId to populate "Existing Speaker Accounts" section (speakers table has no userId — relationship goes users.speakerId → speakers.id); added Change Password feature to speaker dashboard Profile tab
- **March 17, 2026**: Bug fixes - added `credentials: 'include'` to storage usage fetch so the subscription tab loads correctly; fixed subscription status cache invalidation after cancel/reactivate to include speaker ID in query key; fixed admin bulk import to use correct result property names; added `or` to drizzle-orm imports in admin-routes; removed stale `category` field references from admin speaker creation, official-speakers.ts, and duplicate-check response; fixed TypeScript errors in admin.tsx (untyped `prev` parameters), api.ts (null check), and speaker-dashboard.tsx (Set type cast); deleted 3 leftover backup files (admin_clean.tsx, admin.tsx.backup, speaker-profile-backup.tsx)
- **December 16, 2025**: Enhanced Basic tier feature restrictions in speaker dashboard - Access Code button now fully disabled with Lock icon for Basic tier; removed Portfolio Showcase and upload limit display from Basic plan benefits; Analytics tab shows only All-Time Profile Views for Basic/Pro tiers with greyed locked cards for other metrics; social media fields visible but disabled for non-Premier tiers with upgrade toasts; added backend guard to filter out social media data on form submission for non-Premier users
- **December 15, 2025**: Added SDS Badge feature - admin can assign "SDS" or "SDS Faculty" badges to speakers from the admin Speakers tab; badges prioritize speakers within their subscription tier (SDS Faculty > SDS > no badge) in all searches and listings
- **December 9, 2025**: Removed Stripe Identity verification completely - users and speakers can now register and log in without identity verification; Stripe payment features retained for subscriptions
- **November 21, 2025**: Implemented Premier-tier-only analytics tracking system - analytics tracking and dashboard access now exclusively available to Premier tier speakers; Basic and Pro tier speakers see locked Analytics tab with UpgradePrompt component encouraging upgrade; tracking API endpoint returns `tracked:false` for non-Premier tiers and stores no data
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