# Market Analysis Flow - Technical Specification

**Date:** December 31, 2025  
**Repository:** no-code-builder  
**Source:** Ported from december/startupai

---

## User Flow

```
Landing Page → Evaluation → Builder
     ↓             ↓            ↓
Input Idea → Market     → Build App
             Analysis      (Auth Gated)
```

### Step-by-Step Journey

1. **Landing Page (`/`)**
   - User sees hero: "Turn your idea into reality"
   - Single input: "What's your Startup Idea?"
   - Character limit: 400 chars
   - Validation: Minimum 10 characters
   - On submit: Redirect to `/evaluate?idea=...`

2. **Evaluation Page (`/evaluate`)**
   - **Open to all (No auth required)**
   - Streaming AI market analysis (OpenAI GPT-4)
   - Markdown rendering with custom styling
   - FOMO elements (ported from december):
     - "Your idea is now PUBLIC" warning banner
     - Delayed view count (appears after ~12s)
     - Similar ideas count (appears after ~4s)
     - Toast notification (appears after ~2s completion)
   - Sticky CTA: "Build This Before Someone Else Does"
   - On CTA click: Check auth → Show modal if not authenticated → Redirect to builder

3. **Builder Page (`/builder`)**
   - **Auth required (Convex Auth: Google, GitHub, Email OTP)**
   - If not authenticated: Show sign-in overlay
   - Loads project state from localStorage
   - Checks for `startupIdea` and `marketAnalysis` in localStorage
   - Full builder interface with chat and preview

---

## Technical Implementation

### Files Created

```
lib/
├── evaluation-prompt.ts          # Evaluation prompt + domain list
app/api/
├── evaluate-idea/
│   └── route.ts                  # Streaming evaluation API
components/startup/
├── idea-input-form.tsx           # Idea input component
├── fomo-elements.tsx             # FOMO hooks and components
app/
├── evaluate/
│   └── page.tsx                  # Evaluation page with streaming
├── startup-idea/[slug]/
│   └── page.tsx                  # SEO page for evaluations
convex/
├── mutations/
│   └── evaluations.ts            # Evaluation CRUD
├── queries/
│   └── evaluations.ts            # Evaluation queries
```

### Files Modified

```
convex/schema.ts                  # Added evaluations table
app/page.tsx                      # Single flow only (removed direct builder)
app/builder/page.tsx              # Added auth gate
env.example                       # Clarified OpenAI requirement
```

---

## Data Flow

### Evaluation Creation

```typescript
1. User submits idea on landing page
2. Redirect to /evaluate?idea=...
3. Page reads idea from query param
4. Stores idea in sessionStorage
5. Calls POST /api/evaluate-idea
6. API creates Convex evaluation record (pending)
7. Streams OpenAI response (SSE)
8. On completion, updates Convex record (completed)
9. Returns evaluation metadata (slug, category, domains, score)
```

### Builder Transition

```typescript
1. User clicks "Start Building Now" on evaluation page
2. Check authentication:
   - If not authenticated: Show AuthModal
   - If authenticated: Continue
3. Store in localStorage:
   - startupIdea: original idea text
   - marketAnalysis: full analysis text
4. Navigate to /builder
5. Builder checks localStorage for initial prompt
6. If found, pre-fills chat with idea
```

---

## Convex Schema

```typescript
evaluations: {
  idea: string                    // Original idea text
  slug: string                    // SEO-friendly slug (unique)
  shortTitle: string | undefined  // First 60 chars
  category: string | undefined    // AI-extracted category
  analysis: string | undefined    // Full markdown analysis
  domains: string[] | undefined   // Suggested .ai domains
  score: number | undefined       // 1-10 rating
  status: "pending" | "processing" | "completed" | "failed"
  userId: Id<"users"> | undefined // Optional (null for anonymous)
  createdAt: number               // Timestamp
  updatedAt: number               // Timestamp
}
```

### Indexes

- `by_slug`: For SEO pages (`/startup-idea/[slug]`)
- `by_user`: User's evaluation history
- `by_status`: Filter completed evaluations
- `by_created`: Recent evaluations feed

---

## API Endpoints

### POST `/api/evaluate-idea`

**Request:**
```json
{
  "idea": "AI meal planning app for busy professionals"
}
```

**Response:** SSE Stream
```
data: {"type":"init","slug":"ai-meal-planning-abc123","shortTitle":"AI meal planning app for..."}

data: {"type":"chunk","content":"# Market Analysis\n\nYour AI meal planning app"}

data: {"type":"chunk","content":" targets busy professionals who value..."}

data: {"type":"done","evaluation":{"slug":"...","category":"SaaS","domains":["mealplan.ai"],"score":8.5}}
```

**Error Handling:**
- 400: Invalid input (too short/long)
- 500: OpenAI API error or server error

---

## Environment Variables Required

```bash
# Required for market analysis
OPENAI_API_KEY=sk-...

# Required for code generation
ANTHROPIC_API_KEY=sk-ant-...

# Required for live preview
E2B_API_KEY=...

# Required for database
NEXT_PUBLIC_CONVEX_URL=https://....convex.cloud

# Required for authentication (set in Convex dashboard)
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_RESEND_KEY=...              # For email OTP
AUTH_EMAIL_FROM=...
```

---

## FOMO Implementation

### View Count Hook

```typescript
useDelayedViewCount(streamingComplete: boolean)
// Returns: number | null
// Behavior:
// - Waits 10-14s after streaming completes
// - Shows "1 person viewing now"
// - Increments randomly (40% chance every 10-15s)
// - Caps at 7 views
```

### Similar Ideas Hook

```typescript
useSimilarIdeaCount(streamingComplete: boolean)
// Returns: number | null
// Behavior:
// - Waits 4s after streaming completes
// - Shows random count (2-5 similar ideas)
// - In production: Query Convex for actual count
```

### Toast Component

```typescript
<FomoToast
  isVisible={boolean}
  onAction={() => void}         // "Claim This Idea" action
  onDismiss={() => void}
  isAuthenticated={boolean}
/>
// Appears 2s after streaming completes
// Shows "Your idea is now public"
// CTA: "Claim This Idea" or "Upgrade to Make Private"
```

### Warning Banner

```typescript
<PublicWarningBanner
  viewCount={number | null}
  similarIdeaCount={number | null}
  seoSlug={string | null}
  isAuthenticated={boolean}
  onClaimClick={() => void}
/>
// Prominent warning with metrics
// "Anyone can view, copy, and build this idea"
// Shows live view count and similar ideas count
// Link to public SEO page
```

### Sticky CTA Bar

```typescript
<StickyCTABar
  onStartBuilding={() => void}
  isCreating={boolean}
/>
// Sticky at top of page
// "Build This Before Someone Else Does"
// Prominent action button
```

---

## Authentication Flow

### Convex Auth Configuration

**Providers:**
1. **Google OAuth** - Primary (fastest)
2. **GitHub OAuth** - Developer-friendly
3. **Email OTP (Resend)** - Fallback

**Onboarding Flow:**
1. User signs in via OAuth or Email
2. If `displayName` not set: Show name input modal
3. Call `updateUserName` mutation
4. Set `onboardingComplete: true`
5. Close modal and continue

**Auth Gate:**
- `/` - Open (landing)
- `/evaluate` - Open (market analysis)
- `/builder` - Protected (requires auth)
- `/startup-idea/[slug]` - Open (SEO pages)

---

## SEO Pages

### Route: `/startup-idea/[slug]`

**Purpose:**
- Public evaluation pages
- Drive organic traffic
- Social sharing

**Content:**
- Full market analysis
- Original idea
- Category badge
- Domain suggestions (if any)
- Share buttons (Twitter, LinkedIn, Copy)
- CTA: "Build This Idea"

**JSON-LD Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "AI meal planning app for...",
  "datePublished": "2025-12-31T...",
  "author": { "@type": "Organization", "name": "StartupLab" },
  "description": "Original idea text",
  "articleBody": "Full analysis text"
}
```

---

## Persistence Integration (TODO)

### Current State
- ✅ Evaluation API generates analysis
- ✅ Convex schema defined
- ❌ Evaluation not saved to Convex
- ❌ SEO pages return 404 (no data)

### Required Changes

#### Update `/api/evaluate-idea/route.ts`

Add after streaming starts:
```typescript
// Create evaluation record
const evaluationId = await convexClient.mutation(
  api.mutations.evaluations.createEvaluation,
  {
    idea: trimmedIdea,
    slug: slug,
    shortTitle: shortTitle,
  }
);

// ... streaming logic ...

// After streaming completes
await convexClient.mutation(
  api.mutations.evaluations.completeEvaluation,
  {
    id: evaluationId,
    analysis: fullContent,
    category,
    domains,
    score,
  }
);
```

#### Add Convex HTTP Client

```typescript
import { ConvexHttpClient } from "convex/browser";

const convexClient = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);
```

---

## Testing Checklist

### Landing Page
- [ ] Page loads with hero and idea input form
- [ ] Character counter updates correctly
- [ ] Submit disabled when < 10 chars
- [ ] Submit disabled when > 400 chars
- [ ] Pressing Enter submits (Shift+Enter for newline)
- [ ] Redirects to `/evaluate?idea=...` on submit

### Evaluation Page
- [ ] Loads evaluation from query param
- [ ] Shows loading state before streaming
- [ ] Streams analysis in real-time
- [ ] Markdown renders correctly (headings, lists, italics)
- [ ] FOMO elements appear after streaming:
  - [ ] View count (10-14s delay)
  - [ ] Similar ideas count (4s delay)
  - [ ] Toast notification (2s delay)
  - [ ] Warning banner visible
  - [ ] Sticky CTA bar visible
- [ ] "Edit" button allows re-analysis
- [ ] "Start Building Now" shows auth modal if not logged in
- [ ] After auth, redirects to builder with idea pre-filled

### Builder Page
- [ ] Requires authentication
- [ ] Shows sign-in overlay if not authenticated
- [ ] Loads idea from localStorage if present
- [ ] Pre-fills first message with idea
- [ ] Chat interface works
- [ ] Code generation works
- [ ] Preview updates

### SEO Pages (After Persistence)
- [ ] `/startup-idea/[slug]` loads successfully
- [ ] Shows full analysis
- [ ] Share buttons work
- [ ] Copy link copies correct URL
- [ ] JSON-LD schema present in HTML
- [ ] 404 for invalid slugs

### Authentication
- [ ] Google OAuth works
- [ ] GitHub OAuth works
- [ ] Email OTP works
- [ ] Name input modal shows for new users
- [ ] Onboarding completes correctly
- [ ] Can sign out

---

## Deployment Notes

1. **Database Migration:**
   ```bash
   cd no-code-builder
   npx convex dev  # In one terminal
   # Database tables auto-created from schema
   ```

2. **Environment Variables:**
   - Set in `.env.local` for local dev
   - Set in Vercel for production
   - Set Convex vars in Convex dashboard

3. **API Keys Required:**
   - OpenAI (market analysis)
   - Anthropic (code generation)
   - E2B (live preview)
   - Resend (email OTP)
   - Google OAuth
   - GitHub OAuth

---

## Future Enhancements

1. **Save Evaluations:**
   - Store all evaluations in Convex
   - Link to user account (if authenticated)
   - Enable "My Evaluations" page

2. **Public Feed:**
   - `/evaluations` page with recent ideas
   - Filter by category
   - Sort by score/date

3. **Domain Purchase:**
   - Namecheap integration
   - Check availability in real-time
   - Purchase .ai domains ($2,995)

4. **Analytics:**
   - Track conversion funnel
   - Evaluation → Builder → Deploy
   - Identify drop-off points

5. **Social Sharing:**
   - Open Graph meta tags
   - Twitter Card meta tags
   - Generate preview images

---

## Known Issues

1. **SEO Pages 404:** Evaluations not persisted to Convex yet
2. **FOMO Similar Count:** Currently random, needs actual DB query
3. **View Count:** Simulated, needs real-time tracking for production

---

## Support

For questions or issues:
- Check `CONTINUITY.md` for project context
- Review `/december/COMPLETE_USER_JOURNEY.md` for original flow
- Test locally before deploying

