# EventMN

Монголын арга хэмжээ (event) олох, удирдах платформ.

## Технологийн стек

| Технологи | Хувилбар | Зориулалт |
|-----------|----------|-----------|
| **Next.js** | 16.1.1 | React framework (App Router) |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Prisma** | 7.2.0 | ORM (PostgreSQL) |
| **Neon** | - | Serverless PostgreSQL |
| **Pusher** | 5.3.2 | Real-time messaging |
| **Tailwind CSS** | 4.x | Styling |
| **Radix UI** | - | Headless UI components |
| **Nodemailer** | 7.x | Email илгээх |
| **Google Gemini** | - | AI chatbot |
| **Vercel Blob** | 2.x | File storage |

## Үндсэн функцууд

### 1. Арга хэмжээ (Events)
- Арга хэмжээ үүсгэх, засах, устгах
- Ангилал: Music, Arts, Business, Food & Drink, Sports, Tech, Community, Education, Health
- Байршил: Улаанбаатар, Дархан, Эрдэнэт, Онлайн
- Хайлт, шүүлтүүр (нэр, байршил, ангилал, үнэ)
- Like/Bookmark хийх
- Оролцогч бүртгэл (Attend/Unattend)
- Төлөв: Draft -> Published -> Completed/Cancelled

### 2. Хэрэглэгчийн систем
- Бүртгүүлэх, нэвтрэх (email/password)
- Email баталгаажуулалт (OTP код)
- Нууц үг сэргээх (OTP)
- Хоёр шатлалт баталгаажуулалт (2FA)
- Сонирхлын категори сонгох (personalized recommendations)
- Профайл удирдах (нэр, зураг)

### 3. Мессеж систем
- Хэрэглэгч хоорондын шууд чат (Conversations)
- Арга хэмжээний нийтийн хэлэлцүүлэг (Event Messages)
- Зохион байгуулагчтай хувийн чат (Private Messages)
- Real-time мессеж (Pusher)
- Typing indicator (бичиж байна...)
- Уншаагүй мессежийн тоо (badge)

### 4. Мэдэгдлүүд (Notifications)
- Арга хэмжээний сануулга
- Шинэ оролцогч
- Like мэдэгдэл
- Системийн мэдэгдэл

### 5. AI Chatbot
- Google Gemini API
- Арга хэмжээ хайх (байгалийн хэлээр)
- FAQ хариулах
- Санал болгох (recommendations)

## Хэрэглэгчийн эрх (Roles)

| Role | Эрх |
|------|-----|
| **USER** | Арга хэмжээ үзэх, оролцох, like хийх, мессеж бичих |
| **ORGANIZER** | USER + Арга хэмжээ үүсгэх, засах, нийтлэх |
| **ADMIN** | Бүх эрх + Хэрэглэгч удирдах, бүх арга хэмжээг удирдах |

## Хуудсууд

### Нийтийн хуудсууд
| URL | Тайлбар |
|-----|---------|
| `/` | Нүүр хуудас |
| `/events` | Арга хэмжээний жагсаалт |
| `/events/[id]` | Арга хэмжээний дэлгэрэнгүй |
| `/events/create` | Шинэ арга хэмжээ үүсгэх |
| `/search` | Хайлт |
| `/c/[category]` | Ангиллаар шүүх |
| `/d/[location]` | Байршлаар шүүх |
| `/likes` | Таалагдсан арга хэмжээнүүд |

### Хэрэглэгчийн хуудсууд
| URL | Тайлбар |
|-----|---------|
| `/dashboard` | Хянах самбар |
| `/dashboard/messages` | Мессежүүд |
| `/dashboard/notification` | Мэдэгдлүүд |
| `/dashboard/settings` | Тохиргоо (профайл, нууцлал) |

### Админ хуудсууд
| URL | Тайлбар |
|-----|---------|
| `/admin` | Админ самбар |
| `/admin/events` | Бүх арга хэмжээ удирдах |
| `/admin/users` | Хэрэглэгч удирдах |
| `/admin/reports` | Тайлан |

## API Endpoints

### Authentication
```
POST /api/auth/register     - Бүртгүүлэх
POST /api/auth/login        - Нэвтрэх
POST /api/auth/logout       - Гарах
POST /api/auth/send-otp     - OTP илгээх
POST /api/auth/verify-otp   - OTP шалгах
POST /api/auth/reset-password - Нууц үг сэргээх
POST /api/auth/login-otp    - 2FA шалгах
```

### Events
```
GET    /api/events              - Жагсаалт
POST   /api/events              - Үүсгэх
GET    /api/events/[id]         - Дэлгэрэнгүй
PATCH  /api/events/[id]         - Засах
DELETE /api/events/[id]         - Устгах
POST   /api/events/[id]/attend  - Бүртгүүлэх
DELETE /api/events/[id]/attend  - Бүртгэл цуцлах
```

### Messages
```
GET  /api/conversations                  - Харилцааны жагсаалт
POST /api/conversations                  - Шинэ харилцаа
GET  /api/conversations/[id]/messages    - Мессежүүд
POST /api/conversations/[id]/messages    - Мессеж илгээх
POST /api/typing                         - Typing indicator
```

### Notifications
```
GET  /api/notification       - Мэдэгдлүүд авах
POST /api/notification/read  - Уншсан гэж тэмдэглэх
```

## Өгөгдлийн сангийн бүтэц

```
User                 - Хэрэглэгч
├── Session          - Нэвтрэлтийн session
├── Event            - Үүсгэсэн арга хэмжээнүүд
├── Like             - Таалагдсан арга хэмжээнүүд
├── Attendee         - Оролцож буй арга хэмжээнүүд
├── Notification     - Мэдэгдлүүд
├── Message          - Илгээсэн мессежүүд
└── ConversationMember - Харилцаанууд

Event
├── Attendee         - Оролцогчид
├── Like             - Like-ууд
├── EventMessage     - Нийтийн хэлэлцүүлэг
└── PrivateMessage   - Хувийн мессежүүд

Conversation
├── ConversationMember - Гишүүд
└── Message          - Мессежүүд

EmailOtp             - OTP кодууд (email verification, 2FA, password reset)
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Pusher (Real-time)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Google Gemini AI
GEMINI_API_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Эхлүүлэх

```bash
# Dependencies суулгах
pnpm install

# Database schema push
pnpm db:push

# Development server
pnpm dev

# Production build
pnpm build
pnpm start
```

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint шалгах
pnpm db:generate  # Prisma client generate
pnpm db:push      # Database schema push
pnpm db:migrate   # Database migration
pnpm db:studio    # Prisma Studio (DB viewer)
```

## Төслийн бүтэц

```
eventmn/
├── app/                    # Next.js App Router
│   ├── (public)/          # Нийтийн хуудсууд
│   ├── (auth)/            # Нэвтрэлтийн хуудсууд
│   ├── (dashboard)/       # Хэрэглэгчийн хуудсууд
│   ├── (admin)/           # Админ хуудсууд
│   └── api/               # API endpoints
├── components/
│   ├── ui/                # UI компонентууд (Button, Input, Modal...)
│   ├── events/            # Арга хэмжээний компонентууд
│   ├── messages/          # Мессежийн компонентууд
│   ├── chat/              # AI Chatbot
│   ├── layout/            # Layout компонентууд
│   └── admin/             # Админ компонентууд
├── lib/
│   ├── auth/              # Authentication logic
│   ├── data/              # Data fetching functions
│   ├── chatbot/           # AI chatbot logic
│   ├── pusher/            # Pusher client/server
│   ├── db/                # Database client
│   └── utils/             # Utility functions
├── hooks/                 # React hooks
└── prisma/
    └── schema.prisma      # Database schema
```

## Deploy

Vercel дээр deploy хийхдээ:

1. GitHub repo-г Vercel-тэй холбох
2. Environment variables тохируулах
3. Build command: `pnpm build`
4. Deploy

---

**EventMN** - Монголын арга хэмжээний платформ
