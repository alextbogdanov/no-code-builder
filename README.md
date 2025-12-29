# NoCode Builder

A powerful no-code builder that uses AI to generate and deploy web applications in real-time. Describe what you want to build, and watch it come to life.

![NoCode Builder](https://via.placeholder.com/800x400?text=NoCode+Builder)

## Features

- 🤖 **AI-Powered Generation**: Describe your vision in plain English and let AI create the code
- ⚡ **Instant Deployment**: See your creation live on Vercel in seconds
- 💬 **Chat Interface**: Iterate on your design with a conversational interface
- 📱 **Responsive Preview**: Preview your app on desktop, tablet, and mobile
- 📥 **Export Ready**: Download your project as a ZIP file anytime
- 🔄 **Real-time Streaming**: Watch the AI generate code in real-time

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Animations**: Framer Motion
- **AI**: Claude (Anthropic API)
- **Sandbox**: [@vercel/sandbox](https://vercel.com/docs/vercel-sandbox) - Ephemeral compute for running generated code
- **State**: localStorage for persistence

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Vercel account
- An Anthropic API key (for Claude)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd mvp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment example file:
   ```bash
   cp env.example .env.local
   ```

4. Fill in your API keys in `.env.local`:
   ```env
   # Anthropic API key for Claude
   AI_API_KEY=sk-ant-your-api-key-here
   ```

5. Set up Vercel Sandbox authentication (for local development):
   ```bash
   npx vercel sandbox login
   ```
   This downloads a development OIDC token that expires after 12 hours.

### Getting Your API Keys

#### Anthropic API Key (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy and paste it into `AI_API_KEY`

#### Vercel Sandbox Authentication
The `@vercel/sandbox` SDK uses Vercel OIDC tokens for authentication:

**Local Development:**
```bash
npx vercel sandbox login
```
This downloads a development token to your environment. The token expires after 12 hours.

**Production (on Vercel):**
Vercel automatically manages OIDC tokens when deployed to Vercel. No manual configuration needed.

### Running Locally

Start the development server:

```bash
npm run dev
```

Or use Vercel CLI for a more production-like environment:

```bash
npx vercel dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deploying to Vercel

1. Push your code to a Git repository

2. Import the project in Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel will auto-detect Next.js

3. Add environment variables:
   - Go to Project Settings → Environment Variables
   - Add `AI_API_KEY` with your Anthropic key
   - Vercel Sandbox OIDC tokens are automatically provided in production

4. Deploy!

## Project Structure

```
mvp/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # Edge Function for AI generation & deployment
│   ├── builder/
│   │   └── page.tsx          # Main builder interface
│   ├── globals.css           # Global styles & Tailwind config
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── chat-interface.tsx    # Chat UI component
│   ├── loading-animation.tsx # Build progress animation
│   └── preview-panel.tsx     # Live preview & code viewer
├── lib/
│   ├── constants.ts          # App constants & prompts
│   └── storage.ts            # localStorage utilities
├── types/
│   └── project.d.ts          # TypeScript interfaces
├── env.example               # Environment template
├── tailwind.config.ts        # Tailwind configuration
└── README.md                 # This file
```

## How It Works

### 1. User Input
User describes what they want to build on the landing page. This creates a new project state stored in localStorage.

### 2. Loading Animation
A beautiful animated sequence shows the build progress while the initial generation begins.

### 3. AI Generation
The Edge Function (`/api/generate`) processes the request:
- Sends the prompt to Claude with context about the project
- Streams tokens back to the client via SSE
- Parses the response to extract files and messages

### 4. Deployment
Once files are generated:
- The Edge Function calls Vercel's Deploy API
- Creates a preview deployment with the generated files
- Returns the deployment URL to the client

### 5. Live Preview
The client receives the deployment URL and displays it in an iframe. Users can:
- View on different device sizes
- Toggle between preview and code view
- Export the project as a ZIP

### 6. Iteration
Users can continue chatting to modify the project. Each change:
- Sends the current files + new instruction to the AI
- Generates updated files
- Creates a new deployment
- Updates the preview automatically

## API Reference

### POST /api/generate

Generates code and deploys to Vercel.

**Request Body:**
```json
{
  "userMessage": "Create a landing page for a coffee shop",
  "files": {
    "index.html": "...",
    "styles.css": "..."
  },
  "projectName": "My Coffee Shop"
}
```

**Response (SSE Stream):**
```
event: status
data: {"message": "Analyzing your requirements..."}

event: token
data: "generating..."

event: files
data: {"index.html": "...", "styles.css": "..."}

event: deployment
data: {"url": "https://my-project-xxx.vercel.app"}

event: done
data: {"message": "Created a beautiful landing page with..."}
```

## Configuration

### AI Model
The default model is `claude-sonnet-4-20250514`. To use a different model, modify the model parameter in `app/api/generate/route.ts`.

### Deployment Target
By default, deployments are created as preview deployments. To modify deployment settings, update the Vercel API call in the Edge Function.

## Troubleshooting

### "AI_API_KEY is not configured"
Make sure you've added your Anthropic API key to `.env.local` or Vercel environment variables.

### "Sandbox deployment failed"
Run `npx vercel sandbox login` to authenticate for local development. In production on Vercel, authentication is automatic.

### Preview not updating
Try clicking the refresh button in the preview panel, or check the browser console for errors.

### Rate limits
Both Anthropic and Vercel have rate limits. If you hit limits, wait a few minutes before trying again.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using AI

# no-code-builder
