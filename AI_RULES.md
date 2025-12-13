# AI Rules and Project Guidelines

This document outlines the core technologies and specific rules for using libraries within the CopyMonster application.

## 1. Tech Stack Overview

The project is built using a modern, robust, and scalable stack:

*   **Frontend Framework:** React (via Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Library:** shadcn/ui (built on Radix UI primitives)
*   **Routing:** React Router DOM
*   **Data Management:** React Query (@tanstack/react-query)
*   **Backend/Auth:** Supabase (@supabase/supabase-js)
*   **Internationalization (i18n):** i18next
*   **Animations:** Framer Motion
*   **Icons:** Lucide React

## 2. Library Usage Rules

To maintain consistency and simplicity, adhere to the following rules when implementing new features or modifying existing code:

| Area | Preferred Library/Tool | Rule |
| :--- | :--- | :--- |
| **UI Components** | `shadcn/ui` | Use pre-built components from `src/components/ui/` exclusively. Do not create custom components if a suitable shadcn/ui component exists. |
| **Styling** | Tailwind CSS | All styling must be done using Tailwind utility classes. Custom CSS should be minimal and restricted to `src/index.css` for global variables and gradients. |
| **Routing** | `react-router-dom` | Use `BrowserRouter`, `Routes`, and `Route` for defining application paths. Keep all route definitions in `src/App.tsx`. |
| **Data Fetching** | `react-query` | Use React Query for managing all asynchronous server state (fetching, caching, synchronization). |
| **Authentication** | `AuthContext` & `supabase` | All user authentication (login, signup, password reset) must use the functions provided by `src/contexts/AuthContext.tsx`. |
| **Forms & Validation** | `react-hook-form` & `zod` | Use these libraries for complex form handling and schema validation. |
| **Notifications** | `sonner` and `useToast` | Use `sonner` for global, persistent notifications (e.g., success/error after navigation). Use the custom `useToast` hook for transient, contextual notifications (e.g., copy to clipboard). |
| **Icons** | `lucide-react` | Use icons only from the `lucide-react` package. |