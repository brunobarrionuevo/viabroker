import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyForm from "./pages/PropertyForm";
import PropertyImages from "./pages/PropertyImages";
import Leads from "./pages/Leads";
import LeadForm from "./pages/LeadForm";
import Appointments from "./pages/Appointments";
import AppointmentForm from "./pages/AppointmentForm";
import Settings from "./pages/Settings";
import PublicProperties from "./pages/PublicProperties";
import PublicPropertyDetail from "./pages/PublicPropertyDetail";
import Onboarding from "./pages/Onboarding";
import Integrations from "./pages/Integrations";
import SiteCustomization from "./pages/SiteCustomization";
import RealtorSite from "./pages/RealtorSite";
import RealtorPropertyDetail from "./pages/RealtorPropertyDetail";
import MasterLogin from "./pages/MasterLogin";
import MasterDashboard from "./pages/MasterDashboard";
import MasterClientDetail from "./pages/MasterClientDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResendVerification from "./pages/ResendVerification";
import Plans from "./pages/Plans";
import Partnerships from "./pages/Partnerships";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

// Componente para proteger rotas do dashboard
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: company, isLoading: companyLoading } = trpc.company.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Ainda carregando
  if (authLoading || (isAuthenticated && companyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não autenticado - redireciona para home
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Autenticado mas sem empresa - redireciona para onboarding
  if (!user?.companyId && !company) {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

// Componente para a rota de onboarding
function OnboardingRoute() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: company, isLoading: companyLoading } = trpc.company.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading || (isAuthenticated && companyLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não autenticado - redireciona para home
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Já tem empresa - redireciona para dashboard
  if (user?.companyId || company) {
    return <Redirect to="/dashboard" />;
  }

  return <Onboarding />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/imoveis" component={PublicProperties} />
      <Route path="/imovel/:id" component={PublicPropertyDetail} />
      
      {/* Autenticação Própria */}
      <Route path="/login" component={Login} />
      <Route path="/cadastro" component={Register} />
      <Route path="/verificar-email" component={VerifyEmail} />
      <Route path="/esqueci-senha" component={ForgotPassword} />
      <Route path="/redefinir-senha" component={ResetPassword} />
      <Route path="/reenviar-verificacao" component={ResendVerification} />
      <Route path="/planos" component={Plans} />
      
      {/* Onboarding Route */}
      <Route path="/onboarding" component={OnboardingRoute} />
      
      {/* Dashboard Routes - Protected */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      {/* Properties Routes */}
      <Route path="/dashboard/properties">
        {() => <ProtectedRoute component={Properties} />}
      </Route>
      <Route path="/dashboard/properties/new">
        {() => <ProtectedRoute component={PropertyForm} />}
      </Route>
      <Route path="/dashboard/properties/:id/edit" component={() => <ProtectedRoute component={PropertyForm} />} />
      <Route path="/dashboard/properties/:id/images" component={() => <ProtectedRoute component={PropertyImages} />} />
      <Route path="/dashboard/properties/:id" component={() => <ProtectedRoute component={PropertyForm} />} />
      
      {/* Leads Routes */}
      <Route path="/dashboard/leads">
        {() => <ProtectedRoute component={Leads} />}
      </Route>
      <Route path="/dashboard/leads/new">
        {() => <ProtectedRoute component={LeadForm} />}
      </Route>
      <Route path="/dashboard/leads/:id">
        {() => <ProtectedRoute component={LeadForm} />}
      </Route>
      
      {/* Appointments Routes */}
      <Route path="/dashboard/appointments">
        {() => <ProtectedRoute component={Appointments} />}
      </Route>
      <Route path="/dashboard/appointments/new">
        {() => <ProtectedRoute component={AppointmentForm} />}
      </Route>
      <Route path="/dashboard/appointments/:id">
        {() => <ProtectedRoute component={AppointmentForm} />}
      </Route>
      
      {/* Settings Routes */}
      <Route path="/dashboard/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      
      {/* Partnerships Route */}
      <Route path="/dashboard/partnerships">
        {() => <ProtectedRoute component={Partnerships} />}
      </Route>
      
      {/* Integrations Routes */}
      <Route path="/dashboard/integrations">
        {() => <ProtectedRoute component={Integrations} />}
      </Route>
      
      {/* Site Customization Routes */}
      <Route path="/dashboard/site">
        {() => <ProtectedRoute component={SiteCustomization} />}
      </Route>
      
      {/* Realtor Public Site Routes */}
      <Route path="/site/:slug" component={RealtorSite} />
      <Route path="/site/:slug/imovel/:id" component={RealtorPropertyDetail} />
      
      {/* Master Admin Routes - Independente */}
      <Route path="/master" component={MasterLogin} />
      <Route path="/master/dashboard" component={MasterDashboard} />
      <Route path="/master/client/:id" component={MasterClientDetail} />
      
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
