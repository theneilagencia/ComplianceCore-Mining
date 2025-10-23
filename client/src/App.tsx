import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Páginas públicas (carregadas imediatamente)
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import NotFound from "@/pages/NotFound";

// Auth Pages (lazy loading)
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

// Account Pages (lazy loading)
const Success = lazy(() => import("./pages/Success"));
const Cancel = lazy(() => import("./pages/Cancel"));
const Account = lazy(() => import("./pages/Account"));
const Subscription = lazy(() => import("./pages/Subscription"));

// Technical Reports Module Pages (lazy loading)
const GenerateReport = lazy(() => import("./modules/technical-reports/pages/GenerateReport"));
const AuditKRCI = lazy(() => import("./modules/technical-reports/pages/AuditKRCI"));
const PreCertification = lazy(() => import("./modules/technical-reports/pages/PreCertification"));
const ExportStandards = lazy(() => import("./modules/technical-reports/pages/ExportStandards"));
const ReviewReport = lazy(() => import("./modules/technical-reports/pages/ReviewReport"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function Router() {
  return (
    <Switch>
      {/* Páginas públicas (sem lazy loading) */}
      <Route path={"/"} component={Home} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/plans"} component={Pricing} />
      <Route path={"/404"} component={NotFound} />
      
      {/* Páginas autenticadas (com lazy loading) */}
      <Suspense fallback={<PageLoader />}>
        {/* Auth Routes */}
        <Route path={"/login"} component={Login} />
        <Route path={"/register"} component={Register} />
        <Route path={"/auth/callback"} component={AuthCallback} />
        
        {/* Account Routes */}
        <Route path={"/success"} component={Success} />
        <Route path={"/cancel"} component={Cancel} />
        <Route path={"/account"} component={Account} />
        <Route path={"/subscription"} component={Subscription} />
        
        {/* Technical Reports Routes */}
        <Route path={"/reports/generate"} component={GenerateReport} />
        <Route path={"/reports/audit"} component={AuditKRCI} />
        <Route path={"/reports/precert"} component={PreCertification} />
        <Route path="/reports/export" component={ExportStandards} />
        <Route path="/reports/:reportId/review" component={ReviewReport} />
      </Suspense>
      
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

