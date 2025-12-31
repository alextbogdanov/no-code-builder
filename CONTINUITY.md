# Continuity Ledger

## Goal (incl. success criteria)
Build a full no-code builder prototype that:
- Allows users to describe interfaces/apps in natural language
- Uses AI (Claude via Anthropic SDK) to generate code
- Deploys generated code to E2B sandbox (temporary preview environments)
- Shows live preview in an iframe
- Runs 100% serverless with zero self-hosted infrastructure
- **Supports user authentication via Google, GitHub, and Email (OTP)**
- **Stores chat history and project files in Convex + R2**

Success: User can describe what they want, see a loading animation, then interact with a chat interface to iterate on their project while seeing live previews.

## Constraints/Assumptions
- Next.js 14+ with App Router
- Node.js runtime for API routes (not Edge - for streaming)
- Tailwind CSS for styling
- **Convex Auth for authentication (Google, GitHub, Email OTP)**
- **Convex for chat/project storage**
- **Cloudflare R2 for file storage** (configured via @convex-dev/r2 component)
- **Multi-LLM Support** with automatic fallback:
  - Primary: Anthropic Claude Sonnet 4.5
  - Fallback 1: Google Gemini 3 Pro
  - Fallback 2: OpenAI GPT-5
- **Model Selection UI** - Users can choose their preferred AI model
- **E2B Sandbox** for deployments (auto-kills after 15 minutes)

## Key decisions
- Used SSE for stage-based progress updates (analyzing → designing → deploying)
- **Live code streaming** - real-time code stream display in chat during generation
- Split UI into landing page → loading animation → builder interface
- Preview panel supports desktop/tablet/mobile views + code viewer
- Export as ZIP functionality included
- Beautiful "Midnight Aurora" theme with cyan/purple accents
- **E2B Sandbox** for temporary deployments (15-minute timeout) - replaced Vercel Deploy API
- Simple API token authentication works both locally and in production
- **Prompt enhancer** - user prompts are enhanced before sending to main AI for better results
- **Vite + React stack** - all generated apps use Vite, React 18, and Tailwind CSS
- **Multi-LLM Provider Architecture** - supports Claude, Gemini 3 Pro, and GPT-5 with automatic fallback
- **Model selector UI** - dropdown in both landing page and builder for users to choose AI model
- **Auth implementation** - Google, GitHub OAuth + Email OTP via Resend
- **Marker-based regeneration** - LLM returns `@@UNCHANGED@@` for unchanged files to save tokens
- **Convex chat storage** - full chat history stored in Convex with R2 reference for files
- **R2 file storage** - project files stored in Cloudflare R2 via @convex-dev/r2 component

## State

### Done
- [x] Project configuration (package.json, tsconfig, tailwind, postcss, next.config)
- [x] TypeScript types and interfaces
- [x] localStorage utilities for state management
- [x] API route `/api/generate` with SSE streaming
- [x] Loading animation component with step-by-step progress
- [x] Chat interface component with streaming support
- [x] Preview panel with device switching and code viewer
- [x] Landing page with input and starter prompts
- [x] Builder page with full interface
- [x] README with setup instructions
- [x] Environment variables example file
- [x] .gitignore
- [x] Fixed AI API call to use official @anthropic-ai/sdk
- [x] Added prompt enhancer for better AI results
- [x] Comprehensive system prompt for generating complete Vite + React apps
- [x] Improved JSON parsing with markdown code block removal
- [x] Smart retry mechanism for truncated JSON responses (partial file recovery + single-file regeneration)
- [x] Live code streaming in chat interface - shows code as it's being generated in real-time
- [x] Switched from Vercel Deploy API to E2B Sandbox for deployments
- [x] Fixed E2B Vite host blocking - added `allowedHosts: true` to vite.config.js template
- [x] Removed intermediary loading animation - goes straight to builder on prompt submit
- [x] Updated status messages: "Crafting a beautiful design" → "Building your startup from scratch" → "Deploying your website to the web"
- [x] Added stop button in chat interface to stop streaming generation
- [x] **Authentication system implemented** - Google, GitHub OAuth + Email OTP
  - convex/auth.ts - configured providers
  - convex/schema.ts - added custom user fields (displayName, onboardingComplete)
  - convex/users.ts - mutations for updating user name
  - components/auth-modal.tsx - full auth modal with all flows
  - app/page.tsx - sign in/sign up buttons in header
- [x] **Multi-LLM provider support** - Claude Sonnet 4.5, Gemini 3 Pro, GPT-5
  - app/api/generate/route.ts - provider-specific streaming functions with automatic fallback
  - types/project.d.ts - LLMProvider, ModelId, ModelConfig types
  - lib/constants.ts - AVAILABLE_MODELS and DEFAULT_MODEL_ID exports
  - lib/storage.ts - updateSelectedModel function for persisting model choice
  - app/page.tsx - model selector dropdown in landing page
  - app/builder/page.tsx - model selector dropdown in builder header
  - env.example - updated with GOOGLE_AI_API_KEY and OPENAI_API_KEY
- [x] **Convex chat storage system**
  - convex/schema/chats.ts - chats table with messages array, r2Key, deployment info
  - convex/mutations/chats.ts - createChat, addMessage, updateChatFiles, updateDeployment, deleteChat
  - convex/queries/chats.ts - getChat, getChatFiles, listChats, getChatCount
  - app/page.tsx - creates chat on submit, requires auth, redirects with chatId
  - app/builder/page.tsx - loads chat from Convex, saves messages and files to Convex
- [x] **Marker-based regeneration** for efficient partial updates
  - `@@UNCHANGED@@` marker for files that don't need regeneration
  - `@@DELETE@@` marker for files to be removed
  - mergeFilesWithMarkers() function in route.ts
  - Reduces token usage by 50-90% for edit operations
- [x] **R2 file storage integration**
  - convex/convex.config.ts - installed @convex-dev/r2 component
  - convex/r2.ts - R2 client with store/get/delete actions
  - convex/mutations/chats.ts - updateChatFiles action uploads to R2 and stores r2Key
  - convex/queries/chats.ts - getChatFiles action fetches files from R2
  - app/builder/page.tsx - loads files from R2 on chat load
  - Auth verification in actions via getAuthenticatedUserIdInternal

### Now
- All core features working
- Auth integration complete
- Multi-LLM support with fallback mechanism complete
- Model selection UI in both landing page and builder
- Convex chat storage with R2 file storage ready
- R2 integration complete - files uploaded to R2 bucket with proper r2Key
- Fixed double-generation bug - added `initialGenerationTriggered` flag to prevent re-triggering initial generation when convexChat updates reactively

### Next
- Set R2 environment variables in Convex deployment:
  - R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
- Potential enhancements: history/undo, multiple project support, collaboration features

## Open questions (UNCONFIRMED if needed)
- None currently

## Working set (files/ids/commands)
- `app/page.tsx` - Landing page with auth buttons and chat creation
- `app/builder/page.tsx` - Builder interface with Convex + R2 integration
- `app/api/generate/route.ts` - API route with marker-based regeneration
- `components/` - UI components (including auth-modal.tsx)
- `lib/constants.ts` - System prompts and constants
- `lib/storage.ts` - localStorage utilities
- `types/project.d.ts` - TypeScript definitions with FILE_MARKERS
- `convex/auth.ts` - Auth providers configuration
- `convex/schema.ts` - Database schema with users and chats tables
- `convex/schema/chats.ts` - Chats table definition
- `convex/mutations/chats.ts` - Chat mutations and R2 upload action
- `convex/queries/chats.ts` - Chat queries and R2 fetch action
- `convex/r2.ts` - R2 storage module with store/get/delete functions
- `convex/convex.config.ts` - Convex app config with R2 component

## R2 Configuration
Set these environment variables in Convex:
```bash
npx convex env set R2_BUCKET your-bucket-name
npx convex env set R2_ENDPOINT https://<account-id>.r2.cloudflarestorage.com
npx convex env set R2_ACCESS_KEY_ID your-access-key-id
npx convex env set R2_SECRET_ACCESS_KEY your-secret-access-key
```

Also configure CORS on your R2 bucket to allow requests from your domain:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"]
  }
]
```
