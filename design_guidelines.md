# Healthcare Speaker Review Platform - Design Guidelines

## Design Approach
**System-Based with Professional Service Inspiration**: Material Design foundation combined with LinkedIn's professional credibility, Trustpilot's review clarity, and Doximity's healthcare authority. Prioritizes trust, readability, and information hierarchy.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts) - clean, professional, medical-grade readability
- **Hierarchy**:
  - Hero Headlines: 3xl to 5xl, font-weight-700
  - Section Headers: 2xl to 3xl, font-weight-600
  - Speaker Names: xl, font-weight-600
  - Body/Reviews: base, font-weight-400, leading-relaxed
  - Credentials/Metadata: sm, font-weight-500, uppercase tracking

### Layout System
**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16 (p-4, gap-6, py-12, mt-16, etc.)
- Container: max-w-7xl with px-4 to px-8 responsive padding
- Section vertical spacing: py-16 to py-24
- Card/component internal padding: p-6 to p-8
- Grid gaps: gap-6 to gap-8

## Navigation System

### Primary Navigation
**Desktop Header** (sticky, backdrop-blur):
- Horizontal navigation with logo left, links center-right, CTA button far right
- Active state: Border-b-3 with accent underline + font-weight-600 + slightly darker text
- Hover state: Lighter text color transition
- Current page indicator: Persistent underline + icon prefix (small dot or checkmark)

**Mobile Navigation** (hamburger menu):
- Active page: Full-width background highlight + left border accent (border-l-4)
- Icon indicators: Checkmark icon next to active page text
- Visual hierarchy: Active page 20% larger font-size than siblings

### Secondary Navigation (Tabs/Filters)
- Pill-style tabs with active state: Solid background fill + elevated shadow
- Inactive: Ghost outline with hover fill preview
- Underline style for category filters: 2px bottom border on active

## Component Library

### Hero Section (Full-width, 80vh on desktop, 60vh mobile)
**Large Background Image**: Professional medical conference/speaking event imagery with subtle gradient overlay (dark at bottom for text contrast)
- Centered content: max-w-4xl
- Headline + subheadline + dual CTA buttons (primary + secondary ghost)
- Trust indicators below CTAs: "10,000+ Reviews" "500+ Verified Speakers" with small icons
- Buttons on image: backdrop-blur-md with semi-transparent white/dark backgrounds

### Speaker Cards (Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Professional headshot (circular, 120px)
- Name + credentials + specialty tags
- Star rating (5-star with half-star precision) + review count
- Brief highlight quote from top review
- "View Profile" button + bookmark icon
- Hover: Subtle lift (translate-y-1) + shadow elevation

### Review Components
**Individual Review Card**:
- Reviewer info (avatar, name, role, verification badge)
- Star rating + date
- Review text with "Read more" expansion
- Helpful voting (thumbs up/down counters)
- Reply thread indicator if applicable

**Review Summary Section**:
- Overall rating (large numeral + star visualization)
- Rating breakdown bars (5-star to 1-star distribution)
- Filter options (Most Recent, Highest Rated, Verified Only)

### Search & Filter Panel
- Prominent search bar with specialty/topic autocomplete
- Filter chips (removable, pill-style)
- Dropdown filters: Location, Rating, Price Range, Availability
- Active filters display as stacked chips with X remove buttons

### Speaker Profile Layout
**Hero Section**: Speaker headshot (large, professional) + name + credentials banner
**Tabs Navigation**: Bio, Reviews, Speaking Topics, Availability, Media
- Active tab: Solid underline + bold weight
**Stats Row**: Total reviews, average rating, years experience, events spoken (4-column grid)

## Visual Patterns

### Cards & Containers
- Border: 1px subtle border (not stark)
- Border-radius: rounded-lg (8px) for cards, rounded-full for avatars/pills
- Shadows: Multi-layer subtle shadows, elevation on hover
- Spacing: Consistent p-6 internal padding

### Interactive States
**Buttons**:
- Primary: Solid fill, slight scale on hover (scale-105)
- Secondary: Outline with hover fill
- Disabled: Reduced opacity (opacity-50) + cursor-not-allowed

**Links**:
- Underline on hover with smooth transition
- Active/visited: Slightly muted color

**Form Inputs**:
- Focus: Ring with accent color (ring-2)
- Error: Red ring + error message below
- Success: Green checkmark icon right-aligned

### Trust Signals
- Verification badges (checkmark in shield icon)
- Credential displays with institution logos
- Review verification indicators
- Professional certifications as stacked pills

## Images Section

### Hero Image
**Large hero image required**: Professional medical conference scene - speaker at podium with engaged audience, warm professional lighting, sharp focus on speaker. Image should convey authority, expertise, and connection. Dimensions: 1920x1080, positioned center-center with dark gradient overlay (opacity-60) from bottom.

### Speaker Headshots
Professional studio portraits with neutral/soft backgrounds, consistent lighting. Circular crop at 300x300px minimum resolution.

### Category/Specialty Icons
Medical specialty icons (cardiology, pediatrics, surgery, etc.) as simple line-art style, 48x48px.

### Testimonial Background (if used)
Soft-focus medical environment (hospital hallway, conference room) as subtle background texture with heavy overlay.

## Page-Specific Layouts

### Homepage
- Hero with search + browse by specialty
- Featured speakers carousel (auto-rotate, 4-5 cards visible)
- Top-rated speakers grid (6-9 cards)
- Recent reviews section (3-column testimonial cards)
- How it works (3-4 step visual process)
- CTA section (centered, image background with blur)

### Speaker Directory
- Filter sidebar (left, collapsible on mobile)
- Results grid (right, 2-3 columns)
- Pagination at bottom
- Sort dropdown (top-right)

### Speaker Profile
- Image hero with overlay info
- Sticky sidebar (contact/booking CTA)
- Main content area with tabbed sections
- Related speakers carousel at bottom

### Review Submission Page
- Multi-step form (progress indicator at top)
- Star rating input (large, interactive)
- Text area with character counter
- Image upload for event photos
- Verification prompts

## Accessibility Standards
- ARIA labels on all navigation elements with current page indicators
- Focus visible states (ring-2) on all interactive elements
- Skip to content link
- Sufficient contrast ratios (WCAG AA minimum)
- Form labels always visible, never placeholder-only
- Keyboard navigation support with visual focus indicators