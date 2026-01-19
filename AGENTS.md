# AGENTS.md

## Build/Lint/Test Commands
- **Package manager**: pnpm
- **Dev**: `pnpm dev` | **Build**: `pnpm build` | **Lint**: `pnpm lint`
- **Single test**: No test framework configured. If added: `pnpm vitest run path/to/file.test.ts`

## Code Style Guidelines

### Imports (in order)
1. `"use client"` directive (if needed)
2. React/Next.js (`import * as React`, `next/link`, `next/navigation`)
3. Third-party (`@radix-ui/*`, `class-variance-authority`)
4. Internal with `@/` alias (`@/components/ui/Button`, `@/lib/utils`)

### Naming Conventions
- **Components/Types**: PascalCase (`EventCard.tsx`, `Session`)
- **Functions/utils**: camelCase (`getSession`, `formatDate`)
- **Constants**: SCREAMING_SNAKE_CASE (`SESSION_COOKIE_NAME`)

### TypeScript
- Strict mode enabled. Always provide explicit types for function parameters and return values.
- Use `@/*` path alias for imports. Avoid relative paths like `../../`.

### Components
- Use function declarations (not arrow) for exported components
- Destructure props with defaults: `function Button({ variant = "default", ...props })`
- Use `cn()` from `@/lib/utils` for conditional class names
- Use `cva()` for component variants (shadcn/ui pattern)

### Error Handling
- API routes: `NextResponse.json({ error: "message" }, { status: 4xx })`
- Use try/catch for async operations. Check nulls before access.
