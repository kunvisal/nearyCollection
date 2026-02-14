# 🏗️ Project Structure & Standards

## Folder Layout

The project follows the standard **Next.js App Router** structure.

```
src/
├── app/                 # Next.js App Router (Pages & Layouts)
│   ├── (shop)/          # Public storefront route group
│   └── (admin)/         # Admin dashboard route group
├── components/          # React Components
│   ├── Shop/            # Storefront-specific components
│   ├── Admin/           # Admin-specific components
│   └── UI/              # Shared UI components (Buttons, Inputs)
├── lib/                 # Utility functions, API clients
├── types/               # TypeScript interfaces & types
└── styles/              # Global styles (Tailwind, CSS modules)
```

## Component Rules

- **Colocation**: Keep styles and tests near the component.
- **Naming**: Use PascalCase for components (`ProductCard.tsx`) and camelCase for utilities (`formatPrice.ts`).
- **Imports**: Use absolute imports `@/components/...` instead of relative `../../`.

## State Management

- Use **React Context** for global UI state (Theme, Sidebar).
- Use **server-side fetching** where possible (Server Components).
