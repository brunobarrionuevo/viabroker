import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

// Declare global types for custom domain redirect
declare global {
  interface Window {
    __CUSTOM_DOMAIN_SLUG__?: string;
    __CUSTOM_DOMAIN_REDIRECT__?: string;
  }
}

// Handle custom domain redirect BEFORE React renders
// This ensures the URL is correct before the router initializes
if (window.__CUSTOM_DOMAIN_REDIRECT__ && window.location.pathname === '/') {
  console.log('[CustomDomain] Redirecting to:', window.__CUSTOM_DOMAIN_REDIRECT__);
  // Use replaceState to change URL without reload, then React Router will handle it
  window.history.replaceState(null, '', window.__CUSTOM_DOMAIN_REDIRECT__);
}

// Safari iOS fix: Restore scroll position and prevent redirect to home on refresh
// Safari sometimes loses the current route on refresh due to bfcache behavior
if (typeof window !== 'undefined') {
  // Update stored path on every navigation
  const updateStoredPath = () => {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/') {
      sessionStorage.setItem('__LAST_PATH__', currentPath);
    }
  };
  
  // Store current path before unload
  window.addEventListener('beforeunload', updateStoredPath);
  
  // Also update on popstate (back/forward navigation)
  window.addEventListener('popstate', updateStoredPath);
  
  // Update path periodically to catch programmatic navigation
  setInterval(updateStoredPath, 1000);
  
  // Restore path on page show (handles Safari's bfcache)
  window.addEventListener('pageshow', (event) => {
    // Only restore if page was loaded from bfcache (persisted) or fresh load
    const lastPath = sessionStorage.getItem('__LAST_PATH__');
    const currentPath = window.location.pathname + window.location.search;
    
    // If we're at root but had a different path stored, restore it
    if (lastPath && currentPath === '/' && lastPath !== '/') {
      console.log('[Safari Fix] Restoring path from:', currentPath, 'to:', lastPath);
      window.history.replaceState(null, '', lastPath);
      // Force wouter to recognize the new path
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });
  
  // Also handle visibility change for Safari tab switching
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const lastPath = sessionStorage.getItem('__LAST_PATH__');
      const currentPath = window.location.pathname + window.location.search;
      
      if (lastPath && currentPath === '/' && lastPath !== '/') {
        console.log('[Safari Fix] Visibility change - restoring path:', lastPath);
        window.history.replaceState(null, '', lastPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  });
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Redirecionar para página de login própria
  window.location.href = "/login";
};


queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
