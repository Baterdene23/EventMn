# EventMN System Architecture Diagram

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Public     │  │   Auth       │  │  Dashboard   │  │    Admin     │   │
│  │   Pages      │  │   Pages      │  │   Pages      │  │   Pages      │   │
│  │              │  │              │  │              │  │              │   │
│  │ • Home       │  │ • Login      │  │ • My Events  │  │ • User Mgmt  │   │
│  │ • Events     │  │ • Register   │  │ • My Likes   │  │ • Event Ctrl │   │
│  │ • Search     │  │ • OTP Verify │  │ • Messages   │  │ • Analytics  │   │
│  │ • Likes      │  │ • Reset Pass │  │ • Settings   │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│           │                 │                 │                 │            │
└───────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
            │                 │                 │                 │
            └─────────────────┴─────────────────┴─────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  React 19 + Next.js│
                    │  (Client Router)   │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────────────────┐
│                             NETWORKING LAYER                               │
├─────────────────────────────┼──────────────────────────────────────────────┤
│    HTTP/HTTPS (REST API)    │          WebSocket (Pusher)                  │
│                             │                                               │
│  • JSON Request/Response    │  • Real-time Chat                             │
│  • Cookies (Session)        │  • Typing Indicators                          │
│  • CORS Enabled             │  • Notifications Push                         │
│                             │  • Presence Tracking                          │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────────────┐
│                          API GATEWAY LAYER (Next.js)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  /api/auth/           /api/events/         /api/messages/      /api/users/  │
│  ├─ login             ├─ list              ├─ send             ├─ profile   │
│  ├─ register          ├─ create            ├─ get              ├─ interests │
│  ├─ verify-otp        ├─ update            ├─ delete           └─ settings  │
│  ├─ refresh           ├─ detail                                              │
│  └─ logout            └─ filter           /api/chat/          /api/admin/  │
│                                           ├─ post              └─ ...       │
│  /api/attendees/      /api/conversations/ ├─ get                            │
│  ├─ join              ├─ list             ├─ delete           /api/upload/  │
│  ├─ leave             ├─ create           └─ reactions        └─ image      │
│  └─ status            ├─ get                                                 │
│                       └─ delete           /api/notification/   /api/typing/ │
│  /api/likes/                              ├─ list             └─ status     │
│  ├─ toggle                                ├─ mark-read                      │
│  └─ count                                 └─ delete                         │
│                                                                               │
└──────────┬──────────────────────────────────────────────────────────────────┘
           │
           │ Middleware & Guards
           │ • Session validation
           │ • Role-based access control
           │ • Request validation
           │ • Rate limiting
           │
┌──────────▼──────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Auth Service   │  │  Event Service  │  │  Message Svc    │             │
│  │                 │  │                 │  │                 │             │
│  │ • OTP Gen/Val   │  │ • CRUD Events   │  │ • Save Messages │             │
│  │ • Session Mgmt  │  │ • Filter/Search │  │ • Broadcast     │             │
│  │ • Password Hash │  │ • Attendance    │  │ • Thread Mgmt   │             │
│  │ • 2FA Logic     │  │ • Capacity      │  │ • Delete        │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Notification    │  │  Chatbot        │  │  File Upload    │             │
│  │ Service         │  │  Service        │  │  Service        │             │
│  │                 │  │  (Gemini)       │  │                 │             │
│  │ • Create notif  │  │                 │  │ • Validate      │             │
│  │ • Mark read     │  │ • Generate AI   │  │ • Upload blob   │             │
│  │ • Filter by usr │  │   responses     │  │ • Generate URL  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                               │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           │ Prisma ORM
                           │ • Type-safe queries
                           │ • Relationship handling
                           │ • Migrations
                           │
┌──────────────────────────▼───────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Prisma Client - Database Query Builder                             │   │
│  │  ├─ Connection pooling (Neon adapter)                                │   │
│  │  ├─ Query optimization & caching                                    │   │
│  │  └─ Transaction support                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────────────┐
│                          DATABASE LAYER                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─ PostgreSQL (Neon)                                                        │
│  │                                                                            │
│  ├─ Users Table          ├─ Events Table         ├─ Messages               │
│  │  • id, email          │  • id, title          │  • id, content         │
│  │  • password (hash)    │  • slug, status       │  • senderId            │
│  │  • role, interests    │  • city, location     │  • conversationId      │
│  │  • 2FA enabled        │  • startAt, endAt     │  • createdAt           │
│  │  • emailVerified      │  • capacity, count    │                        │
│  │                       │  • isOnline, meetingUrl
│  │                       │  • ownerId (FK)       ├─ Notifications        │
│  ├─ Sessions            │                        │  • id, userId          │
│  │  • id, userId        ├─ Attendees            │  • type                │
│  │  • expiresAt         │  • status              │  • title, message      │
│  │                       │  • userId, eventId    │  • isRead, readAt      │
│  ├─ Conversations       │  • REGISTERED,        │                        │
│  │  • id                │    CHECKED_IN,        ├─ EmailOtp             │
│  │  • createdAt         │    CANCELLED          │  • email, codeHash    │
│  │  • members                                   │  • purpose (3 types)   │
│  │                       ├─ Likes               │  • expiresAt           │
│  │ ├─ Conversation      │  • userId, eventId    │  • attempts            │
│  │ │  Members           │                        │                        │
│  │ │  • userId          ├─ EventMessage        ├─ PrivateMessage       │
│  │ │  • lastReadAt      │  • content            │  • senderId            │
│  │ │  • joinedAt        │  • eventId, userId    │  • receiverId          │
│  │ │                     │                        │  • isRead              │
│  │ └─ Conversation      └─ (with indexes)       └─ (with indexes)       │
│  │    Messages                                                           │
│  │    • id, content                                                     │
│  │    • senderId                                                        │
│  │    • conversationId                                                  │
│  │    • createdAt                                                       │
│  │    • deletedAt (soft delete)                                         │
│  │                                                                       │
│  └─ Indexes & Relationships:                                            │
│     • Events(ownerId, city, category, isOnline)                         │
│     • Messages(conversationId, createdAt)                               │
│     • Notifications(userId, createdAt, userId+readAt)                   │
│     • Foreign key constraints with CASCADE delete                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTS                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  components/                                                  │
│  ├─ ui/                    (Base UI Library)                 │
│  │  ├─ Button.tsx        (shadcn/ui style)                 │
│  │  ├─ Input.tsx                                            │
│  │  ├─ Modal.tsx                                            │
│  │  ├─ Select.tsx                                           │
│  │  ├─ Badge.tsx                                            │
│  │  ├─ Avatar.tsx       (Radix UI)                          │
│  │  ├─ Alert-dialog.tsx                                     │
│  │  ├─ Dropdown-menu.tsx                                    │
│  │  ├─ Tabs.tsx                                             │
│  │  ├─ Skeleton.tsx                                         │
│  │  ├─ Pagination.tsx                                       │
│  │  ├─ Card.tsx                                             │
│  │  └─ Separator.tsx                                        │
│  │                                                            │
│  ├─ layout/               (Layout Components)               │
│  │  ├─ PublicAppBar.tsx  (Header for public)               │
│  │  ├─ AdminAppBar.tsx   (Header for admin)                │
│  │  ├─ AdminShell.tsx    (Admin layout wrapper)            │
│  │  ├─ Footer.tsx                                           │
│  │  ├─ PageHeader.tsx                                       │
│  │  └─ Section.tsx       (Container)                        │
│  │                                                            │
│  ├─ events/              (Event Feature Components)         │
│  │  ├─ EventCard.tsx     (Display event summary)           │
│  │  ├─ EventForm.tsx     (Create/edit form)                │
│  │  ├─ EventEditForm.tsx (Edit specific event)             │
│  │  ├─ EventMessages.tsx (Public chat)                     │
│  │  ├─ AttendButton.tsx  (Join/leave)                      │
│  │  ├─ LikeButton.tsx    (Like/unlike)                     │
│  │  ├─ LocationCard.tsx  (Address display)                 │
│  │  ├─ CategoryNav.tsx   (Filter by category)              │
│  │  └─ PrivateChat.tsx   (1-on-1 messages)                 │
│  │                                                            │
│  ├─ messages/            (Messaging Feature)                │
│  │  ├─ ChatHeader.tsx    (Conversation header)             │
│  │  ├─ MessageBubble.tsx (Message UI)                      │
│  │  ├─ MessageInput.tsx  (Input form)                      │
│  │  ├─ TypingIndicator.tsx (Typing status)                 │
│  │  ├─ ConversationItem.tsx (List item)                    │
│  │  ├─ ConversationListSkeleton.tsx                        │
│  │  ├─ EmptyState.tsx    (No messages)                     │
│  │  └─ types.ts          (TypeScript types)                │
│  │                                                            │
│  ├─ chat/                (Chat Widget)                      │
│  │  ├─ ChatWidget.tsx                                       │
│  │  └─ index.ts                                             │
│  │                                                            │
│  ├─ badges/              (Badge Components)                 │
│  │  └─ BadgeCount.tsx    (Badge with count)                │
│  │                                                            │
│  ├─ user/                (User Related)                     │
│  │  └─ InterestsSelector.tsx (Select interests)            │
│  │                                                            │
│  └─ admin/               (Admin Features)                   │
│     └─ AdminEventActions.tsx (Event management)            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Event Creation Flow

```
User Interface
     │
     │ Fill form & submit
     ▼
EventForm.tsx
     │
     │ POST /api/events
     ▼
Next.js Route Handler
     │
     ├─ Validate input
     ├─ Check authorization (middleware)
     ├─ Verify owner
     │
     ▼
Event Service
     │
     ├─ Generate slug
     ├─ Set status = DRAFT
     ├─ Upload image to Vercel Blob
     │
     ▼
Prisma Client
     │
     ├─ Create event record
     ├─ Set ownerId from session
     │
     ▼
PostgreSQL
     │
     └─ INSERT into events table
          ├─ Create indexes for:
          │  ├─ ownerId
          │  ├─ city
          │  ├─ category
          │  └─ isOnline
          │
          ▼
      Event Created
          │
          ▼
    Return response
          │
          ▼
    UI Update (toast)
```

### 2. Real-time Messaging Flow

```
User A Sends Message
     │
     │ Type message
     ▼
MessageInput.tsx
     │
     │ POST /api/chat or /api/conversations
     ▼
Next.js Route Handler
     │
     ├─ Validate message
     ├─ Check authorization
     │
     ▼
Message Service
     │
     ├─ Create message object
     ├─ Save to database
     │
     ▼
Prisma Client → PostgreSQL
     │
     ├─ INSERT message
     ├─ INDEX by conversationId, createdAt
     │
     ▼
Pusher Broadcasting
     │
     ├─ Emit: "new-message" event
     ├─ Channel: "conversation-{id}"
     │
     ▼
User B's Client (WebSocket)
     │
     ├─ Receive update
     ├─ Add message to state
     │
     ▼
MessageBubble.tsx
     │
     └─ Display message in real-time
```

### 3. Authentication Flow (Login with OTP)

```
User submits login form
     │
     ▼
/api/auth/login (POST)
     │
     ├─ Find user by email
     ├─ Verify password hash (bcryptjs)
     │
     ▼
Generate OTP
     │
     ├─ Create random 6-digit code
     ├─ Hash code (store hash in DB)
     ├─ Set expiry: 10 minutes
     │
     ▼
Store in EmailOtp table
     │
     ├─ email, codeHash, purpose
     ├─ expiresAt, attempts=0
     │
     ▼
Send Email (Nodemailer)
     │
     ├─ Template with OTP code
     ├─ Async send
     │
     ▼
User receives email → enters OTP
     │
     ▼
/api/auth/verify-otp (POST)
     │
     ├─ Hash submitted code
     ├─ Find EmailOtp record
     ├─ Compare hashes
     ├─ Check expiry & attempts
     │
     ▼
Generate Session
     │
     ├─ Create session ID (CUID)
     ├─ Set expiresAt (30 days)
     ├─ Store in DB
     │
     ▼
Set Session Cookie
     │
     ├─ Secure, HttpOnly, SameSite
     ├─ Path: /
     │
     ▼
Redirect to Dashboard
     │
     └─ User authenticated ✓
```

### 4. Notification Flow

```
Event Trigger (e.g., new attendee)
     │
     ▼
Event Service
     │
     ├─ Detect event
     ├─ Determine recipients
     │
     ▼
Notification Service
     │
     ├─ Create notification object
     ├─ Set type (e.g., NEW_ATTENDEE)
     ├─ Populate message, link
     │
     ▼
Prisma → PostgreSQL
     │
     ├─ INSERT notification
     ├─ INDEX: (userId, createdAt)
     │
     ▼
Pusher Broadcast
     │
     ├─ Channel: "user-{userId}"
     ├─ Event: "notification"
     │
     ▼
User's Client (WebSocket)
     │
     ├─ Receive notification
     ├─ Update badge count
     ├─ Show toast
     │
     ▼
User sees notification ✓
     │
     └─ Can mark as read
```

---

## Authentication & Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│           AUTHENTICATION & SECURITY LAYERS               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─ Middleware (middleware.ts)                          │
│  │  ├─ Validate session on every request                │
│  │  ├─ Check cookie signature                           │
│  │  ├─ Redirect if no session                           │
│  │  └─ Attach user to request context                   │
│  │                                                        │
│  ├─ Auth Guards (lib/auth/guards.ts)                    │
│  │  ├─ requireAuth() → redirect if not logged in       │
│  │  ├─ requireRole(role) → check USER/ORGANIZER/ADMIN  │
│  │  ├─ requireEventOwner() → owner verification        │
│  │  └─ requireAdmin() → admin only                      │
│  │                                                        │
│  ├─ OTP System (lib/auth/otp.ts)                        │
│  │  ├─ Generate secure code                             │
│  │  ├─ Hash before storing                              │
│  │  ├─ Verify with timing check                         │
│  │  └─ Track attempt limits                             │
│  │                                                        │
│  ├─ Session Management (lib/auth/session.ts)           │
│  │  ├─ Create session after login                       │
│  │  ├─ Store in encrypted cookie                        │
│  │  ├─ Validate on middleware                           │
│  │  └─ Destroy on logout                                │
│  │                                                        │
│  └─ Password Security                                    │
│     ├─ Hash with bcryptjs (cost: 12)                    │
│     ├─ Compare on login                                 │
│     ├─ Never store plaintext                            │
│     └─ Hash reset token in DB                           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## External Services Integration

```
┌──────────────────────────────────────────────────────────┐
│             EXTERNAL SERVICES                             │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─ Pusher                                               │
│  │  ├─ Authentication: App ID, Key, Secret               │
│  │  ├─ Channels: user-*, event-*, conversation-*         │
│  │  ├─ Events: message, typing, notification             │
│  │  └─ Real-time features:                               │
│  │     ├─ Chat messages                                  │
│  │     ├─ Typing indicators                              │
│  │     ├─ Presence tracking                              │
│  │     └─ Notification delivery                          │
│  │                                                         │
│  ├─ Vercel Blob                                          │
│  │  ├─ Image upload: Event covers, user avatars          │
│  │  ├─ Return public URL                                 │
│  │  ├─ Stored securely in Vercel infrastructure          │
│  │  └─ Optimized image serving                           │
│  │                                                         │
│  ├─ Neon PostgreSQL                                      │
│  │  ├─ Serverless PostgreSQL database                    │
│  │  ├─ Connection pooling                                │
│  │  ├─ Auto-scaling capacity                             │
│  │  └─ Backups & point-in-time recovery                  │
│  │                                                         │
│  ├─ Nodemailer                                           │
│  │  ├─ Send OTP codes                                    │
│  │  ├─ Password reset emails                             │
│  │  ├─ Event reminders                                   │
│  │  └─ Notification emails                               │
│  │                                                         │
│  ├─ Google Gemini API                                    │
│  │  ├─ Chatbot responses                                 │
│  │  ├─ Event recommendations                             │
│  │  ├─ Rate limiting: lib/chatbot/rate-limit.ts          │
│  │  └─ Search integration: lib/chatbot/search.ts         │
│  │                                                         │
│  └─ Vercel Deployment                                    │
│     ├─ Next.js hosting                                   │
│     ├─ Auto-scaling                                      │
│     ├─ Environment variables: .env.local                 │
│     └─ Edge Functions for performance                    │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Request/Response Cycle

```
Client Request
     │
     ▼
Next.js Router (App Router)
     ├─ Match route pattern
     ├─ Extract params
     │
     ▼
Middleware Chain
     ├─ Session validation
     ├─ CORS check
     ├─ Rate limiting
     │
     ▼
Route Handler (API Route)
     ├─ Extract method (GET, POST, etc.)
     ├─ Validate request body
     ├─ Extract headers
     │
     ▼
Authorization Check
     ├─ Check auth guards
     ├─ Verify permissions
     │
     ▼
Business Logic Layer
     ├─ Process request
     ├─ Call services
     │
     ▼
Prisma ORM
     ├─ Build query
     ├─ Execute against DB
     │
     ▼
PostgreSQL
     ├─ Execute SQL
     ├─ Return results
     │
     ▼
Response Building
     ├─ Serialize data
     ├─ Format JSON
     ├─ Add headers
     │
     ▼
NextResponse.json(data)
     │
     └─ Send to client
          │
          ▼
     Client receives
          │
          ├─ Parse JSON
          ├─ Update state
          ├─ Re-render components
          │
          └─ UI displays response ✓
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│              VERCEL DEPLOYMENT                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Repository: GitHub/GitLab                              │
│  ├─ Push to main branch                                 │
│  │                                                       │
│  ▼ Vercel Auto-deployment                              │
│  ├─ Install dependencies (pnpm install)                │
│  ├─ Build: pnpm build                                   │
│  │  ├─ Prisma generate                                  │
│  │  ├─ Next.js build                                    │
│  │  ├─ Static optimization                              │
│  │  └─ Image optimization                               │
│  │                                                       │
│  ├─ Run: next start                                     │
│  │                                                       │
│  ▼ Edge Network                                         │
│  ├─ Global CDN                                          │
│  ├─ Auto-scaling                                        │
│  ├─ SSL/TLS certificates                                │
│  └─ DDoS protection                                     │
│                                                           │
│  Environment Variables (via Vercel Dashboard):         │
│  ├─ DATABASE_URL (Neon connection string)              │
│  ├─ PUSHER_* (Pusher credentials)                      │
│  ├─ GOOGLE_GEMINI_API_KEY                              │
│  ├─ NODEMAILER_* (Email config)                        │
│  └─ BLOB_READ_WRITE_TOKEN (Vercel Blob)                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Next.js 16 | UI, routing, SSR |
| **Styling** | Tailwind CSS, shadcn/ui | Responsive design |
| **UI Library** | Radix UI | Accessible components |
| **API** | Next.js API Routes | REST endpoints |
| **Database** | PostgreSQL (Neon) | Data persistence |
| **ORM** | Prisma | Type-safe queries |
| **Real-time** | Pusher | WebSocket messaging |
| **Storage** | Vercel Blob | File uploads |
| **Email** | Nodemailer | Transactional emails |
| **Auth** | Session + OTP | User authentication |
| **Password** | bcryptjs | Secure hashing |
| **AI** | Google Gemini API | Chatbot |
| **Hosting** | Vercel | Deployment |
| **Package Manager** | pnpm | Dependencies |

---

## Key Design Decisions

1. **Monorepo Structure**: Single Next.js app for frontend + backend
2. **API Routes**: Lightweight, serverless, auto-scaling
3. **Prisma ORM**: Type safety + migrations + relationships
4. **Neon PostgreSQL**: Serverless database with connection pooling
5. **Pusher Integration**: Real-time without managing WebSocket servers
6. **Session-based Auth**: Simple, secure cookie-based approach
7. **OTP for 2FA**: Secure verification without physical devices
8. **Soft Deletes**: Preserve data history (Message model)
9. **Indexes**: Optimized queries for common filters
10. **Cascade Deletes**: Clean data removal via foreign keys

---

## Performance Optimizations

- ✅ Image optimization (Next.js + Vercel Blob)
- ✅ Database query optimization (Indexes, Prisma)
- ✅ Connection pooling (Neon adapter)
- ✅ Real-time without polling (Pusher WebSockets)
- ✅ Lazy loading components (React dynamic imports)
- ✅ Pagination for large lists
- ✅ Caching strategies (Browser + Server)
- ✅ TypeScript strict mode for early error detection
