# 🎨 Coding Style Guide

## TypeScript & JavaScript

- **Formatting**: We use **Prettier**. Run `npm run format` before committing.
- **Linting**: We use **ESLint**. No console logs in production code.
- **Types**: implementation of `any` is strictly discouraged. Define interfaces in `src/types/`.

## CSS & Styling

- **Tailwind CSS**: Preferred for layout and spacing.
- **CSS Modules**: Use for complex, component-specific styles.
- **Naming**: Use descriptive class names when using CSS modules.

## Naming Conventions

| Type | Convention | Example |
| :--- | :--- | :--- |
| **Components** | PascalCase | `UserProfile.tsx` |
| **Functions** | camelCase | `getUserData()` |
| **Variables** | camelCase | `const isActive = true` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_ITEMS_PER_PAGE` |
| **Folders** | kebab-case (except components) | `user-profile/` |
