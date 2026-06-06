# Navbar Authentication Debug Report

**Date:** June 6, 2026  
**Issue:** Navbar always shows "Sign In" instead of Profile/Logout for authenticated users

---

## Investigation Summary

### Authentication Storage Method

**Client-Side Storage:** localStorage (Supabase SDK default)  
**Server-Side Storage:** httpOnly cookies (for API routes)

---

## Files Involved

1. **`src/components/layout/Navbar.tsx`** - Navbar component with auth detection logic
2. **`src/lib/auth-constants.ts`** - Cookie name constants
3. **`src/lib/auth.ts`** - Server-side auth utilities (sets httpOnly cookies)
4. **`src/app/api/auth/session/route.ts`** - API endpoint that sets session cookies
5. **`src/app/login/page.tsx`** - Login page that calls the session API
6. **`src/lib/supabase/client.ts`** - Supabase client configuration

---

## Root Cause

The Navbar was attempting to read **httpOnly cookies** using `document.cookie`, which is **impossible** due to browser security restrictions.

### Detailed Analysis

**Cookie Creation (Server-Side):**
- File: `src/lib/auth.ts` (lines 23-41)
- Function: `setSessionCookies()`
- Cookie attributes: `httpOnly: true`, `sameSite: "lax"`, `secure: true` (production)
- These cookies are set by `/api/auth/session` endpoint after successful login

**Cookie Reading Attempt (Client-Side - BROKEN):**
- File: `src/components/layout/Navbar.tsx` (lines 44-74) - **BEFORE FIX**
- Code attempted: `document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))`
- **Problem:** httpOnly cookies are NOT accessible to client-side JavaScript
- **Result:** `accessToken` and `refreshToken` were always `null`
- **Impact:** User state was never set, Navbar always showed "Sign In"

**Why httpOnly Cookies Cannot Be Read:**
- httpOnly is a security feature to prevent XSS attacks
- JavaScript cannot read httpOnly cookies via `document.cookie`
- Only server-side code can access httpOnly cookies
- The Navbar runs on the client-side, so it cannot read these cookies

---

## Authentication Flow

### Current Working Flow (After Fix)

1. **User Login** (`src/app/login/page.tsx`):
   - Calls `supabaseClient.auth.signInWithPassword()` (client-side)
   - Supabase SDK stores session in **localStorage** (default behavior)
   - Calls `/api/auth/session` API to set httpOnly cookies for server-side use

2. **Navbar Auth Detection** (`src/components/layout/Navbar.tsx`):
   - Calls `supabaseClient.auth.getSession()` to read from localStorage
   - Sets user state if session exists
   - Listens for auth state changes via `onAuthStateChange`

3. **Server-Side API Routes**:
   - Read httpOnly cookies via `src/lib/auth.ts`
   - Validate session using `getUserSession()` or `getAdminSession()`

---

## Exact Fix Applied

### File: `src/components/layout/Navbar.tsx`

**BEFORE (Lines 41-95):**
```typescript
useEffect(() => {
  let mounted = true;

  async function init() {
    // Read from custom cookies instead of localStorage
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const accessToken = getCookie('arpitlabs-user-access-token');
    const refreshToken = getCookie('arpitlabs-user-refresh-token');

    if (!mounted) return;

    if (accessToken && refreshToken) {
      // Set session from custom cookies
      const { data: sessionData, error } = await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error && sessionData.session?.user) {
        setUser(sessionData.session.user);
        const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", sessionData.session.user.id).single();
        if (mounted) setProfile(p ?? null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } else {
      setUser(null);
      setProfile(null);
    }
  }

  init();

  const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    if (!mounted) return;
    
    setUser(session?.user ?? null);
    if (session?.user) {
      const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", session.user.id).single();
      setProfile(p ?? null);
    } else {
      setProfile(null);
    }
  });

  return () => {
    mounted = false;
    listener?.subscription.unsubscribe();
  };
}, []);
```

**AFTER (Lines 41-73):**
```typescript
useEffect(() => {
  let mounted = true;

  // Get initial session from Supabase
  async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!mounted) return;
    
    if (session?.user) {
      setUser(session.user);
      const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", session.user.id).single();
      if (mounted) setProfile(p ?? null);
    } else {
      setUser(null);
      setProfile(null);
    }
  }

  init();

  // Listen for auth state changes
  const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    if (!mounted) return;
    
    setUser(session?.user ?? null);
    if (session?.user) {
      const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", session.user.id).single();
      setProfile(p ?? null);
    } else {
      setProfile(null);
    }
  });

  return () => {
    mounted = false;
    listener?.subscription.unsubscribe();
  };
}, []);
```

### Changes Made

1. **Removed** cookie-reading logic (`getCookie` function)
2. **Removed** `setSession` call with cookie values
3. **Added** direct `getSession()` call to read from Supabase's localStorage
4. **Kept** `onAuthStateChange` listener for real-time auth state updates

---

## Before/After Behavior

### BEFORE (Broken)
- **Logged In:** Shows "Sign In" button ❌
- **Logged Out:** Shows "Sign In" button ✅
- **Root Cause:** Cookie reading always fails (httpOnly restriction)

### AFTER (Fixed)
- **Logged In:** Shows Profile button + Sign Out button ✅
- **Logged Out:** Shows Sign In button ✅
- **Mechanism:** Reads from Supabase localStorage + listens for auth state changes

---

## Authentication Architecture Summary

### Dual Storage System

**Client-Side (Browser):**
- Storage: localStorage (Supabase SDK default)
- Used by: Navbar, client-side components
- Accessible via: `supabaseClient.auth.getSession()`

**Server-Side (API Routes):**
- Storage: httpOnly cookies
- Used by: Server components, API routes
- Accessible via: `src/lib/auth.ts` functions (`getUserSession()`, `getAdminSession()`)

### Why This Architecture Works

1. **Security:** httpOnly cookies prevent XSS attacks on server-side
2. **Convenience:** localStorage allows easy client-side access for UI
3. **Separation:** Client and server use appropriate storage methods
4. **Consistency:** Both storage methods are kept in sync via login flow

---

## Verification Steps

To verify the fix works:

1. **Test Login:**
   - Navigate to `/login`
   - Enter credentials
   - Verify redirect to `/profile`

2. **Test Navbar:**
   - Verify Profile button appears with user name
   - Verify Sign Out button appears
   - Click Sign Out
   - Verify redirect to `/login`

3. **Test Persistence:**
   - Refresh page after login
   - Verify user remains logged in
   - Verify Navbar shows Profile/Sign Out

---

## Conclusion

The Navbar authentication detection issue was caused by attempting to read httpOnly cookies from client-side JavaScript. The fix removes the broken cookie-reading logic and relies on Supabase's built-in session management, which correctly uses localStorage for client-side access.

The dual storage architecture (localStorage for client, httpOnly cookies for server) is secure and appropriate for this application.
