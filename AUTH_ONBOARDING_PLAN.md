# Data2Decision - Authentication & Onboarding Frontend Plan

> **Version:** 1.0
> **Date:** 2026-03-17
> **Status:** Proposal for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas & Journeys](#2-user-personas--journeys)
3. [Authentication Flows](#3-authentication-flows)
4. [Onboarding Flows](#4-onboarding-flows)
5. [Screen Designs (ASCII)](#5-screen-designs-ascii)
6. [Technical Architecture](#6-technical-architecture)
7. [Project Structure](#7-project-structure)
8. [Implementation Plan](#8-implementation-plan)
9. [Design System Integration](#9-design-system-integration)
10. [API Integration](#10-api-integration)

---

## 1. Executive Summary

### What We're Building

A production-grade authentication and onboarding experience for Data2Decision that:

- Uses **passwordless magic link authentication** (no passwords to remember)
- Intelligently handles **work vs personal email** flows
- Automatically creates organizations for **first work-email users**
- Manages **join requests** for subsequent work-email users
- Provides seamless **profile completion** and **organization setup** onboarding
- Follows **Apple Human Interface Guidelines** for a world-class UX

### Key Differentiators

| Traditional Auth | Data2Decision Auth |
|-----------------|-------------------|
| Username + Password | Passwordless magic link |
| Manual org creation | Auto-org for work emails |
| No domain awareness | Smart domain-based routing |
| Generic onboarding | Role-aware, contextual setup |

### Target Audience

1. **CEO / Business User** - Needs zero-friction signup, clear guidance
2. **Data Engineer** - Appreciates technical elegance, wants quick access
3. **Organization Admin** - Needs to manage join requests, team setup

---

## 2. User Personas & Journeys

### Persona A: Personal Email User (e.g., Gmail)

**Profile:** Consultant, freelancer, or individual exploring the platform

**Journey:**
```
Enter Email → Receive Magic Link → Click Link → Profile Setup → Create/Join Org → Dashboard
```

**Key Needs:**
- Quick signup with no friction
- Option to create own organization
- Clear value proposition

### Persona B: Work Email User - First from Domain

**Profile:** First employee from company.com to sign up (likely a decision-maker)

**Journey:**
```
Enter Work Email → Receive Magic Link → Click Link → Auto-Org Created (Owner) → Profile Setup → Org Setup → Dashboard
```

**Key Needs:**
- Understand they're creating an organization
- Quick setup of org basics
- Ability to invite team members

### Persona C: Work Email User - Org Already Exists

**Profile:** Employee joining after someone from their company already signed up

**Journey:**
```
Enter Work Email → See "Org Exists" Notice → Receive Magic Link → Click Link → Join Request Created → Pending Screen
                                                                                         ↓
                                                                               [Admin Approves]
                                                                                         ↓
                                                                               Profile Setup → Dashboard
```

**Key Needs:**
- Know their request is pending
- Clear communication about approval process
- Notification when approved

### Persona D: Invited User

**Profile:** Someone invited via email to join an org or team

**Journey:**
```
Click Invite Link → See Invitation Details → Sign Up/Sign In → Accept Invitation → Profile Setup → Dashboard
```

**Key Needs:**
- See who invited them and to what
- Seamless account creation if new
- Clear acceptance flow

---

## 3. Authentication Flows

### 3.1 Magic Link Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAGIC LINK REQUEST                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  User lands  │
                              │  on /auth    │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Enter email  │
                              │   address    │
                              └──────┬───────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │  POST /api/auth/magic-link   │
                      │                              │
                      │  Response includes:          │
                      │  - is_work_email             │
                      │  - domain_action             │
                      │  - existing_organization     │
                      └──────────────┬───────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
     │  PERSONAL      │    │  WORK EMAIL    │    │  WORK EMAIL    │
     │  EMAIL         │    │  (First User)  │    │  (Org Exists)  │
     └────────┬───────┘    └────────┬───────┘    └────────┬───────┘
              │                     │                     │
              ▼                     ▼                     ▼
     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
     │ "Check your    │    │ "Check your    │    │ "Check your    │
     │  email"        │    │  email"        │    │  email"        │
     │                │    │ + "You'll      │    │ + "You'll      │
     │                │    │  create org"   │    │  request to    │
     │                │    │                │    │  join {org}"   │
     └────────────────┘    └────────────────┘    └────────────────┘
```

### 3.2 Magic Link Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAGIC LINK VERIFICATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │ User clicks link    │
                         │ /auth/verify?token= │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ POST /api/auth/     │
                         │      verify         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Response contains:            │
                    │ - access_token                │
                    │ - refresh_token               │
                    │ - user (id, email, user_type) │
                    │ - domain_signup (if work)     │
                    └───────────────┬───────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
       ▼                            ▼                            ▼
┌──────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ action:      │          │ action:          │          │ action:          │
│ null         │          │ organization_    │          │ join_request_    │
│ (personal)   │          │ created          │          │ created          │
└──────┬───────┘          └────────┬─────────┘          └────────┬─────────┘
       │                           │                             │
       ▼                           ▼                             ▼
┌──────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ Check if     │          │ User is OWNER    │          │ Show pending     │
│ profile      │          │ of new org       │          │ request screen   │
│ complete     │          │                  │          │                  │
└──────┬───────┘          └────────┬─────────┘          └──────────────────┘
       │                           │
       ▼                           ▼
┌──────────────┐          ┌──────────────────┐
│ Onboarding   │          │ Profile +        │
│ or Dashboard │          │ Org Setup        │
└──────────────┘          └──────────────────┘
```

### 3.3 Session Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOKEN LIFECYCLE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                     ┌─────────────────────────┐
                     │   ACCESS TOKEN          │
                     │   (15 min TTL)          │
                     └───────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
           ┌──────────────┐          ┌──────────────────┐
           │  Valid       │          │  Expired         │
           │  → Use for   │          │  → Refresh       │
           │    API calls │          │    tokens        │
           └──────────────┘          └────────┬─────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ POST /api/auth/  │
                                    │      refresh     │
                                    │                  │
                                    │ Send: refresh_   │
                                    │       token      │
                                    └────────┬─────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                     ┌──────────────┐               ┌──────────────┐
                     │  Valid       │               │  Invalid/    │
                     │  → New       │               │  Expired     │
                     │    tokens    │               │  → Logout    │
                     └──────────────┘               │  → Re-auth   │
                                                    └──────────────┘
```

---

## 4. Onboarding Flows

### 4.1 Profile Completion

**Triggered when:** User has no name set OR first login

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROFILE COMPLETION                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │  Welcome Screen     │
                         │  "Let's set up      │
                         │   your profile"     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Step 1: Name       │
                         │  ┌───────────────┐  │
                         │  │ Full name     │  │
                         │  └───────────────┘  │
                         │  ┌───────────────┐  │
                         │  │ Display name  │  │
                         │  │ (optional)    │  │
                         │  └───────────────┘  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Step 2: Avatar     │
                         │  ┌───────────────┐  │
                         │  │    [Upload]   │  │
                         │  │   or initials │  │
                         │  └───────────────┘  │
                         │  [Skip for now]     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Step 3: Timezone   │
                         │  (Auto-detected)    │
                         │  ┌───────────────┐  │
                         │  │ ▼ Select TZ   │  │
                         │  └───────────────┘  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │  Complete │
                              └───────────┘
```

### 4.2 Organization Setup (For New Org Owners)

**Triggered when:** domain_signup.action === 'organization_created'

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORGANIZATION SETUP                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │  Celebration!       │
                         │  "You've created    │
                         │   [Org Name]"       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Step 1: Org Name   │
                         │  (Pre-filled from   │
                         │   domain)           │
                         │  ┌───────────────┐  │
                         │  │ Acme Corp     │  │
                         │  └───────────────┘  │
                         │  You can customize  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Step 2: Org Logo   │
                         │  ┌───────────────┐  │
                         │  │    [Upload]   │  │
                         │  │  (optional)   │  │
                         │  └───────────────┘  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Step 3: Invite     │
                         │  Team Members       │
                         │  ┌───────────────┐  │
                         │  │ email@acme.com│  │
                         │  │ [+ Add more]  │  │
                         │  └───────────────┘  │
                         │  [Skip for now]     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │ Dashboard │
                              └───────────┘
```

### 4.3 Join Request Pending

**Triggered when:** domain_signup.action === 'join_request_created'

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         JOIN REQUEST PENDING                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │  Request Sent!      │
                         │                     │
                         │  ┌───────────────┐  │
                         │  │   [Clock]     │  │
                         │  │   Icon        │  │
                         │  └───────────────┘  │
                         │                     │
                         │  Your request to    │
                         │  join "Acme Corp"   │
                         │  has been sent to   │
                         │  the admins.        │
                         │                     │
                         │  ──────────────────│
                         │                     │
                         │  What happens next: │
                         │  1. Admin reviews   │
                         │  2. You get email   │
                         │  3. Access granted  │
                         │                     │
                         │  ──────────────────│
                         │                     │
                         │  [Check Status]     │
                         │  [Cancel Request]   │
                         └─────────────────────┘
```

---

## 5. Screen Designs (ASCII)

### 5.1 Sign In - Email Entry

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                           ┌────────────────────┐                             │
│                           │  ╔═══════════════╗ │                             │
│                           │  ║  ✦  D2D  ✦   ║ │  ← Logo                     │
│                           │  ╚═══════════════╝ │                             │
│                           └────────────────────┘                             │
│                                                                              │
│                         Sign in to Data2Decision                             │
│                    ─────────────────────────────────                         │
│               Enter your email and we'll send you a secure                   │
│                            sign-in link.                                     │
│                                                                              │
│                                                                              │
│                           Email address                                      │
│                    ┌────────────────────────────┐                            │
│                    │ you@example.com            │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │      Send Magic Link       │  ← Primary Button          │
│                    └────────────────────────────┘                            │
│                                                                              │
│                    No password needed. We'll email you a                     │
│                    secure link that expires in 15 minutes.                   │
│                                                                              │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Sign In - Work Email (Org Exists) Notice

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                           ┌────────────────────┐                             │
│                           │  ╔═══════════════╗ │                             │
│                           │  ║  ✦  D2D  ✦   ║ │                             │
│                           │  ╚═══════════════╝ │                             │
│                           └────────────────────┘                             │
│                                                                              │
│                         Sign in to Data2Decision                             │
│                    ─────────────────────────────────                         │
│                                                                              │
│                           Email address                                      │
│                    ┌────────────────────────────┐                            │
│                    │ john@acme.com              │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│               ┌────────────────────────────────────────┐                     │
│               │  ℹ️  Acme Corp is already on D2D       │  ← Info Banner      │
│               │                                        │                     │
│               │  We'll send you a link to request      │                     │
│               │  access to join your organization.     │                     │
│               └────────────────────────────────────────┘                     │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │    Continue with @acme.com │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Check Your Email

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                           ┌────────────────────┐                             │
│                           │      ╭─────╮       │                             │
│                           │     │ ✉️   │       │  ← Email Icon               │
│                           │      ╰─────╯       │                             │
│                           └────────────────────┘                             │
│                                                                              │
│                           Check your email                                   │
│                    ─────────────────────────────────                         │
│                                                                              │
│                      We sent a sign-in link to                               │
│                         john@acme.com                                        │
│                                                                              │
│                                                                              │
│               ┌────────────────────────────────────────┐                     │
│               │  The link expires in 15 minutes.       │                     │
│               │  Check your spam folder if you         │                     │
│               │  don't see it.                         │                     │
│               └────────────────────────────────────────┘                     │
│                                                                              │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │    Resend Magic Link       │  ← Secondary Button        │
│                    └────────────────────────────┘                            │
│                                                                              │
│                       Use a different email                                  │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Verifying Link (Loading)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                           ┌────────────────────┐                             │
│                           │       ◠ ◡ ◠        │  ← Spinner                  │
│                           │      ◜     ◝       │                             │
│                           │                    │                             │
│                           │      ◟     ◞       │                             │
│                           │       ◡ ◠ ◡        │                             │
│                           └────────────────────┘                             │
│                                                                              │
│                          Signing you in...                                   │
│                    ─────────────────────────────────                         │
│                    Please wait while we verify your link.                    │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Organization Created - Celebration

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                    ✨                                        │
│                              ✨    🎉    ✨                                   │
│                                    ✨                                        │
│                                                                              │
│                           ┌────────────────────┐                             │
│                           │        ✓          │  ← Success Icon              │
│                           └────────────────────┘                             │
│                                                                              │
│                      Welcome to Data2Decision!                               │
│                    ─────────────────────────────────                         │
│                                                                              │
│                 You've created your organization                             │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │                            │                            │
│                    │       🏢 Acme Corp         │  ← Org Card                │
│                    │                            │                            │
│                    │       acme.com             │                            │
│                    │       Owner                │                            │
│                    │                            │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │       Get Started          │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Profile Setup - Name

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│     ← Back                                              Step 1 of 3          │
│                                                                              │
│     ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← Progress Bar              │
│                                                                              │
│                                                                              │
│                          What's your name?                                   │
│                    ─────────────────────────────────                         │
│                   This is how you'll appear in D2D.                          │
│                                                                              │
│                                                                              │
│                           Full name *                                        │
│                    ┌────────────────────────────┐                            │
│                    │ John Doe                   │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                           Display name                                       │
│                    ┌────────────────────────────┐                            │
│                    │ johnd                      │                            │
│                    └────────────────────────────┘                            │
│                           How others see you in mentions                     │
│                                                                              │
│                                                                              │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │          Continue          │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Profile Setup - Avatar

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│     ← Back                                              Step 2 of 3          │
│                                                                              │
│     ████████████████████████████░░░░░░░░░░░░░░░                              │
│                                                                              │
│                                                                              │
│                       Add a profile picture                                  │
│                    ─────────────────────────────────                         │
│                    Help your team recognize you.                             │
│                                                                              │
│                                                                              │
│                           ┌─────────────┐                                    │
│                           │             │                                    │
│                           │     JD      │  ← Initials Fallback               │
│                           │             │                                    │
│                           └─────────────┘                                    │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │      Upload Photo          │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │          Continue          │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                           Skip for now                                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.8 Profile Setup - Timezone

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│     ← Back                                              Step 3 of 3          │
│                                                                              │
│     ████████████████████████████████████████████                             │
│                                                                              │
│                                                                              │
│                       Set your timezone                                      │
│                    ─────────────────────────────────                         │
│                Ensures times display correctly for you.                      │
│                                                                              │
│                                                                              │
│                           Timezone                                           │
│                    ┌────────────────────────────┐                            │
│                    │ America/New_York       ▼  │  ← Auto-detected            │
│                    └────────────────────────────┘                            │
│                           Detected from your browser                         │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │      Complete Setup        │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.9 Organization Setup - Name & Logo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│     ← Back                                              Step 1 of 2          │
│                                                                              │
│     ██████████████████████░░░░░░░░░░░░░░░░░░░░░                              │
│                                                                              │
│                                                                              │
│                     Customize your organization                              │
│                    ─────────────────────────────────                         │
│                                                                              │
│                                                                              │
│             ┌─────────────┐      Organization name                           │
│             │             │  ┌────────────────────────────┐                  │
│             │   Upload    │  │ Acme Corp                  │                  │
│             │    Logo     │  └────────────────────────────┘                  │
│             │             │      We generated this from acme.com             │
│             └─────────────┘                                                  │
│                                                                              │
│                              Organization URL                                │
│                          ┌────────────────────────────┐                      │
│                          │ d2d.app/org/acme-corp      │                      │
│                          └────────────────────────────┘                      │
│                                                                              │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │          Continue          │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.10 Organization Setup - Invite Team

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│     ← Back                                              Step 2 of 2          │
│                                                                              │
│     ████████████████████████████████████████████                             │
│                                                                              │
│                                                                              │
│                       Invite your team                                       │
│                    ─────────────────────────────────                         │
│             Anyone with an @acme.com email can also                          │
│                  request to join automatically.                              │
│                                                                              │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │ jane@acme.com              │  [×]                       │
│                    └────────────────────────────┘                            │
│                    ┌────────────────────────────┐                            │
│                    │ bob@acme.com               │  [×]                       │
│                    └────────────────────────────┘                            │
│                    ┌────────────────────────────┐                            │
│                    │ Enter email address...     │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                           + Add another                                      │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │   Send Invites & Finish    │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                           Skip for now                                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.11 Join Request Pending

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                           ┌────────────────────┐                             │
│                           │                    │                             │
│                           │       ⏳           │  ← Clock/Pending Icon       │
│                           │                    │                             │
│                           └────────────────────┘                             │
│                                                                              │
│                          Request pending                                     │
│                    ─────────────────────────────────                         │
│                                                                              │
│                   Your request to join Acme Corp                             │
│                      has been sent to the admins.                            │
│                                                                              │
│                                                                              │
│               ┌────────────────────────────────────────┐                     │
│               │                                        │                     │
│               │  What happens next?                    │                     │
│               │                                        │                     │
│               │  1. An admin reviews your request      │                     │
│               │  2. You'll receive an email            │                     │
│               │  3. Sign in to access the workspace    │                     │
│               │                                        │                     │
│               └────────────────────────────────────────┘                     │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │       Check Status         │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                         Cancel request                                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.12 Invitation Accept Screen

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                           ┌────────────────────┐                             │
│                           │  ╔═══════════════╗ │                             │
│                           │  ║  ✦  D2D  ✦   ║ │                             │
│                           │  ╚═══════════════╝ │                             │
│                           └────────────────────┘                             │
│                                                                              │
│                          You're invited!                                     │
│                    ─────────────────────────────────                         │
│                                                                              │
│                                                                              │
│               ┌────────────────────────────────────────┐                     │
│               │                                        │                     │
│               │  Jane Smith invited you to join        │                     │
│               │                                        │                     │
│               │       🏢  Acme Corp                    │                     │
│               │                                        │                     │
│               │  Role: Member                          │                     │
│               │                                        │                     │
│               │  "Looking forward to collaborating!"   │  ← Personal message │
│               │                                        │                     │
│               └────────────────────────────────────────┘                     │
│                                                                              │
│                    ┌────────────────────────────┐                            │
│                    │     Accept Invitation      │                            │
│                    └────────────────────────────┘                            │
│                                                                              │
│                         Decline                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technical Architecture

### 6.1 State Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STATE ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │           GLOBAL STATE              │
                    │           (Zustand)                 │
                    └──────────────────┬──────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│   Auth Store    │          │   User Store    │          │   Org Store     │
│                 │          │                 │          │                 │
│ - isAuthenticated          │ - profile       │          │ - organizations │
│ - accessToken   │          │ - preferences   │          │ - currentOrg    │
│ - refreshToken  │          │ - onboarding    │          │ - members       │
│                 │          │   status        │          │ - joinRequests  │
└─────────────────┘          └─────────────────┘          └─────────────────┘


                    ┌─────────────────────────────────────┐
                    │           SERVER STATE              │
                    │        (TanStack Query)             │
                    └──────────────────┬──────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  User Queries   │          │  Org Queries    │          │ Invite Queries  │
│                 │          │                 │          │                 │
│ - useUser()     │          │ - useOrgs()     │          │ - useInvite()   │
│ - useProfile()  │          │ - useMembers()  │          │ - usePending()  │
│ - useActivity() │          │ - useRequests() │          │                 │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

### 6.2 Route Structure

```
app/
├── (auth)/                          # Auth group (no layout chrome)
│   ├── layout.tsx                   # Minimal auth layout
│   ├── sign-in/
│   │   └── page.tsx                 # /sign-in - Email entry
│   ├── verify/
│   │   └── page.tsx                 # /verify?token= - Magic link verification
│   ├── pending/
│   │   └── page.tsx                 # /pending - Join request pending
│   └── invitation/
│       └── [token]/
│           └── page.tsx             # /invitation/[token] - Accept invitation
│
├── (onboarding)/                    # Onboarding group
│   ├── layout.tsx                   # Progress-aware layout
│   ├── welcome/
│   │   └── page.tsx                 # /welcome - Success celebration
│   ├── profile/
│   │   └── page.tsx                 # /profile - Profile setup
│   └── organization/
│       └── page.tsx                 # /organization - Org setup (owners only)
│
├── (workspace)/                     # Main app (protected)
│   ├── layout.tsx                   # App shell with sidebar
│   └── ...
│
└── api/                             # API route proxies
    └── auth/
        ├── magic-link/
        │   └── route.ts
        ├── verify/
        │   └── route.ts
        └── refresh/
            └── route.ts
```

### 6.3 Auth Flow State Machine

```typescript
type AuthState =
  | { status: 'idle' }
  | { status: 'entering_email' }
  | { status: 'sending_link'; email: string }
  | { status: 'link_sent'; email: string; isWorkEmail: boolean; orgContext?: OrgContext }
  | { status: 'verifying'; token: string }
  | { status: 'verified'; user: User; domainSignup?: DomainSignupResult }
  | { status: 'error'; error: string; canRetry: boolean };

type AuthEvent =
  | { type: 'SUBMIT_EMAIL'; email: string }
  | { type: 'LINK_SENT'; response: MagicLinkResponse }
  | { type: 'VERIFY_TOKEN'; token: string }
  | { type: 'VERIFICATION_SUCCESS'; response: TokenResponse }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'CHANGE_EMAIL' };
```

---

## 7. Project Structure

### 7.1 Proposed Directory Structure

```
frontend/
├── CLAUDE.md
├── AUTH_ONBOARDING_PLAN.md          # This document
├── package.json
├── tsconfig.json
├── tailwind.config.ts               # NEW - Tailwind configuration
├── next.config.js
│
├── app/
│   ├── layout.tsx                   # Root layout with providers
│   ├── globals.css                  # Global styles + design tokens
│   │
│   ├── (auth)/                      # Auth pages
│   │   ├── layout.tsx
│   │   ├── sign-in/page.tsx
│   │   ├── verify/page.tsx
│   │   ├── pending/page.tsx
│   │   └── invitation/[token]/page.tsx
│   │
│   ├── (onboarding)/                # Onboarding pages
│   │   ├── layout.tsx
│   │   ├── welcome/page.tsx
│   │   ├── profile/page.tsx
│   │   └── organization/page.tsx
│   │
│   ├── (workspace)/                 # Main app (protected)
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Dashboard
│   │
│   └── api/                         # Next.js API routes (proxy)
│       └── auth/
│           ├── magic-link/route.ts
│           ├── verify/route.ts
│           └── refresh/route.ts
│
├── components/
│   ├── ui/                          # Primitive components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Progress/
│   │   ├── Spinner/
│   │   ├── Toast/
│   │   └── index.ts                 # Barrel export
│   │
│   ├── auth/                        # Auth-specific components
│   │   ├── EmailForm/
│   │   ├── MagicLinkSent/
│   │   ├── VerifyingState/
│   │   ├── WorkEmailNotice/
│   │   ├── OrgCreatedCelebration/
│   │   ├── JoinRequestPending/
│   │   └── InvitationCard/
│   │
│   ├── onboarding/                  # Onboarding components
│   │   ├── ProfileForm/
│   │   ├── AvatarUpload/
│   │   ├── TimezoneSelect/
│   │   ├── OrgSetupForm/
│   │   ├── InviteTeamForm/
│   │   └── OnboardingProgress/
│   │
│   └── layout/                      # Layout components
│       ├── AuthLayout/
│       ├── OnboardingLayout/
│       └── Logo/
│
├── lib/
│   ├── api/                         # API client
│   │   ├── client.ts                # Axios/fetch wrapper with auth
│   │   ├── auth.ts                  # Auth API functions
│   │   ├── users.ts                 # User API functions
│   │   ├── organizations.ts         # Org API functions
│   │   └── types.ts                 # API types
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── auth.ts                  # Auth state
│   │   ├── user.ts                  # User state
│   │   └── onboarding.ts            # Onboarding progress
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.ts               # Auth hook
│   │   ├── useUser.ts               # User data hook
│   │   ├── useOnboarding.ts         # Onboarding state
│   │   └── useTheme.ts              # Theme hook
│   │
│   └── utils/                       # Utilities
│       ├── tokens.ts                # Token storage/refresh
│       ├── validation.ts            # Form validation
│       └── timezone.ts              # Timezone detection
│
├── providers/
│   ├── AuthProvider.tsx             # Auth context
│   ├── QueryProvider.tsx            # TanStack Query
│   └── ThemeProvider.tsx            # Theme context
│
├── styles/
│   ├── tokens.css                   # Design tokens (KEEP & ENHANCE)
│   └── animations.css               # Shared animations
│
└── types/
    ├── auth.ts                      # Auth types
    ├── user.ts                      # User types
    └── organization.ts              # Org types
```

### 7.2 Dependencies to Add

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "framer-motion": "^11.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 8. Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Set up infrastructure, design system, and auth store

| Task | Priority | Effort |
|------|----------|--------|
| Set up Tailwind CSS with design tokens | High | 2h |
| Create base UI components (Button, Input, Card) | High | 4h |
| Set up Zustand auth store | High | 2h |
| Set up TanStack Query provider | High | 1h |
| Create API client with token handling | High | 3h |
| Create AuthProvider with refresh logic | High | 3h |

**Deliverable:** Working auth infrastructure, reusable components

### Phase 2: Authentication Screens (Week 1-2)

**Goal:** Complete magic link auth flow

| Task | Priority | Effort |
|------|----------|--------|
| Sign-in page with email form | High | 4h |
| Work email detection & notice | High | 3h |
| "Check your email" screen | High | 2h |
| Verify page with token handling | High | 4h |
| Error states and recovery | High | 3h |
| Loading/verifying states | Medium | 2h |

**Deliverable:** Full magic link authentication working E2E

### Phase 3: Post-Auth Routing (Week 2)

**Goal:** Route users to correct destination after auth

| Task | Priority | Effort |
|------|----------|--------|
| Org created celebration screen | High | 3h |
| Join request pending screen | High | 3h |
| Check join request status | Medium | 2h |
| Cancel join request | Medium | 1h |
| Route logic based on domain_signup | High | 3h |

**Deliverable:** Users land on correct screen based on auth result

### Phase 4: Profile Onboarding (Week 2-3)

**Goal:** Profile completion flow

| Task | Priority | Effort |
|------|----------|--------|
| Onboarding layout with progress | High | 3h |
| Name input step | High | 2h |
| Avatar upload step | Medium | 4h |
| Timezone selection step | Medium | 2h |
| Skip functionality | Medium | 1h |
| Save profile API integration | High | 2h |

**Deliverable:** Working profile completion flow

### Phase 5: Organization Onboarding (Week 3)

**Goal:** Org setup for new owners

| Task | Priority | Effort |
|------|----------|--------|
| Org name & logo step | High | 3h |
| Team invite step | High | 4h |
| Email validation for invites | Medium | 2h |
| Send invites API integration | High | 2h |
| Skip and complete flow | Medium | 1h |

**Deliverable:** Working org setup for first-time org owners

### Phase 6: Invitations (Week 3-4)

**Goal:** Handle invitation acceptance

| Task | Priority | Effort |
|------|----------|--------|
| Invitation view page | High | 3h |
| Accept invitation flow | High | 3h |
| Decline invitation flow | Medium | 1h |
| Handle expired invitations | Medium | 2h |
| Pending invitations list | Medium | 3h |

**Deliverable:** Full invitation handling

### Phase 7: Polish & Edge Cases (Week 4)

**Goal:** Production-ready quality

| Task | Priority | Effort |
|------|----------|--------|
| Session management (multi-tab) | High | 4h |
| Token refresh on expiry | High | 3h |
| Error boundaries | High | 2h |
| Accessibility audit | High | 4h |
| Animation refinement | Medium | 3h |
| Mobile responsiveness | High | 4h |
| Loading skeleton states | Medium | 2h |

**Deliverable:** Production-ready auth & onboarding

---

## 9. Design System Integration

### 9.1 Color Tokens (Already in place)

The existing `tokens.css` has a solid foundation. We'll extend with:

```css
:root {
  /* Existing tokens preserved */

  /* Additional semantic colors for auth */
  --color-success-bg: rgba(52, 199, 89, 0.12);
  --color-warning-bg: rgba(255, 149, 0, 0.12);
  --color-error-bg: rgba(255, 59, 48, 0.12);
  --color-info-bg: rgba(0, 122, 255, 0.12);

  /* Auth-specific */
  --auth-card-bg: var(--color-background-elevated);
  --auth-card-border: var(--color-separator);
  --auth-card-shadow: var(--shadow-lg);
}
```

### 9.2 Component Design Specs

**Button Variants:**
```
┌─────────────────────────────────────────────────────────────────┐
│                         BUTTONS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Primary:     ████████████████████████  (Filled, accent-blue)   │
│               Height: 44px, Radius: 10px, Font: 15px/600        │
│                                                                  │
│  Secondary:   ░░░░░░░░░░░░░░░░░░░░░░░░  (Outlined/Tinted)       │
│               Height: 44px, Radius: 10px, Font: 15px/500        │
│                                                                  │
│  Tertiary:    Use a different email     (Plain text)            │
│               Font: 13px/400, color: accent-blue                │
│                                                                  │
│  Destructive: ████████████████████████  (Filled, accent-red)    │
│               Height: 44px, Radius: 10px, Font: 15px/600        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Input Fields:**
```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUTS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Label          ← 12px/500, tertiary color                      │
│  ┌────────────────────────────────────────┐                     │
│  │ Placeholder text                       │  ← 44px height      │
│  └────────────────────────────────────────┘    12px padding     │
│  Helper text    ← 11px/400, tertiary                            │
│                                                                  │
│  Error state:                                                    │
│  Label                                                           │
│  ┌────────────────────────────────────────┐  ← Red border       │
│  │ Invalid input                          │                     │
│  └────────────────────────────────────────┘                     │
│  Error message  ← 11px/400, accent-red                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Animation Patterns

```css
/* Entry animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Celebration */
@keyframes celebrate {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

/* Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 10. API Integration

### 10.1 API Client Setup

```typescript
// lib/api/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      return this.request<T>(endpoint, options);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.detail || 'Request failed');
    }

    return response.json();
  }
}
```

### 10.2 Auth API Functions

```typescript
// lib/api/auth.ts
export const authApi = {
  requestMagicLink: (email: string) =>
    client.post<MagicLinkResponse>('/api/auth/magic-link', { email }),

  verifyToken: (token: string) =>
    client.post<TokenResponse>('/api/auth/verify', { token }),

  refreshTokens: (refreshToken: string) =>
    client.post<TokenResponse>('/api/auth/refresh', { refresh_token: refreshToken }),

  logout: () =>
    client.post<LogoutResponse>('/api/auth/logout', {}),

  logoutAll: () =>
    client.post<LogoutResponse>('/api/auth/logout-all', {}),

  getSessions: () =>
    client.get<SessionResponse[]>('/api/auth/sessions'),

  revokeSession: (sessionId: string) =>
    client.delete<SessionRevokeResponse>(`/api/auth/sessions/${sessionId}`),
};
```

### 10.3 Type Definitions

```typescript
// types/auth.ts
export interface MagicLinkResponse {
  message: string;
  is_work_email?: boolean;
  domain_action?: 'create_organization' | 'request_to_join';
  existing_organization?: {
    name: string;
    slug: string;
  };
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user?: {
    id: string;
    email: string;
    name: string | null;
    user_type: 'personal' | 'organization';
  };
  domain_signup?: {
    action: 'organization_created' | 'join_request_created' | 'already_member' | 'request_pending';
    organization?: {
      id: string;
      name: string;
      slug: string;
      role?: string;
      is_owner?: boolean;
    };
    join_request?: {
      id: string;
      status: string;
      requested_at: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  status: 'active' | 'pending' | 'suspended' | 'deactivated';
  user_type: 'personal' | 'organization';
  email_verified_at: string | null;
  created_at: string;
}
```

---

## Summary

This plan outlines a comprehensive, production-grade authentication and onboarding system for Data2Decision that:

1. **Leverages the existing backend** - Full integration with the magic link auth, domain-aware signup, and multi-tenant organization system

2. **Follows Apple HIG** - Every screen, component, and interaction adheres to the Apple design system principles

3. **Handles all user journeys** - Personal email, work email (first user/org exists), invitations, join requests

4. **Progressive onboarding** - Profile completion and organization setup that respects user time

5. **Production-ready architecture** - Proper state management, API integration, error handling, and accessibility

### Next Steps

1. **Review this plan** and provide feedback
2. **Approve or modify** the proposed screens and flows
3. **Confirm dependencies** and technical choices
4. **Begin Phase 1** implementation

---

*This document serves as the source of truth for the authentication and onboarding frontend implementation.*
