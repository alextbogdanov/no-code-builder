# NoCode Builder

A powerful no-code builder that uses AI to generate and deploy web applications in real-time. Describe what you want to build, and watch it come to life.

![NoCode Builder](https://via.placeholder.com/800x400?text=NoCode+Builder)

## Features

- 🤖 **AI-Powered Generation**: Describe your vision in plain English and let AI create the code
- ⚡ **Instant Preview**: See your creation live in an E2B sandbox in seconds
- 💬 **Chat Interface**: Iterate on your design with a conversational interface
- 📱 **Responsive Preview**: Preview your app on desktop, tablet, and mobile
- 📥 **Export Ready**: Download your project as a ZIP file anytime
- 🔄 **Real-time Streaming**: Watch the AI generate code in real-time

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Animations**: Framer Motion
- **AI**: Claude (Anthropic SDK) - using claude-sonnet-4-5
- **Sandbox**: [E2B](https://e2b.dev/) - Ephemeral sandboxes for running generated code (auto-terminates after 15 minutes)
- **State**: localStorage for persistence

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key (for Claude)
- An E2B API key (for sandboxes)

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
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   
   # E2B API key for sandboxes
   E2B_API_KEY=your-e2b-api-key-here
   ```

### Getting Your API Keys

#### Anthropic API Key (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy and paste it into `ANTHROPIC_API_KEY`

#### E2B API Key
1. Go to [e2b.dev/dashboard](https://e2b.dev/dashboard)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy and paste it into `E2B_API_KEY`

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deploying to Production

1. Push your code to a Git repository

2. Import the project to your hosting platform (Vercel, Netlify, etc.):
   - Go to your platform's dashboard
   - Import your repository
   - The platform will auto-detect Next.js

3. Add environment variables:
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `E2B_API_KEY` - Your E2B API key

4. Deploy!

## Project Structure

```
mvp/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # API route for AI generation & E2B deployment
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
The API route (`/api/generate`) processes the request:
- Enhances the user's prompt for better results
- Sends the prompt to Claude with context about the project
- Streams tokens back to the client via SSE
- Parses the response to extract files and messages

### 4. E2B Sandbox Deployment
Once files are generated:
- Creates a new E2B sandbox instance
- Uploads all generated files (Vite + React + Tailwind stack)
- Runs `npm install` and `npm run dev`
- Returns the sandbox URL for live preview
- Sandbox auto-terminates after 15 minutes of inactivity

### 5. Live Preview
The client receives the sandbox URL and displays it in an iframe. Users can:
- View on different device sizes
- Toggle between preview and code view
- Export the project as a ZIP

### 6. Iteration
Users can continue chatting to modify the project. Each change:
- Sends the current files + new instruction to the AI
- Generates updated files
- Creates a new sandbox deployment
- Updates the preview automatically

## API Reference

### POST /api/generate

Generates code and deploys to an E2B sandbox.

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
data: {"url": "https://sandbox-id.e2b.dev"}

event: done
data: {"message": "Created a beautiful landing page with..."}
```

## Configuration

### AI Model
The default model is `claude-sonnet-4-5`. To use a different model, modify the model parameter in `app/api/generate/route.ts`.

### Generated App Stack
All generated applications use:
- Vite as the build tool
- React 18 with TypeScript
- Tailwind CSS for styling

### Sandbox Timeout
E2B sandboxes automatically terminate after 15 minutes. This is a feature of E2B's ephemeral compute model and helps manage resources.

## Troubleshooting

### "ANTHROPIC_API_KEY is not configured"
Make sure you've added your Anthropic API key to `.env.local` or your deployment platform's environment variables.

### "E2B_API_KEY is not configured"
Make sure you've added your E2B API key to `.env.local` or your deployment platform's environment variables.

### "Sandbox deployment failed"
Check that your E2B API key is valid and you have available sandbox credits on your E2B account.

### Preview not updating
Try clicking the refresh button in the preview panel, or check the browser console for errors.

### Sandbox URL not loading
E2B sandboxes may take a few seconds to boot. If the preview shows a blank page, wait a moment and refresh. Also note that sandboxes auto-terminate after 15 minutes.

### Rate limits
Both Anthropic and E2B have rate limits. If you hit limits, wait a few minutes before trying again.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using AI
