# Bookstore Frontend

React + TypeScript frontend for the Bookstore authentication system with Apple-inspired UI.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Test Accounts (Mock Mode)

Mock accounts are intended for local development only. Do not publish reusable passwords in documentation; configure local demo credentials outside committed source when mock mode is enabled.

## Features

- ✅ Beautiful glassmorphism UI
- ✅ Form validation with Zod
- ✅ Smooth animations with Framer Motion
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Mock authentication service

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router v6
- React Hook Form + Zod
- Axios

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8080/api
VITE_INACTIVITY_TIMEOUT=1800000
```

## Mock Mode

Currently running with mock authentication. To connect to real backend:

1. Open `src/services/authService.ts`
2. Set `MOCK_MODE = false`
3. Ensure backend is running on port 8080

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable UI components
│   └── layout/         # Layout components
├── contexts/           # React Context providers
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript types
├── utils/              # Utilities
└── App.tsx             # Main app component
```

## UI Components

### Input
Floating label input with validation and show/hide password toggle.

### Button
Primary/secondary variants with loading state and hover animations.

### Card
Glassmorphism container with backdrop blur effect.

### Toggle
Apple-style switch for "Remember Me" functionality.

## Design System

Following Apple's design guidelines with custom Tailwind configuration:

- **Primary Color**: `#007AFF` (Apple Blue)
- **Font**: SF Pro Text (system fonts)
- **Animations**: 300ms ease-out transitions
- **Border Radius**: 8px (inputs/buttons), 16px (cards)
- **Glassmorphism**: backdrop-blur + semi-transparent backgrounds
