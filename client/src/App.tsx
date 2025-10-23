import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Páginas públicas (carregadas imediatamente)
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import NotFound from "@/pages/NotFound";

// Auth Pages (lazy loading)
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

// Account Pages (lazy loading)
const Success = lazy(() => import("./pages/Success"));
const Cancel = lazy(() => import("./pages/Cancel"));
const Account = lazy(() => import("./pages/Account"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Reports = lazy(() => import("./pages/Reports"));
const Audits = lazy(() => import("./pages/Audits"));
const Settings = lazy(() => import("./pages/Settings"));

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
        {/* Auth Routes (públicas) */}
        <Route path={"/login"} component={Login} />
        <Route path={"/register"} component={Register} />
        <Route path={"/forgot-password"} component={ForgotPassword} />
        <Route path={"/auth/callback"} component={AuthCallback} />
        
        {/* Account Routes (protegidas) */}
        <Route path={"/success"}>
          <PrivateRoute><Success /></PrivateRoute>
        </Route>
        <Route path={"/cancel"}>
          <PrivateRoute><Cancel /></PrivateRoute>
        </Route>
        <Route path={"/account"}>
          <PrivateRoute><Account /></PrivateRoute>
        </Route>
        <Route path={"/subscription"}>
          <PrivateRoute><Subscription /></PrivateRoute>
        </Route>
        <Route path={"/dashboard"}>
          <PrivateRoute><Dashboard /></PrivateRoute>
        </Route>
        <Route path={"/admin"}>
          <PrivateRoute><Admin /></PrivateRoute>
        </Route>
        <Route path={"/reports"}>
          <PrivateRoute><Reports /></PrivateRoute>
        </Route>
        <Route path={"/audits"}>
          <PrivateRoute><Audits /></PrivateRoute>
        </Route>
        <Route path={"/settings"}>
          <PrivateRoute><Settings /></PrivateRoute>
        </Route>
        
        {/* Technical Reports Routes (protegidas) */}
        <Route path={"/reports/generate"}>
          <PrivateRoute><GenerateReport /></PrivateRoute>
        </Route>
        <Route path={"/reports/audit"}>
          <PrivateRoute><AuditKRCI /></PrivateRoute>
        </Route>
        <Route path={"/reports/precert"}>
          <PrivateRoute><PreCertification /></PrivateRoute>
        </Route>
        <Route path="/reports/export">
          <PrivateRoute><ExportStandards /></PrivateRoute>
        </Route>
        <Route path="/reports/:reportId/review">
          {(params) => (
            <PrivateRoute>
              <ReviewReport {...params} />
            </PrivateRoute>
          )}
        </Route>
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
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

