# Continuity Ledger

## Goal (incl. success criteria)
Build a full no-code builder prototype that:
- Allows users to describe interfaces/apps in natural language
- Uses AI (Claude via Anthropic SDK) to generate code
- Deploys generated code to E2B sandbox (temporary preview environments)
- Shows live preview in an iframe
- Runs 100% serverless with zero self-hosted infrastructure

Success: User can describe what they want, see a loading animation, then interact with a chat interface to iterate on their project while seeing live previews.

## Constraints/Assumptions
- Next.js 14+ with App Router
- Node.js runtime for API routes (not Edge - for streaming)
- Tailwind CSS for styling
- No authentication (for now)
- localStorage for state persistence
- **Anthropic AI SDK** as the AI provider (using claude-sonnet-4-5) for high-quality code generation
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
- **Anthropic SDK for inference** - using claude-sonnet-4-5 for high-quality code generation

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

### Now
- **E2B Sandbox integration** - replacing Vercel with E2B temporary sandboxes:
  - Using `@e2b/code-interpreter` SDK
  - 15-minute auto-timeout for sandboxes
  - Uploads generated files, runs npm install + npm run dev
  - Returns sandbox URL for live preview
- **Anthropic SDK** for all AI operations:
  - Using `claude-sonnet-4-5` model
  - Streaming support for real-time code generation
  - Both prompt enhancer and main code generation use Anthropic

### Next
- Test E2B sandbox integration end-to-end
- Handle sandbox URL display in preview panel
- Potential enhancements: history/undo, multiple project support, collaboration features

## Open questions (UNCONFIRMED if needed)
- E2B sandbox port/URL format for accessing the running dev server
- Consider detecting if original response had MORE files after the truncated one (currently only regenerates the incomplete file)

## Working set (files/ids/commands)
- `app/page.tsx` - Landing page
- `app/builder/page.tsx` - Builder interface
- `app/api/generate/route.ts` - API route with E2B sandbox deployment
- `components/` - UI components
- `lib/constants.ts` - System prompts and constants
- `lib/storage.ts` - localStorage utilities
- `types/` - TypeScript definitions
