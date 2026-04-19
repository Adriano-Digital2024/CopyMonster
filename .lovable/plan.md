
Let me analyze the signup flow to understand both issues.

Issue 1: Toast notification too small/invisible on signup
- Auth.tsx uses `toast.success` and `toast.info` from sonner
- Sonner toaster is configured in App.tsx via `<Sonner />` from `@/components/ui/sonner`
- Need to check sonner config and override position/style for signup confirmation

Issue 2: Email verification redirects to home instead of dashboard
- After clicking verification link, Supabase redirects to `emailRedirectTo` URL
- Need to check AuthContext signup function for `emailRedirectTo` parameter
- Likely missing or set to `/` instead of `/dashboard`

Let me check the files.
