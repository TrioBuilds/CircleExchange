# CircleExchange: Phase 1 Implementation Plan

**Phase Duration**: 12 Weeks (Months 1-3)
**Target**: MVP with core marketplace functionality
**Primary Deliverables**: Web app, Android app, Core API, Admin dashboard
**Success Metrics**: 100+ users, 50+ listings, 20+ transactions, 80%+ retention

---

## Table of Contents
1. [Technical Setup & Architecture](#section-1-technical-setup--architecture)
2. [Week 1-2: Foundation](#section-2-week-1-2-foundation)
3. [Week 3-4: Community Management](#section-3-week-3-4-community-management)
4. [Week 5-8: Marketplace](#section-4-week-5-8-marketplace)
5. [Week 9-12: Transactions & Moderation](#section-5-week-9-12-transactions--moderation)
6. [Testing & Quality Assurance](#section-6-testing--quality-assurance)
7. [Deployment & Infrastructure](#section-7-deployment--infrastructure)
8. [Team & Resource Planning](#section-8-team--resource-planning)

---

## Section 1: Technical Setup & Architecture

### 1.1 Project Structure

```
circleexchange/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── env.ts
│   │   │   └── constants.ts
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   ├── seeders/
│   │   │   └── schema.sql
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── community.service.ts
│   │   │   ├── listing.service.ts
│   │   │   ├── messaging.service.ts
│   │   │   └── rating.service.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── community.controller.ts
│   │   │   ├── listing.controller.ts
│   │   │   ├── messaging.controller.ts
│   │   │   └── rating.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── community.routes.ts
│   │   │   ├── listing.routes.ts
│   │   │   ├── messaging.routes.ts
│   │   │   └── rating.routes.ts
│   │   ├── utils/
│   │   │   ├── email.ts
│   │   │   ├── jwt.ts
│   │   │   ├── hash.ts
│   │   │   └── validators.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── docker/
│   │   └── Dockerfile
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Community/
│   │   │   ├── Listing/
│   │   │   ├── Messaging/
│   │   │   └── Common/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── App.tsx
│   ├── package.json
│   └── app.json
├── docs/
│   ├── API.md
│   └── SETUP.md
├── docker-compose.yml
└── README.md
```

### 1.2 Tech Stack Selection (Modern Stack)

**Backend - Supabase Ecosystem**
- **Platform**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL 14+ (with Vector extension)
- **Authentication**: Clerk (JWT + OAuth + MFA + built-in UI)
- **Cache**: Upstash Redis (Serverless, no infrastructure)
- **Email**: Resend (Modern, developer-friendly email API)
- **Payments**: Stripe (Payment processing + subscriptions)
- **File Storage**: Supabase Storage (S3-compatible, easy integration)
- **Vector DB**: Pinecone (Managed vector embeddings for AI features)
- **Real-time Communication**: Supabase Realtime (WebSocket, no Socket.io needed)

**Frontend - Vercel + Modern React**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (5-10x faster than CRA)
- **State Management**: Redux Toolkit (simplified with RTK Query)
- **HTTP/API**: Axios with interceptors
- **Styling**: Tailwind CSS (utility-first, production-ready)
- **UI Components**: Material-UI or shadcn/ui
- **Forms**: React Hook Form + Zod (type-safe validation)
- **Authentication**: Clerk (pre-built components, no auth code needed)
- **Deployment**: Vercel (optimized React deployment, serverless functions)
- **Analytics**: PostHog (product analytics on frontend)
- **Error Tracking**: Sentry (frontend error monitoring)
- **Testing**: Jest + React Testing Library

**Mobile - React Native + Modern Services**
- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation (stack, tab, drawer)
- **State**: Redux Toolkit
- **API Client**: Axios
- **Authentication**: Clerk React Native SDK
- **Payments**: Stripe Mobile SDK (for in-app purchases)
- **Real-time**: Supabase Realtime (messages, notifications)
- **Local Storage**: AsyncStorage + SQLite (for offline)
- **Cloud Storage**: Supabase Storage SDK
- **UI**: React Native Paper (Material Design)
- **Analytics**: PostHog (mobile analytics)
- **Error Tracking**: Sentry (mobile error reporting)
- **Push Notifications**: Firebase Cloud Messaging (FCM)

**Infrastructure & DevOps - Modern Cloud Services**
- **Backend Computing**: Supabase Edge Functions (serverless)
- **Frontend Hosting**: Vercel (optimized for React/Next.js)
- **Database**: Supabase Postgres (managed, auto-scaling)
- **API Gateway**: Supabase API (built-in REST/GraphQL)
- **Domain**: Namecheap (domain registration)
- **DNS & Security**: Cloudflare (DDoS protection, CDN, SSL)
- **Version Control**: GitHub (code repository)
- **CI/CD Pipeline**: GitHub Actions → Vercel (auto-deploy on push)
- **Error/Performance Monitoring**: Sentry (errors, performance traces)
- **Product Analytics**: PostHog (user behavior, funnels, heatmaps)
- **Serverless Database**: Supabase (no ops needed)
- **Caching Layer**: Upstash Redis (serverless cache)

### 1.3 Environment Setup Checklist (Modern Setup)

```bash
# Prerequisites to install before starting
- Node.js 18+ (npm or yarn)
- Git
- VS Code / IDE
- Vercel CLI (for frontend deployment)
- Supabase CLI (for backend management)

# No need to install locally:
# - PostgreSQL (managed by Supabase)
# - Redis (managed by Upstash)
# - Docker (optional, using Supabase instead)

# Repository initialization
git init circleexchange
cd circleexchange
git config user.name "CircleExchange Team"
git config user.email "dev@circleexchange.com"

# Create main directory structure
mkdir backend frontend mobile docs
touch README.md .gitignore

# Initialize Node projects
cd backend && npm init -y
cd ../frontend && npm init -y
cd ../mobile && npm init -y
cd ..

# Install Supabase CLI for backend management
npm install -g supabase

# Install Vercel CLI for frontend deployment
npm install -g vercel

# Create Supabase project (alternative to local Docker setup)
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Note the API URL and API Key
# 4. Enable Auth providers (Google, GitHub, etc.)

# Create Clerk project (authentication)
# 1. Go to https://dashboard.clerk.com
# 2. Create new application
# 3. Generate API keys

# Create Stripe account (payments)
# 1. Go to https://stripe.com
# 2. Create account
# 3. Generate API keys (publishable + secret)

# Create Resend account (email)
# 1. Go to https://resend.com
# 2. Sign up
# 3. Verify domain or use default resend.dev domain

# Setup Cloudflare (DNS)
# 1. Add domain to Cloudflare
# 2. Update nameservers at Namecheap
# 3. Configure proxy settings

# Create Pinecone account (vector DB)
# 1. Go to https://www.pinecone.io
# 2. Create account
# 3. Create index for embeddings

# Create PostHog account (analytics)
# 1. Go to https://posthog.com
# 2. Sign up
# 3. Get project API key

# Create Sentry account (error tracking)
# 1. Go to https://sentry.io
# 2. Create organization
# 3. Create projects for frontend/backend/mobile
```

### 1.3b Environment Variables Setup

```bash
# Create .env files for each project

# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_API_KEY=your_clerk_api_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

RESEND_API_KEY=your_resend_api_key

UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token

PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=circleexchange

SENTRY_DSN=your_sentry_dsn_backend

POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_API_HOST=https://app.posthog.com

NODE_ENV=development
PORT=3000

# frontend/.env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_public_key

VITE_API_URL=http://localhost:3000

VITE_SENTRY_DSN=your_sentry_dsn_frontend

VITE_POSTHOG_API_KEY=your_posthog_api_key

# mobile/.env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

STRIPE_PUBLISHABLE_KEY=your_stripe_public_key

PINECONE_API_KEY=your_pinecone_api_key

SENTRY_DSN=your_sentry_dsn_mobile

POSTHOG_API_KEY=your_posthog_api_key
```

### 1.4 Supabase + Vercel Deployment Setup

Instead of Docker Compose, we use managed services:

```bash
# Supabase Backend Setup (managed PostgreSQL + Auth)
# 1. Create Supabase project at https://supabase.com
# 2. Initialize local Supabase (optional for development)
supabase init

# 2. Create auth providers (Google, GitHub, etc.)
# - Go to Supabase Dashboard → Authentication → Providers
# - Configure OAuth apps

# 3. Set up database schema via Supabase SQL Editor
# - Tables: users, communities, listings, conversations, messages, etc.
# - All managed by Supabase (no manual PostgreSQL needed)

# 4. Enable Realtime for specific tables (messaging, notifications)
# - Supabase Dashboard → Realtime → Add tables

# Vercel Frontend Deployment
# 1. Connect GitHub repo to Vercel
# 2. Configure environment variables
# 3. Auto-deploy on push to main branch

# Upstash Redis (for caching, if needed)
# - Created at https://console.upstash.com
# - Serverless, no infrastructure management

# Clerk Authentication Setup
# 1. Create Clerk project at https://dashboard.clerk.com
# 2. Configure sign-in & sign-up pages
# 3. Add OAuth providers
# 4. Get API keys and add to .env

# Email Setup (Resend)
# 1. Create account at https://resend.com
# 2. Verify domain (or use resend.dev for testing)
# 3. Get API key

# Payment Setup (Stripe)
# 1. Create account at https://stripe.com
# 2. Create products & prices in Stripe Dashboard
# 3. Webhooks: Create endpoint for payment events
```

**Comparison: Docker Compose vs Modern Stack**

| Aspect | Docker Compose | Modern Stack (Supabase) |
|--------|----------------|-----------------------|
| **Database** | Local PostgreSQL | Managed Supabase |
| **Auth** | JWT (DIY) | Clerk (managed) |
| **Redis** | Local Redis | Upstash (serverless) |
| **Email** | SendGrid/Nodemailer | Resend (simple API) |
| **Storage** | Local/S3 | Supabase Storage |
| **Deployment** | Manual provisioning | Vercel (auto-deploy) |
| **Scaling** | Manual | Automatic |
| **Operations** | High (manage DBs) | Low (managed services) |
| **Cost** | Server costs | Pay-per-use |
| **Time to Deploy** | Days | Hours |

**For Development (local Supabase):**

```bash
# Install Supabase local development
npm install supabase --save-dev

# Start Supabase locally (requires Docker)
supabase start

# This creates local PostgreSQL, Auth, and all other services
# Uses minimal resources vs full Docker Compose setup
```

**For Production:**

```bash
# Supabase handles everything
# - PostgreSQL (auto-scaling)
# - Auth (managed)
# - Storage (managed)
# - Realtime (managed)

# Frontend deploys to Vercel (with 1 click)
# Backend API: Supabase provides REST API out-of-box
# No manually managed servers needed
```

---

## Section 2: Week 1-2 Foundation

### 2.1 Backend Project Setup (Supabase + Clerk)

#### 2.1.1 Initialize Node Project with Modern Stack

```bash
cd backend
npm init -y
npm install @supabase/supabase-js
npm install @clerk/backend
npm install resend
npm install stripe
npm install axios
npm install dotenv
npm install zod

# Dev dependencies
npm install -D typescript ts-node nodemon prettier eslint @types/node
npm install -D @types/express @types/jest jest ts-jest
```

#### 2.1.2 TypeScript Configuration (remains mostly the same)

```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 2.1.3 Environment Configuration (Supabase + Clerk)

```typescript
// backend/src/config/env.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Clerk (replaces JWT)
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  CLERK_API_KEY: process.env.CLERK_API_KEY || '',
  
  // Resend (replaces SendGrid)
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@circleexchange.com',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Upstash Redis (replaces local Redis)
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL || '',
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN || '',
  
  // Pinecone (for AI/embeddings)
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'circleexchange',
  
  // Sentry
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  
  // PostHog
  POSTHOG_API_KEY: process.env.POSTHOG_API_KEY || '',
  
  // App URLs
  API_URL: process.env.API_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
};

// Validate required env vars
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'CLERK_SECRET_KEY'];
for (const key of required) {
  if (!config[key as keyof typeof config]) {
    console.error(`Missing required environment variable: ${key}`);
  }
}
```

#### 2.1.4 Supabase Client Setup

```typescript
// backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Use service key for backend privileges
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Anon client for RLS (Row Level Security)
export const supabaseAnon = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY
);

// Database query helper (TypeScript-safe)
export async function query<T>(
  table: string,
  options: any
): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .match(options);

  if (error) throw error;
  return data as T;
}
```

#### 2.1.5 Clerk Authentication Setup

```typescript
// backend/src/middleware/auth.ts
import { clerkMiddleware, getAuth } from '@clerk/backend';
import { Request, Response, NextFunction } from 'express';

// Middleware to attach Clerk user info to request
export const withAuth = clerkMiddleware();

// Helper to get Clerk user from request
export function getClerkUser(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

// Optional auth: user info available but not required
export const withOptionalAuth = clerkMiddleware({ 
  skip: () => true 
});
```

#### 2.1.6 Resend Email Service (replaces SendGrid)

```typescript
// backend/src/services/email.service.ts
import { Resend } from 'resend';
import { config } from '../config/env';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendVerificationEmail(
  to: string,
  verificationToken: string
) {
  const verifyUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  await resend.emails.send({
    from: config.EMAIL_FROM,
    to,
    subject: 'Verify your email - CircleExchange',
    html: `
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
) {
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  await resend.emails.send({
    from: config.EMAIL_FROM,
    to,
    subject: 'Reset your password - CircleExchange',
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  });
}
```

#### 2.1.7 Stripe Payment Integration

```typescript
// backend/src/services/stripe.service.ts
import Stripe from 'stripe';
import { config } from '../config/env';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export async function createCheckoutSession(
  userId: string,
  listingId: string,
  amount: number
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `CircleExchange Listing #${listingId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${config.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.FRONTEND_URL}/checkout/cancel`,
    metadata: {
      userId,
      listingId,
    },
  });

  return session;
}

export async function handleStripeWebhook(
  event: Stripe.Event
) {
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful payment
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Payment succeeded:', session.id);
      break;
  }
}
```

#### 2.1.8 API Routes with Clerk Auth

```typescript
// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/backend';
import { config } from './config/env';

const app = express();

// Middleware
app.use(cors({
  origin: [config.FRONTEND_URL],
  credentials: true,
}));
app.use(express.json());
app.use(clerkMiddleware()); // Attach Clerk user to request

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Protected route example
app.get('/api/v1/me', (req, res) => {
  const { userId } = req.auth;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  res.json({ userId });
});

// Error handler
app.use((err: any, req: any, res: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

export default app;
```

```typescript
// backend/src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';

// Import routes (we'll create these in subsequent weeks)
// import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';

const app: Express = express();

// Middleware
app.use(cors({
  origin: [config.FRONTEND_URL],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/users', userRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
```

#### 2.1.6 Server Entry Point

```typescript
// backend/src/index.ts
import app from './app';
import { config } from './config/env';
import { closePool } from './config/database';

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});
```

#### 2.1.7 Package.json Scripts

```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

### 2.2 Database Schema & Migrations

#### 2.2.1 Initial Database Schema

```sql
-- backend/database/schema.sql

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Communities Table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('college', 'corporate', 'apartment', 'neighborhood')),
  admin_id UUID,
  domain_list JSONB, -- For email verification
  moderation_settings JSONB, -- Custom moderation rules
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communities_admin_id ON communities(admin_id);
CREATE INDEX idx_communities_name ON communities(name);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_photo_url VARCHAR(500),
  bio TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User Communities (Membership)
CREATE TABLE IF NOT EXISTS user_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'suspended', 'banned')),
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  verification_date TIMESTAMP,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, community_id)
);

CREATE INDEX idx_user_communities_user_id ON user_communities(user_id);
CREATE INDEX idx_user_communities_community_id ON user_communities(community_id);
CREATE INDEX idx_user_communities_status ON user_communities(status);

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('email_verification', 'password_reset')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- Listings Table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  type VARCHAR(50) NOT NULL CHECK (type IN ('item', 'benefit', 'service')),
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hold', 'sold', 'expired')),
  condition VARCHAR(50), -- For items: new, like-new, good, fair
  images JSONB, -- Array of image URLs
  quantity INTEGER DEFAULT 1,
  available_quantity INTEGER DEFAULT 1,
  expiration_date TIMESTAMP,
  meeting_preference VARCHAR(50) DEFAULT 'pickup', -- pickup, delivery, digital
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_community_id ON listings(community_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_price ON listings(price);

-- Full-text search index on listings
CREATE INDEX idx_listings_search ON listings USING GIN (
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Conversations (Messaging)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'resolved')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX idx_conversations_community_id ON conversations(community_id);
CREATE UNIQUE INDEX idx_conversations_unique ON conversations(buyer_id, seller_id, listing_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB, -- Array of file URLs
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Ratings & Reviews
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  rating_type VARCHAR(50) NOT NULL CHECK (rating_type IN ('seller', 'buyer')),
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  review_text TEXT,
  categories JSONB, -- {communication: 5, honesty: 4, ...}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_listing_id ON ratings(listing_id);
CREATE INDEX idx_ratings_community_id ON ratings(community_id);
CREATE UNIQUE INDEX idx_ratings_unique ON ratings(listing_id, rater_id);

-- Trust Scores
CREATE TABLE IF NOT EXISTS trust_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  overall_score DECIMAL(5, 2) DEFAULT 0.0,
  seller_score DECIMAL(5, 2) DEFAULT 0.0,
  buyer_score DECIMAL(5, 2) DEFAULT 0.0,
  verification_score DECIMAL(5, 2) DEFAULT 0.0,
  activity_score DECIMAL(5, 2) DEFAULT 0.0,
  transaction_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  last_computed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, community_id)
);

CREATE INDEX idx_trust_scores_user_id ON trust_scores(user_id);
CREATE INDEX idx_trust_scores_community_id ON trust_scores(community_id);
CREATE INDEX idx_trust_scores_overall_score ON trust_scores(overall_score DESC);

-- Reports (Moderation)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_item_id UUID,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('listing', 'user', 'content', 'message')),
  reason VARCHAR(255),
  description TEXT,
  evidence JSONB, -- Array of attachment URLs
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to);

-- Add trigger to update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 Authentication System

#### 2.3.1 JWT Utility

```typescript
// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  communityId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
}

export function generateEmailVerificationToken(userId: string): string {
  return jwt.sign({ userId, type: 'email_verification' }, config.JWT_SECRET, {
    expiresIn: '24h',
  });
}

export function generatePasswordResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'password_reset' }, config.JWT_SECRET, {
    expiresIn: '1h',
  });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function decodeToken(token: string): any {
  return jwt.decode(token);
}
```

#### 2.3.2 Hashing Utility

```typescript
// backend/src/utils/hash.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### 2.3.3 Auth Middleware

```typescript
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      req.user = payload;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
```

#### 2.3.4 Auth Service

```typescript
// backend/src/services/auth.service.ts
import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken, generateEmailVerificationToken, verifyToken } from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  communityId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    try {
      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [input.email]);
      
      if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      const userId = uuidv4();
      await query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, input.email, passwordHash, input.firstName, input.lastName]
      );

      // If community provided, add user to community
      if (input.communityId) {
        const communityId = uuidv4();
        await query(
          `INSERT INTO user_communities (id, user_id, community_id, status)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), userId, input.communityId, 'pending']
        );
      }

      // Generate verification token
      const verificationToken = generateEmailVerificationToken(userId);

      // Store token in database
      await query(
        `INSERT INTO verification_tokens (id, user_id, token, token_type, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          uuidv4(),
          userId,
          verificationToken,
          'email_verification',
          new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        ]
      );

      return {
        userId,
        email: input.email,
        verificationToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(token: string) {
    try {
      const decoded = verifyToken(token);
      
      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      // Update user
      await query('UPDATE users SET email_verified = true WHERE id = $1', [decoded.userId]);

      // Delete token
      await query('DELETE FROM verification_tokens WHERE token = $1', [token]);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async login(input: LoginInput) {
    try {
      // Find user
      const result = await query('SELECT * FROM users WHERE email = $1', [input.email]);
      
      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      // Verify password
      const isPasswordValid = await comparePassword(input.password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Check if email verified
      if (!user.email_verified) {
        throw new Error('Email not verified. Please check your email for verification link.');
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(userId: string) {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePhotoUrl: user.profile_photo_url,
        bio: user.bio,
        phone: user.phone,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
```

#### 2.3.5 Auth Controller

```typescript
// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, communityId } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        communityId,
      });

      res.status(201).json({
        message: 'User registered successfully. Please verify your email.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      await AuthService.verifyEmail(token as string);

      res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.login({ email, password });

      res.json({ message: 'Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await AuthService.getCurrentUser(req.user.userId);
      res.json({ data: user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
```

#### 2.3.6 Auth Routes

```typescript
// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', (req, res) => AuthController.register(req, res));
router.get('/verify-email', (req, res) => AuthController.verifyEmail(req, res));
router.post('/login', (req, res) => AuthController.login(req, res));
router.get('/me', authMiddleware, (req, res) => AuthController.getCurrentUser(req, res));

export default router;
```

---

## Section 3: Week 3-4 Community Management

### 3.1 Community Service

```typescript
// backend/src/services/community.service.ts
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCommunityInput {
  name: string;
  description?: string;
  type: 'college' | 'corporate' | 'apartment' | 'neighborhood';
  domainList?: string[];
  adminId: string;
}

export class CommunityService {
  async createCommunity(input: CreateCommunityInput) {
    try {
      const communityId = uuidv4();

      await query(
        `INSERT INTO communities (id, name, description, type, domain_list, admin_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          communityId,
          input.name,
          input.description || null,
          input.type,
          input.domainList ? JSON.stringify(input.domainList) : null,
          input.adminId,
        ]
      );

      // Add admin user to community
      await query(
        `INSERT INTO user_communities (id, user_id, community_id, status, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), input.adminId, communityId, 'verified', 'admin']
      );

      return { id: communityId };
    } catch (error) {
      throw error;
    }
  }

  async getCommunity(communityId: string) {
    try {
      const result = await query(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM user_communities WHERE community_id = c.id AND status = 'verified') as member_count,
                u.first_name as admin_first_name, u.last_name as admin_last_name, u.email as admin_email
         FROM communities c
         LEFT JOIN users u ON c.admin_id = u.id
         WHERE c.id = $1`,
        [communityId]
      );

      if (result.rows.length === 0) {
        throw new Error('Community not found');
      }

      const community = result.rows[0];
      return {
        id: community.id,
        name: community.name,
        description: community.description,
        type: community.type,
        domainList: community.domain_list,
        memberCount: parseInt(community.member_count),
        admin: {
          id: community.admin_id,
          name: `${community.admin_first_name} ${community.admin_last_name}`,
          email: community.admin_email,
        },
        createdAt: community.created_at,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCommunities(limit: number = 10, offset: number = 0) {
    try {
      const result = await query(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM user_communities WHERE community_id = c.id AND status = 'verified') as member_count
         FROM communities c
         ORDER BY c.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows.map((community) => ({
        id: community.id,
        name: community.name,
        description: community.description,
        type: community.type,
        memberCount: parseInt(community.member_count),
        createdAt: community.created_at,
      }));
    } catch (error) {
      throw error;
    }
  }

  async joinCommunity(userId: string, communityId: string, domainEmail?: string) {
    try {
      // Verify user is not already a member
      const existingMember = await query(
        `SELECT id FROM user_communities WHERE user_id = $1 AND community_id = $2`,
        [userId, communityId]
      );

      if (existingMember.rows.length > 0) {
        throw new Error('User already a member of this community');
      }

      // Get community to check domain requirements
      const communityResult = await query(
        `SELECT domain_list FROM communities WHERE id = $1`,
        [communityId]
      );

      if (communityResult.rows.length === 0) {
        throw new Error('Community not found');
      }

      const community = communityResult.rows[0];
      let status = 'verified';

      // Check domain if required
      if (community.domain_list) {
        const domains = community.domain_list;
        if (domainEmail) {
          const emailDomain = domainEmail.split('@')[1];
          if (!domains.includes(emailDomain)) {
            status = 'pending';
          }
        } else {
          status = 'pending';
        }
      }

      // Add user to community
      await query(
        `INSERT INTO user_communities (id, user_id, community_id, status, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), userId, communityId, status, 'member']
      );

      return { status, message: `Successfully joined community. Status: ${status}` };
    } catch (error) {
      throw error;
    }
  }

  async getUserCommunities(userId: string) {
    try {
      const result = await query(
        `SELECT c.*, uc.role, uc.status, uc.joined_at,
                (SELECT COUNT(*) FROM user_communities WHERE community_id = c.id AND status = 'verified') as member_count
         FROM user_communities uc
         JOIN communities c ON uc.community_id = c.id
         WHERE uc.user_id = $1
         ORDER BY uc.joined_at DESC`,
        [userId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        role: row.role,
        status: row.status,
        memberCount: parseInt(row.member_count),
        joinedAt: row.joined_at,
      }));
    } catch (error) {
      throw error;
    }
  }
}

export default new CommunityService();
```

### 3.2 Community Controller & Routes

```typescript
// backend/src/controllers/community.controller.ts
import { Request, Response } from 'express';
import CommunityService from '../services/community.service';

export class CommunityController {
  async createCommunity(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, description, type, domainList } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const result = await CommunityService.createCommunity({
        name,
        description,
        type,
        domainList,
        adminId: req.user.userId,
      });

      res.status(201).json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCommunity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const community = await CommunityService.getCommunity(id);
      res.json({ data: community });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async listCommunities(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const offset = parseInt(req.query.offset as string) || 0;

      const communities = await CommunityService.getCommunities(limit, offset);
      res.json({ data: communities });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async joinCommunity(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { communityId } = req.params;
      const { domainEmail } = req.body;

      const result = await CommunityService.joinCommunity(req.user.userId, communityId, domainEmail);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserCommunities(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const communities = await CommunityService.getUserCommunities(req.user.userId);
      res.json({ data: communities });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new CommunityController();
```

---

## Section 4: Week 5-8 Marketplace

### 4.1 Listing Service

```typescript
// backend/src/services/listing.service.ts
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface CreateListingInput {
  title: string;
  description: string;
  category: string;
  type: 'item' | 'benefit' | 'service';
  price: number;
  condition?: string;
  images?: string[];
  quantity?: number;
  expirationDate?: Date;
  meetingPreference?: 'pickup' | 'delivery' | 'digital';
}

export class ListingService {
  async createListing(sellerId: string, communityId: string, input: CreateListingInput) {
    try {
      const listingId = uuidv4();

      await query(
        `INSERT INTO listings (
          id, seller_id, community_id, title, description, category, type,
          price, condition, images, quantity, available_quantity, expiration_date, meeting_preference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          listingId,
          sellerId,
          communityId,
          input.title,
          input.description,
          input.category,
          input.type,
          input.price,
          input.condition || null,
          input.images ? JSON.stringify(input.images) : null,
          input.quantity || 1,
          input.quantity || 1,
          input.expirationDate || null,
          input.meetingPreference || 'pickup',
        ]
      );

      return { id: listingId };
    } catch (error) {
      throw error;
    }
  }

  async getListing(listingId: string) {
    try {
      const result = await query(
        `SELECT l.*, u.first_name, u.last_name, u.profile_photo_url,
                (SELECT AVG(stars) FROM ratings WHERE ratee_id = l.seller_id) as seller_rating
         FROM listings l
         JOIN users u ON l.seller_id = u.id
         WHERE l.id = $1`,
        [listingId]
      );

      if (result.rows.length === 0) {
        throw new Error('Listing not found');
      }

      return this.formatListing(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async searchListings(
    communityId: string,
    searchQuery?: string,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      condition?: string;
      type?: string;
    },
    limit: number = 20,
    offset: number = 0
  ) {
    try {
      let whereClause = 'l.community_id = $1 AND l.status = \'active\'';
      const params: any[] = [communityId];
      let paramCount = 1;

      if (searchQuery) {
        paramCount++;
        whereClause += ` AND (to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')) @@ 
                        plainto_tsquery('english', $${paramCount}))`;
        params.push(searchQuery);
      }

      if (filters?.category) {
        paramCount++;
        whereClause += ` AND l.category = $${paramCount}`;
        params.push(filters.category);
      }

      if (filters?.minPrice !== undefined) {
        paramCount++;
        whereClause += ` AND l.price >= $${paramCount}`;
        params.push(filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        paramCount++;
        whereClause += ` AND l.price <= $${paramCount}`;
        params.push(filters.maxPrice);
      }

      if (filters?.type) {
        paramCount++;
        whereClause += ` AND l.type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters?.condition) {
        paramCount++;
        whereClause += ` AND l.condition = $${paramCount}`;
        params.push(filters.condition);
      }

      paramCount++;
      const limitParam = paramCount;
      params.push(limit);

      paramCount++;
      const offsetParam = paramCount;
      params.push(offset);

      const result = await query(
        `SELECT l.*, u.first_name, u.last_name, u.profile_photo_url,
                (SELECT AVG(stars) FROM ratings WHERE ratee_id = l.seller_id) as seller_rating
         FROM listings l
         JOIN users u ON l.seller_id = u.id
         WHERE ${whereClause}
         ORDER BY l.created_at DESC
         LIMIT $${limitParam} OFFSET $${offsetParam}`,
        params
      );

      return result.rows.map((row) => this.formatListing(row));
    } catch (error) {
      throw error;
    }
  }

  async getSellerListings(sellerId: string, limit: number = 20, offset: number = 0) {
    try {
      const result = await query(
        `SELECT * FROM listings
         WHERE seller_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [sellerId, limit, offset]
      );

      return result.rows.map((row) => this.formatListing(row));
    } catch (error) {
      throw error;
    }
  }

  async updateListing(listingId: string, sellerId: string, updates: Partial<CreateListingInput>) {
    try {
      // Verify ownership
      const listing = await query(
        'SELECT seller_id FROM listings WHERE id = $1',
        [listingId]
      );

      if (listing.rows.length === 0) {
        throw new Error('Listing not found');
      }

      if (listing.rows[0].seller_id !== sellerId) {
        throw new Error('Unauthorized to update this listing');
      }

      const allowedFields = ['title', 'description', 'category', 'price', 'condition', 'meeting_preference'];
      const updateParts: string[] = [];
      const updateParams: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(dbKey) && value !== undefined) {
          updateParts.push(`${dbKey} = $${paramCount}`);
          updateParams.push(value);
          paramCount++;
        }
      });

      if (updateParts.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateParams.push(listingId);
      await query(
        `UPDATE listings SET ${updateParts.join(', ')} WHERE id = $${paramCount}`,
        updateParams
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async markListingSold(listingId: string, sellerId: string) {
    try {
      // Verify ownership
      const listing = await query(
        'SELECT seller_id FROM listings WHERE id = $1',
        [listingId]
      );

      if (listing.rows.length === 0) {
        throw new Error('Listing not found');
      }

      if (listing.rows[0].seller_id !== sellerId) {
        throw new Error('Unauthorized');
      }

      await query(
        'UPDATE listings SET status = $1 WHERE id = $2',
        ['sold', listingId]
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  private formatListing(row: any) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      type: row.type,
      price: parseFloat(row.price),
      condition: row.condition,
      images: row.images ? JSON.parse(row.images) : [],
      quantity: row.quantity,
      availableQuantity: row.available_quantity,
      meetingPreference: row.meeting_preference,
      status: row.status,
      expirationDate: row.expiration_date,
      seller: {
        id: row.seller_id,
        name: `${row.first_name} ${row.last_name}`,
        profilePhoto: row.profile_photo_url,
        rating: row.seller_rating ? parseFloat(row.seller_rating) : 0,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new ListingService();
```

### 4.2 Listing Controller & Routes

```typescript
// backend/src/controllers/listing.controller.ts
import { Request, Response } from 'express';
import ListingService from '../services/listing.service';

export class ListingController {
  async createListing(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, description, category, type, price, condition, images, quantity, meetingPreference } = req.body;
      const { communityId } = req.params;

      if (!title || !description || !type || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await ListingService.createListing(req.user.userId, communityId, {
        title,
        description,
        category,
        type,
        price,
        condition,
        images,
        quantity,
        meetingPreference,
      });

      res.status(201).json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const listing = await ListingService.getListing(id);
      res.json({ data: listing });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async searchListings(req: Request, res: Response) {
    try {
      const { communityId } = req.params;
      const { q, category, minPrice, maxPrice, condition, type, limit, offset } = req.query;

      const listings = await ListingService.searchListings(
        communityId,
        q as string,
        {
          category: category as string,
          minPrice: minPrice ? parseInt(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
          condition: condition as string,
          type: type as string,
        },
        Math.min(parseInt(limit as string) || 20, 100),
        parseInt(offset as string) || 0
      );

      res.json({ data: listings });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSellerListings(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const listings = await ListingService.getSellerListings(sellerId, limit, offset);
      res.json({ data: listings });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateListing(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await ListingService.updateListing(id, req.user.userId, req.body);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markListingSold(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await ListingService.markListingSold(id, req.user.userId);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new ListingController();
```

---

## Section 5: Week 9-12 Transactions & Moderation

### 5.1 Messaging Service & WebSocket Setup

```typescript
// backend/src/services/messaging.service.ts
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface SendMessageInput {
  content: string;
  attachments?: string[];
}

export class MessagingService {
  async createOrGetConversation(buyerId: string, sellerId: string, listingId: string, communityId: string) {
    try {
      // Check if conversation already exists
      const existing = await query(
        `SELECT id FROM conversations
         WHERE buyer_id = $1 AND seller_id = $2 AND listing_id = $3`,
        [buyerId, sellerId, listingId]
      );

      if (existing.rows.length > 0) {
        return existing.rows[0].id;
      }

      // Create new conversation
      const conversationId = uuidv4();
      await query(
        `INSERT INTO conversations (id, buyer_id, seller_id, listing_id, community_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [conversationId, buyerId, sellerId, listingId, communityId]
      );

      return conversationId;
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(conversationId: string, senderId: string, input: SendMessageInput) {
    try {
      const messageId = uuidv4();

      await query(
        `INSERT INTO messages (id, conversation_id, sender_id, content, attachments)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          messageId,
          conversationId,
          senderId,
          input.content,
          input.attachments ? JSON.stringify(input.attachments) : null,
        ]
      );

      // Update conversation's last_message_at
      await query(
        'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );

      return { id: messageId };
    } catch (error) {
      throw error;
    }
  }

  async getConversations(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const result = await query(
        `SELECT c.*, 
                l.title as listing_title,
                CASE 
                  WHEN c.buyer_id = $1 THEN u2.id
                  ELSE u1.id
                END as other_user_id,
                CASE 
                  WHEN c.buyer_id = $1 THEN CONCAT(u2.first_name, ' ', u2.last_name)
                  ELSE CONCAT(u1.first_name, ' ', u1.last_name)
                END as other_user_name,
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = false AND sender_id != $1) as unread_count
         FROM conversations c
         LEFT JOIN listings l ON c.listing_id = l.id
         LEFT JOIN users u1 ON c.seller_id = u1.id
         LEFT JOIN users u2 ON c.buyer_id = u2.id
         WHERE c.buyer_id = $1 OR c.seller_id = $1
         ORDER BY c.last_message_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map((row) => ({
        id: row.id,
        listingTitle: row.listing_title,
        otherUser: {
          id: row.other_user_id,
          name: row.other_user_name,
        },
        lastMessage: row.last_message,
        unreadCount: parseInt(row.unread_count),
        lastMessageAt: row.last_message_at,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    try {
      const result = await query(
        `SELECT m.*, u.first_name, u.last_name, u.profile_photo_url
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT $2 OFFSET $3`,
        [conversationId, limit, offset]
      );

      return result.rows.reverse().map((row) => ({
        id: row.id,
        content: row.content,
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        sender: {
          id: row.sender_id,
          name: `${row.first_name} ${row.last_name}`,
          profilePhoto: row.profile_photo_url,
        },
        isRead: row.is_read,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw error;
    }
  }

  async markAsRead(conversationId: string, userId: string) {
    try {
      await query(
        `UPDATE messages SET is_read = true 
         WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false`,
        [conversationId, userId]
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export default new MessagingService();
```

### 5.2 Rating Service

```typescript
// backend/src/services/rating.service.ts
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRatingInput {
  listingId: string;
  ratingType: 'seller' | 'buyer';
  stars: number;
  reviewText?: string;
  categories?: Record<string, number>;
}

export class RatingService {
  async createRating(raterId: string, rateeId: string, communityId: string, input: CreateRatingInput) {
    try {
      // Check if already rated
      const existing = await query(
        `SELECT id FROM ratings
         WHERE listing_id = $1 AND rater_id = $2 AND rating_type = $3`,
        [input.listingId, raterId, input.ratingType]
      );

      if (existing.rows.length > 0) {
        throw new Error('You have already rated this transaction');
      }

      const ratingId = uuidv4();
      await query(
        `INSERT INTO ratings (id, rater_id, ratee_id, listing_id, community_id, rating_type, stars, review_text, categories)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          ratingId,
          raterId,
          rateeId,
          input.listingId,
          communityId,
          input.ratingType,
          input.stars,
          input.reviewText || null,
          input.categories ? JSON.stringify(input.categories) : null,
        ]
      );

      // Update trust score
      await this.updateTrustScore(rateeId, communityId);

      return { id: ratingId };
    } catch (error) {
      throw error;
    }
  }

  async getUserRatings(userId: string, communityId: string, ratingType?: 'seller' | 'buyer') {
    try {
      let query_str = `SELECT * FROM ratings WHERE ratee_id = $1 AND community_id = $2`;
      const params: any[] = [userId, communityId];

      if (ratingType) {
        query_str += ` AND rating_type = $3`;
        params.push(ratingType);
      }

      const result = await query(query_str + ` ORDER BY created_at DESC`, params);

      return result.rows.map((row) => ({
        id: row.id,
        stars: row.stars,
        reviewText: row.review_text,
        categories: row.categories ? JSON.parse(row.categories) : {},
        ratingType: row.rating_type,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getUserTrustScore(userId: string, communityId: string) {
    try {
      const result = await query(
        `SELECT * FROM trust_scores
         WHERE user_id = $1 AND community_id = $2`,
        [userId, communityId]
      );

      if (result.rows.length === 0) {
        // Return default scores
        return {
          overallScore: 0,
          sellerScore: 0,
          buyerScore: 0,
          transactionCount: 0,
          averageRating: 0,
        };
      }

      const score = result.rows[0];
      return {
        overallScore: parseFloat(score.overall_score),
        sellerScore: parseFloat(score.seller_score),
        buyerScore: parseFloat(score.buyer_score),
        transactionCount: score.transaction_count,
        averageRating: score.average_rating ? parseFloat(score.average_rating) : 0,
      };
    } catch (error) {
      throw error;
    }
  }

  private async updateTrustScore(userId: string, communityId: string) {
    try {
      const ratingsResult = await query(
        `SELECT 
          AVG(CASE WHEN rating_type = 'seller' THEN stars ELSE NULL END) as seller_avg,
          AVG(CASE WHEN rating_type = 'buyer' THEN stars ELSE NULL END) as buyer_avg,
          AVG(stars) as overall_avg,
          COUNT(*) as total_count
         FROM ratings
         WHERE ratee_id = $1 AND community_id = $2`,
        [userId, communityId]
      );

      const ratings = ratingsResult.rows[0];
      const sellerScore = ratings.seller_avg ? parseFloat(ratings.seller_avg) : 0;
      const buyerScore = ratings.buyer_avg ? parseFloat(ratings.buyer_avg) : 0;
      const overallScore = ratings.overall_avg ? parseFloat(ratings.overall_avg) : 0;

      // Check if trust score exists
      const existing = await query(
        `SELECT id FROM trust_scores WHERE user_id = $1 AND community_id = $2`,
        [userId, communityId]
      );

      if (existing.rows.length === 0) {
        // Create new trust score
        await query(
          `INSERT INTO trust_scores (id, user_id, community_id, overall_score, seller_score, buyer_score, transaction_count, average_rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [uuidv4(), userId, communityId, overallScore, sellerScore, buyerScore, ratings.total_count, overallScore]
        );
      } else {
        // Update existing trust score
        await query(
          `UPDATE trust_scores 
           SET overall_score = $1, seller_score = $2, buyer_score = $3, transaction_count = $4, average_rating = $5
           WHERE user_id = $6 AND community_id = $7`,
          [overallScore, sellerScore, buyerScore, ratings.total_count, overallScore, userId, communityId]
        );
      }
    } catch (error) {
      console.error('Error updating trust score:', error);
    }
  }
}

export default new RatingService();
```

### 5.3 Moderation Service

```typescript
// backend/src/services/moderation.service.ts
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface CreateReportInput {
  reportedItemId: string;
  reportType: 'listing' | 'user' | 'content' | 'message';
  reason: string;
  description?: string;
  evidence?: string[];
}

export class ModerationService {
  async createReport(reporterId: string, input: CreateReportInput) {
    try {
      const reportId = uuidv4();

      await query(
        `INSERT INTO reports (id, reporter_id, reported_item_id, report_type, reason, description, evidence, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          reportId,
          reporterId,
          input.reportedItemId,
          input.reportType,
          input.reason,
          input.description || null,
          input.evidence ? JSON.stringify(input.evidence) : null,
          'medium', // Default priority
        ]
      );

      return { id: reportId };
    } catch (error) {
      throw error;
    }
  }

  async getOpenReports(limit: number = 20, offset: number = 0) {
    try {
      const result = await query(
        `SELECT r.*, u.first_name as reporter_first_name, u.last_name as reporter_last_name
         FROM reports r
         JOIN users u ON r.reporter_id = u.id
         WHERE r.status = 'open'
         ORDER BY r.priority DESC, r.created_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows.map((row) => ({
        id: row.id,
        reportedItemId: row.reported_item_id,
        reportType: row.report_type,
        reason: row.reason,
        description: row.description,
        evidence: row.evidence ? JSON.parse(row.evidence) : [],
        priority: row.priority,
        reporter: {
          id: row.reporter_id,
          name: `${row.reporter_first_name} ${row.reporter_last_name}`,
        },
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw error;
    }
  }

  async resolveReport(reportId: string, moderatorId: string, action: 'dismiss' | 'warn' | 'suspend' | 'ban', reason: string) {
    try {
      await query(
        `UPDATE reports
         SET status = 'resolved', assigned_to = $1, resolution_reason = $2, resolved_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [moderatorId, reason, reportId]
      );

      // TODO: Implement enforcement actions (warn, suspend, ban)

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

export default new ModerationService();
```

---

## Section 6: Testing & Quality Assurance

### 6.1 Jest Configuration

```javascript
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 6.2 Example Unit Test

```typescript
// backend/tests/unit/auth.service.test.ts
import AuthService from '../../src/services/auth.service';
import { hashPassword, comparePassword } from '../../src/utils/hash';

jest.mock('../../src/config/database');
jest.mock('../../src/utils/hash');

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('verificationToken');
    });

    it('should throw error if user already exists', async () => {
      // Mock query to return existing user
      await expect(
        AuthService.register({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should return token and user data on successful login', async () => {
      (comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
    });

    it('should throw error on invalid credentials', async () => {
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

---

## Section 7: Deployment & Infrastructure

### 7.1 Backend Dockerfile

```dockerfile
# backend/docker/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 7.2 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
```

### 7.3 GitHub Actions CI/CD

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run linter
        run: cd backend && npm run lint
      
      - name: Run tests
        run: cd backend && npm test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_NAME: test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker image
        run: |
          docker build -t circleexchange-api:latest ./backend
          # Add Docker push commands for your registry
      
      - name: Deploy to server
        run: |
          # Add deployment commands
          echo "Deploying to production..."
```

---

## Section 8: Team & Resource Planning

### 8.1 Team Structure

```
Phase 1 Team (12 weeks):

Backend Team (3 developers)
├── Lead Backend Engineer (1)
│   └── Responsibilities: Architecture, DB design, API design
├── Backend Engineer (2)
│   └── Responsibilities: Service implementation, testing
└── Database Admin (shared 0.5)
    └── Responsibilities: Schema optimization, migrations

Frontend Team (2 developers)
├── Senior Frontend Engineer (1)
│   └── Responsibilities: Architecture, UI/UX integration
└── Frontend Engineer (1)
    └── Responsibilities: Component development, testing

Mobile Team (2 developers)
├── React Native Specialist (1)
│   └── Responsibilities: Mobile architecture, navigation
└── Mobile Developer (1)
    └── Responsibilities: UI implementation, testing

DevOps/Infrastructure (1 engineer)
├── DevOps Engineer (1)
    └── Responsibilities: Docker setup, CI/CD, deployment

QA Team (1 engineer)
├── QA Engineer (1)
    └── Responsibilities: Testing, bug tracking, documentation

Product & Design (2 people)
├── Product Manager (1)
├── UI/UX Designer (1)

Total: ~11 FTE
```

### 8.2 Weekly Standup Format

```markdown
# CircleExchange Phase 1 Weekly Standup

**Week**: [1-12]
**Date**: [DD/MM/YYYY]
**Attendees**: All team leads

## Completed Last Week
- [ ] Backend: Authentication system (DONE)
- [ ] Frontend: Auth UI components (DONE)
- [ ] Mobile: Setup React Native project (DONE)
- [ ] DevOps: Docker Compose setup (DONE)

## This Week's Goals
- [ ] Backend: Database migrations and schema finalization
- [ ] Frontend: Community listing page
- [ ] Mobile: Navigation setup and basic screens
- [ ] DevOps: CI/CD pipeline setup
- [ ] QA: Test plan creation

## Blockers
- None currently

## Metrics
- Backend tests: 45/50 passing (90%)
- Frontend tests: 30/40 passing (75%)
- Bug count: 12 (6 critical, 6 minor)
- Code coverage: 72%
```

### 8.3 Development Milestones

```markdown
# Phase 1 Development Milestones

## Milestone 1: Foundation (Week 1-2)
- [x] Backend project setup
- [x] Database schema creation
- [x] Authentication system (register/login/verify)
- [x] Docker and local development environment
- Status: ✅ Complete

## Milestone 2: Community Management (Week 3-4)
- [x] Community creation API
- [x] User community membership
- [x] Community joining flows
- [x] Basic frontend for communities
- Status: ✅ Complete

## Milestone 3: Marketplace Core (Week 5-8)
- [x] Listing creation/update/delete APIs
- [x] Search and filtering
- [x] Listing display UI
- [x] Image upload functionality
- Status: In Progress

## Milestone 4: Transactions (Week 9-12)
- [ ] Messaging system with WebSocket
- [ ] Rating system
- [ ] Basic moderation system
- [ ] Mobile app UI
- [ ] Admin dashboard
- Status: Planned

## Launch Readiness (Post-Week 12)
- [ ] Load testing (1000+ concurrent users)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Beta launch preparation
```

---

## Section 9: Success Metrics & Definition of Done

### 9.1 MVP Definition of Done

```markdown
# Phase 1 MVP Criteria

## Technical Requirements
- [ ] Backend API fully documented (OpenAPI/Swagger)
- [ ] 80% code coverage on core services
- [ ] Database performance: <100ms for 95th percentile queries
- [ ] API response time: <200ms for 95th percentile
- [ ] Zero critical security vulnerabilities (per OWASP)
- [ ] Database encryption for sensitive data
- [ ] CI/CD pipeline fully operational

## Feature Completeness
- [ ] User registration and email verification
- [ ] Community creation and management
- [ ] Listing creation (items, benefits, services)
- [ ] Search and filtering (>90% accuracy)
- [ ] Messaging system (real-time)
- [ ] Rating system
- [ ] Basic moderation (report/review)
- [ ] Admin dashboard (basic)

## Frontend/Mobile
- [ ] Web app responsive on desktop/tablet
- [ ] Android app installable and functional
- [ ] iOS app ready for TestFlight
- [ ] All critical user flows functional
- [ ] >90% Lighthouse score (web)

## Testing
- [ ] Unit tests: >80% coverage
- [ ] Integration tests for all critical APIs
- [ ] E2E tests for 10+ key user flows
- [ ] Manual testing checklist completed
- [ ] Browser compatibility verified

## Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] User guides for core features
- [ ] Deployment guide created
- [ ] Architecture documentation

## Performance
- [ ] Cold start time: <5 seconds
- [ ] Initial load time: <3 seconds
- [ ] Search results: <1 second
- [ ] Message delivery: <2 seconds
- [ ] Database backup: Daily automated

## Security
- [ ] All endpoints require authentication (where needed)
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] CORS properly configured
- [ ] JWT secret rotation ready

## Compliance
- [ ] GDPR privacy policy drafted
- [ ] Terms of service drafted
- [ ] Community guidelines documented
- [ ] Data retention policy defined
```

### 9.2 Launch Checklist

```markdown
# Phase 1 Launch Checklist

## Pre-Launch (Week 12)
- [ ] Final security audit completed
- [ ] Load test: 100+ concurrent users successful
- [ ] Database backup and recovery tested
- [ ] Monitoring and alerting setup
- [ ] Support documentation finalized
- [ ] Team training on support processes

## Launch Day
- [ ] Production environment ready
- [ ] Database migrated and verified
- [ ] Backup systems operational
- [ ] Monitoring dashboards active
- [ ] Support team on standby
- [ ] Communications plan ready

## Post-Launch (First Week)
- [ ] Daily performance monitoring
- [ ] Bug fix SLA: Critical bugs <2 hours
- [ ] User feedback collection
- [ ] Metrics tracking and reporting
- [ ] Community admin support

## Metrics to Track
- [ ] User registration rate
- [ ] Email verification rate
- [ ] Community creation rate
- [ ] Average listings per community
- [ ] Transaction completion rate
- [ ] User retention (7-day, 30-day)
- [ ] API uptime (target: 99%)
- [ ] Error rate (target: <0.1%)
```

---

## Conclusion

This Phase 1 implementation plan provides a structured approach to building the CircleExchange MVP over 12 weeks. The plan includes:

✅ **Technical Foundation**: Complete tech stack, database schema, and API design
✅ **Implementation Details**: Code snippets for all core services
✅ **Development Timeline**: Week-by-week breakdown with deliverables
✅ **Quality Assurance**: Testing strategy and success metrics
✅ **Deployment**: Docker, CI/CD, and infrastructure setup
✅ **Team Planning**: Resource allocation and milestones

**Key Success Factors**:
1. Strict adherence to the weekly timeline
2. Early integration testing between components
3. Continuous performance monitoring
4. Regular stakeholder communication
5. Rapid iteration based on user feedback

**Next Steps**:
1. Finalize technology stack and tool selections
2. Set up development environment for all team members
3. Create detailed design specifications
4. Begin backend development in Week 1
5. Establish communication and standup cadence

---

**Document Version**: 1.0  
**Created**: February 2026  
**Last Updated**: February 2026  
**Review Schedule**: Weekly during Phase 1
