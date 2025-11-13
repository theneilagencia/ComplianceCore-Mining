import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@/shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./i18n"; // Inicializar i18n
import "./index.css";
import { initErrorMonitoring } from "./utils/errorMonitoring";

// Initialize error monitoring
initErrorMonitoring();

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
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
      // Use absolute URL from VITE_API_URL, fallback to relative for local development
      url: API_BASE_URL ? `${API_BASE_URL}/api/trpc` : "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Get access token from localStorage
        const accessToken = localStorage.getItem('accessToken');
        
        // Add Authorization header if token exists
        const headers = {
          ...(init?.headers ?? {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };
        
        // If input is a relative URL and we have API_BASE_URL, convert to absolute
        let finalUrl = input;
        if (typeof input === 'string') {
          // If it's a relative URL (starts with /) and we have API_BASE_URL, make it absolute
          if (input.startsWith('/') && API_BASE_URL) {
            finalUrl = `${API_BASE_URL}${input}`;
          }
          // If it's already an absolute URL, use it as is
        } else if (input instanceof Request) {
          // If it's a Request object, check if URL is relative
          const url = input.url;
          if (url.startsWith('/') && API_BASE_URL) {
            finalUrl = new Request(`${API_BASE_URL}${url}`, input);
          } else {
            finalUrl = input;
          }
        }
        
        return globalThis.fetch(finalUrl, {
          ...(init ?? {}),
          credentials: "include", // Important: send cookies for cross-origin requests
          headers,
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
