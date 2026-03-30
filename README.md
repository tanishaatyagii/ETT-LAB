# DocTalk

A document-centric chat application where users upload PDF documents and chat with their contents using AI.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js v5

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- GitHub and/or Google OAuth credentials (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd doctalk
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables in `.env.local`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
   - OAuth credentials (GitHub and/or Google)

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/           # NextAuth API routes
│   ├── dashboard/          # Protected dashboard route
│   ├── login/              # Login page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # MongoDB connection
│   └── utils.ts            # Utility functions
├── models/
│   └── User.ts             # Mongoose User model
├── middleware.ts           # Route protection middleware
└── ...config files
```

## Features

### Phase 1 (Current)

- ✅ User authentication (GitHub, Google OAuth)
- ✅ Protected routes with middleware
- ✅ User management with MongoDB
- ✅ Clean, minimal UI
- ✅Dashboard for managing files

### Upcoming Phases

- [ ] PDF document upload and storage
- [ ] Document processing and embedding
- [ ] AI-powered chat with document context
- [ ] Chat history management

## Authentication Setup

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Homepage URL to `http://localhost:3000`
4. Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env.local`

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add `http://localhost:3000` to Authorized JavaScript origins
4. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs
5. Copy Client ID and Client Secret to `.env.local`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
