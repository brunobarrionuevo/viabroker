import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyForm from "./pages/PropertyForm";
import Leads from "./pages/Leads";
import LeadForm from "./pages/LeadForm";
import Appointments from "./pages/Appointments";
import AppointmentForm from "./pages/AppointmentForm";
import Settings from "./pages/Settings";
import PublicProperties from "./pages/PublicProperties";
import PublicPropertyDetail from "./pages/PublicPropertyDetail";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/imoveis" component={PublicProperties} />
      <Route path="/imovel/:id" component={PublicPropertyDetail} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Properties Routes */}
      <Route path="/dashboard/properties" component={Properties} />
      <Route path="/dashboard/properties/new" component={PropertyForm} />
      <Route path="/dashboard/properties/:id" component={PropertyForm} />
      
      {/* Leads Routes */}
      <Route path="/dashboard/leads" component={Leads} />
      <Route path="/dashboard/leads/new" component={LeadForm} />
      <Route path="/dashboard/leads/:id" component={LeadForm} />
      
      {/* Appointments Routes */}
      <Route path="/dashboard/appointments" component={Appointments} />
      <Route path="/dashboard/appointments/new" component={AppointmentForm} />
      <Route path="/dashboard/appointments/:id" component={AppointmentForm} />
      
      {/* Settings Routes */}
      <Route path="/dashboard/settings" component={Settings} />
      
      {/* Error Routes */}
      <Route path="/404" component={NotFound} />
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
