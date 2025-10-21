import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Technical Reports Module Pages
import GenerateReport from "./modules/technical-reports/pages/GenerateReport";
import AuditKRCI from "./modules/technical-reports/pages/AuditKRCI";
import PreCertification from "./modules/technical-reports/pages/PreCertification";
import ExportStandards from "./modules/technical-reports/pages/ExportStandards";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Technical Reports Routes */}
      <Route path={"/reports/generate"} component={GenerateReport} />
      <Route path={"/reports/audit"} component={AuditKRCI} />
      <Route path={"/reports/precert"} component={PreCertification} />
      <Route path={"/reports/export"} component={ExportStandards} />
      
      <Route path={"/404"} component={NotFound} />
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

