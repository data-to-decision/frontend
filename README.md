# Data2Decision Frontend

The frontend monorepo for Data2Decision, an AI-native data intelligence platform. This is a dual-persona workspace where executives and data engineers collaborate on the same data in real time, each with an interface tailored to their role.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | SSR, routing, API routes |
| **Language** | TypeScript (strict mode) | Type safety across the codebase |
| **UI Components** | Radix UI primitives | Accessible, unstyled component primitives |
| **Styling** | Tailwind CSS | Utility-first styling |
| **State Management** | Redux Toolkit | Global client state |
| **Forms** | React Hook Form + Zod | Form handling and validation |
| **Icons** | Lucide React | Consistent iconography |
| **Monorepo** | Turborepo + pnpm | Build orchestration and workspace management |

## Project Structure

```
frontend/
├── apps/
│   └── web/                      # Main Next.js application
│       ├── app/                  # App Router pages and layouts
│       │   ├── (auth)/           # Authentication routes (login, verify)
│       │   ├── (onboarding)/     # Onboarding flow (welcome, profile, organization)
│       │   ├── settings/         # Settings pages (profile, team, security, etc.)
│       │   └── invitations/      # Invitation handling
│       ├── components/           # App-specific components
│       │   └── layout/           # Layout components (Sidebar, Header)
│       ├── hooks/                # Custom React hooks
│       ├── lib/                  # Utilities and services
│       │   ├── api/              # API client and endpoint handlers
│       │   └── auth/             # Authentication utilities
│       └── store/                # Redux slices and store configuration
│
├── packages/
│   ├── ui/                       # Shared UI component library (@d2d/ui)
│   │   └── src/
│   │       ├── components/       # Reusable components
│   │       │   ├── Avatar/
│   │       │   ├── Button/
│   │       │   ├── Card/
│   │       │   ├── Input/
│   │       │   ├── Label/
│   │       │   ├── Progress/
│   │       │   ├── Select/
│   │       │   └── Spinner/
│   │       └── utils/            # Utility functions (cn, etc.)
│   │
│   ├── types/                    # Shared TypeScript types (@d2d/types)
│   │   └── src/
│   │       └── index.ts          # Type definitions
│   │
│   └── config/                   # Shared configuration (placeholder)
│
├── turbo.json                    # Turborepo task configuration
├── pnpm-workspace.yaml           # pnpm workspace definition
└── package.json                  # Root package.json
```

## Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.0.0

To install pnpm if you don't have it:

```bash
npm install -g pnpm@9
```

## Installation

1. Clone the repository and navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp apps/web/.env.example apps/web/.env.local
```

4. Edit `apps/web/.env.local` with your configuration.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |
| `NEXT_PUBLIC_USE_MOCK_AUTH` | Enable mock authentication (no backend required) | `true` |

## Development

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server for all apps |
| `pnpm build` | Build all apps and packages for production |
| `pnpm lint` | Run ESLint across all workspaces |
| `pnpm test` | Run tests across all workspaces |
| `pnpm clean` | Clean build artifacts and node_modules |

## Workspace Packages

### @d2d/web

The main Next.js application. Located at `apps/web/`.

```bash
# Run only the web app
pnpm --filter @d2d/web dev
```

### @d2d/ui

Shared UI component library built on Radix UI primitives. Located at `packages/ui/`.

Usage in applications:

```tsx
import { Button, Input, Card } from '@d2d/ui';
```

### @d2d/types

Shared TypeScript type definitions. Located at `packages/types/`.

```tsx
import type { User, Organization, TeamMember } from '@d2d/types';
```

## Application Routes

| Route | Description |
|-------|-------------|
| `/` | Home / Dashboard |
| `/login` | User login |
| `/verify` | Email verification |
| `/onboarding/welcome` | Welcome screen for new users |
| `/onboarding/profile` | Profile setup |
| `/onboarding/organization` | Organization setup |
| `/settings` | User settings overview |
| `/settings/profile` | Profile settings |
| `/settings/security` | Security settings |
| `/settings/sessions` | Active sessions management |
| `/settings/notifications` | Notification preferences |
| `/settings/organization/*` | Organization settings |
| `/settings/team` | Team management |
| `/settings/activity` | Activity log |
| `/invitations/*` | Invitation handling |

## State Management

The application uses Redux Toolkit for global state management with the following slices:

| Slice | Purpose |
|-------|---------|
| `auth` | Authentication state and user session |
| `organization` | Current organization data |
| `team` | Team members and roles |
| `session` | Active sessions |
| `activity` | Activity log |
| `sidebar` | Sidebar UI state |
| `theme` | Theme preferences |
| `onboarding` | Onboarding flow state |

## API Client

The API client is located at `apps/web/lib/api/` and provides typed methods for all backend endpoints:

```typescript
import { api } from '@/lib/api';

// Authentication
await api.auth.login(credentials);
await api.auth.logout();

// Organizations
await api.organizations.getCurrent();
await api.organizations.update(data);

// Team management
await api.team.getMembers();
await api.team.invite(email);
```

## Styling Guidelines

- Use Tailwind CSS utility classes for styling
- Follow the design system defined in `tailwind.config.ts`
- Use CSS variables for theming (dark mode support)
- Custom animations are defined in the Tailwind config

## TypeScript

- Strict mode is enabled
- No `any` types without explicit justification
- Use interfaces for object shapes
- API types should mirror backend schemas

## Contributing

1. Create a feature branch from `main`
2. Follow the existing code style and patterns
3. Ensure TypeScript compilation passes (`pnpm build`)
4. Run linting (`pnpm lint`)
5. Submit a pull request with a clear description

## Architecture Decisions

- **App Router**: Using Next.js 14 App Router for improved layouts and server components
- **Monorepo**: Turborepo manages the build pipeline with intelligent caching
- **Component Library**: Shared UI components in `@d2d/ui` ensure consistency
- **Mock Mode**: Development can proceed without a backend using mock authentication
- **Type Safety**: Shared types in `@d2d/types` ensure consistency between packages

## Related Documentation

- [Root CLAUDE.md](/CLAUDE.md) - Platform-wide context and decisions
- [Frontend CLAUDE.md](./CLAUDE.md) - Frontend-specific architecture and guidelines

## License

Private - All rights reserved.
