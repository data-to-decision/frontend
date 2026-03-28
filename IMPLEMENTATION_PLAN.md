# Authentication & Onboarding Implementation Plan

## Context

Data2Decision needs a production-grade authentication and onboarding frontend that:
- Uses passwordless magic link authentication
- Intelligently routes users based on work vs personal email
- Auto-creates organizations for first work-email users from a domain
- Manages join requests for subsequent work-email users
- Provides profile completion and organization setup onboarding
- Follows Apple Human Interface Guidelines

Full detailed plan with ASCII screen designs: `AUTH_ONBOARDING_PLAN.md`

---

## Technology Stack (Senior Frontend Engineer Agent)

| Technology | Purpose |
|------------|---------|
| **Next.js 14+** | App Router, Server Components |
| **TypeScript Strict** | Type safety |
| **Turborepo** | Monorepo management |
| **Redux Toolkit** | Client state management |
| **TanStack Query** | Server state, caching |
| **Radix UI** | Accessible primitives |
| **Tailwind + CSS Modules** | Styling (no inline CSS) |
| **React Hook Form + Zod** | Forms and validation |
| **Jest + RTL** | Testing |

---

## User Journeys (4 Personas)

1. **Personal Email User** - Signs up, completes profile, lands in personal workspace
2. **Work Email (First from Domain)** - Signs up, auto-creates org, becomes Owner, completes org setup
3. **Work Email (First from Domain)** - Signs up, auto-creates org, becomes Owner, completes org setup
3. **Work Email (Existing Org)** - Signs up, join request created, waits for approval
4. **Invited User** - Clicks invite link, joins org directly, completes profile

---

## Turborepo Monorepo Structure

```
data2decision-frontend/
├── apps/
│   └── web/                      # Main Next.js application
│       ├── app/
│       │   ├── (auth)/           # Auth route group
│       │   │   ├── login/page.tsx
│       │   │   ├── verify/page.tsx
│       │   │   └── layout.tsx
│       │   ├── (onboarding)/     # Onboarding route group
│       │   │   ├── profile/page.tsx
│       │   │   ├── organization/page.tsx
│       │   │   ├── pending/page.tsx
│       │   │   └── layout.tsx
│       │   ├── (workspace)/      # Main app route group
│       │   │   └── page.tsx
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/           # App-specific components
│       │   ├── auth/
│       │   │   ├── MagicLinkForm/
│       │   │   ├── VerificationState/
│       │   │   └── DomainContext/
│       │   └── onboarding/
│       │       ├── ProfileForm/
│       │       ├── OrganizationForm/
│       │       └── PendingApproval/
│       ├── store/                # Redux store
│       │   ├── index.ts
│       │   ├── auth.slice.ts
│       │   └── onboarding.slice.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   └── useOnboarding.ts
│       ├── lib/
│       │   └── api/
│       │       ├── client.ts
│       │       ├── auth.ts
│       │       └── onboarding.ts
│       └── types/
│
├── packages/
│   ├── ui/                       # Shared UI library (Radix + custom)
│   │   ├── src/
│   │   │   ├── primitives/       # Button, Input, Card, etc.
│   │   │   ├── patterns/         # Form, Modal, Progress, etc.
│   │   │   └── index.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── config/                   # Shared configs
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   │
│   ├── utils/                    # Shared utilities
│   │   └── src/
│   │       ├── validation/       # Zod schemas
│   │       └── api/              # API helpers
│   │
│   └── types/                    # Shared TypeScript types
│       └── src/
│           ├── api/              # API response types
│           └── models/           # Domain models (User, Org, etc.)
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── .github/workflows/
```

---

## Redux Store Structure

```typescript
// store/auth.slice.ts
interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  tokens: { access: string; refresh: string } | null;
  domainSignup: DomainSignupResult | null;
  error: string | null;
}

// store/onboarding.slice.ts
interface OnboardingState {
  currentStep: 'profile' | 'organization' | 'pending' | 'complete';
  profileData: Partial<ProfileData>;
  organizationData: Partial<OrganizationData>;
  isComplete: boolean;
}
```

---

## Packages UI Components (Radix-based)

```
packages/ui/src/primitives/
├── Button/
│   ├── Button.tsx              # Radix + CVA variants
│   ├── Button.module.css       # Complex styles
│   ├── Button.test.tsx
│   └── index.ts
├── Input/
├── Card/
├── Avatar/
├── Progress/
├── Spinner/
└── index.ts

packages/ui/src/patterns/
├── Form/
│   ├── FormField.tsx
│   ├── FormLabel.tsx
│   ├── FormMessage.tsx
│   └── index.ts
├── Modal/
├── Toast/
└── FileUpload/
```

---

## Dependencies

### Root package.json
```json
{
  "devDependencies": {
    "turbo": "^2.x",
    "typescript": "^5.x"
  }
}
```

### apps/web/package.json
```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@reduxjs/toolkit": "^2.x",
    "react-redux": "^9.x",
    "@tanstack/react-query": "^5.x",
    "axios": "^1.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "@repo/ui": "workspace:*",
    "@repo/utils": "workspace:*",
    "@repo/types": "workspace:*"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "tailwindcss": "^3.x",
    "jest": "^29.x",
    "@testing-library/react": "^14.x"
  }
}
```

### packages/ui/package.json
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-progress": "^1.x",
    "@radix-ui/react-toast": "^1.x",
    "@radix-ui/react-avatar": "^1.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

---

## Implementation Phases

### Phase 1: Turborepo Setup (Days 1-2)
- [ ] Initialize Turborepo monorepo structure
- [ ] Create pnpm-workspace.yaml
- [ ] Set up packages/config (ESLint, TypeScript, Tailwind configs)
- [ ] Set up packages/types (shared TypeScript types)
- [ ] Set up packages/utils (shared utilities, Zod schemas)
- [ ] Configure turbo.json pipelines

### Phase 2: UI Package (Days 3-4)
- [ ] Create packages/ui with Radix primitives
- [ ] Build Button component (CVA variants, CSS Modules)
- [ ] Build Input component with form integration
- [ ] Build Card, Avatar, Progress, Spinner components
- [ ] Build Form pattern components (FormField, FormLabel, FormMessage)
- [ ] Build Modal and Toast patterns
- [ ] Configure Tailwind with Apple design tokens

### Phase 3: Web App Foundation (Days 5-6)
- [ ] Create apps/web Next.js application
- [ ] Set up Redux store (auth.slice, onboarding.slice)
- [ ] Set up TanStack Query provider
- [ ] Create API client with interceptors
- [ ] Create auth and onboarding API modules

### Phase 4: Auth Flow (Days 7-9)
- [ ] Create (auth) route group layout
- [ ] Build login page with MagicLinkForm
- [ ] Build verify page with domain-aware routing
- [ ] Implement token storage (secure cookies or localStorage)
- [ ] Add protected route middleware
- [ ] Handle token refresh logic

### Phase 5: Onboarding Flow (Days 10-12)
- [ ] Create (onboarding) route group layout with progress
- [ ] Build profile completion form (3 steps)
- [ ] Build organization setup form (2 steps)
- [ ] Build pending approval page with polling
- [ ] Implement avatar/logo upload with FileUpload component
- [ ] Add form validation with Zod schemas

### Phase 6: Navigation & Polish (Days 13-14)
- [ ] Implement auth guards (middleware.ts)
- [ ] Add onboarding completion checks
- [ ] Expired link handling
- [ ] Network error states
- [ ] Loading skeletons
- [ ] Animations and transitions (CSS Modules)

### Phase 7: Testing (Days 15-16)
- [ ] Unit tests for Redux slices
- [ ] Unit tests for hooks and utils
- [ ] Integration tests for forms (Jest + RTL)
- [ ] Snapshot tests for UI components

---

## Verification

After implementation:
1. Test all 4 user journeys end-to-end
2. Verify token refresh works correctly
3. Test magic link expiration handling
4. Verify organization auto-creation for work emails
5. Test join request flow and approval
6. Check responsive design on tablet
7. Verify dark mode support
8. Run Lighthouse for performance audit

---

## Key API Endpoints (Backend @ localhost:8000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/magic-link/request` | POST | Request magic link |
| `/api/v1/auth/magic-link/verify` | POST | Verify token, get JWT |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | Invalidate session |
| `/api/v1/users/me` | GET | Get current user |
| `/api/v1/users/me` | PATCH | Update profile |
| `/api/v1/organizations` | POST | Create organization |
| `/api/v1/organizations/{id}` | PATCH | Update organization |
| `/api/v1/join-requests/{id}` | GET | Check request status |

---

## Notes

1. **AUTH_ONBOARDING_PLAN.md**: Contains detailed ASCII screen designs and user flow diagrams for reference.

2. **Existing Frontend**: The current frontend structure will be replaced with the new Turborepo structure. Existing components can be migrated to packages/ui.

3. **Agent Compatibility**: This plan aligns with the senior-frontend-engineer agent at `~/.claude/agents/senior-frontend-engineer.md`
