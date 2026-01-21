import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyForm = lazy(() => import("./pages/PropertyForm"));
const PropertyImages = lazy(() => import("./pages/PropertyImages"));
const Leads = lazy(() => import("./pages/Leads"));
const LeadForm = lazy(() => import("./pages/LeadForm"));
const Appointments = lazy(() => import("./pages/Appointments"));
const AppointmentForm = lazy(() => import("./pages/AppointmentForm"));
const Settings = lazy(() => import("./pages/Settings"));
const PublicProperties = lazy(() => import("./pages/PublicProperties"));
const PublicPropertyDetail = lazy(() => import("./pages/PublicPropertyDetail"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Integrations = lazy(() => import("./pages/Integrations"));
const SiteCustomization = lazy(() => import("./pages/SiteCustomization"));
const RealtorSite = lazy(() => import("./pages/RealtorSite"));
const RealtorPropertyDetail = lazy(() => import("./pages/RealtorPropertyDetail"));
const MasterLogin = lazy(() => import("./pages/MasterLogin"));
const MasterDashboard = lazy(() => import("./pages/MasterDashboard"));
const MasterClientDetail = lazy(() => import("./pages/MasterClientDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ResendVerification = lazy(() => import("./pages/ResendVerification"));
const Plans = lazy(() => import("./pages/Plans"));
const Partnerships = lazy(() => import("./pages/Partnerships"));
const Marketing = lazy(() => import("./pages/Marketing"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading spinner component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Componente para proteger rotas do dashboard
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: company, isLoading: companyLoading } = trpc.company.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Ainda carregando
  if (authLoading || (isAuthenticated && companyLoading)) {
    return <PageLoader />;
  }

  // Não autenticado - redireciona para home
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Autenticado mas sem empresa - redireciona para onboarding
  if (!user?.companyId && !company) {
    return <Redirect to="/onboarding" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// Componente para a rota de onboarding
function OnboardingRoute() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: company, isLoading: companyLoading } = trpc.company.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  if (authLoading || (isAuthenticated && companyLoading)) {
    return <PageLoader />;
  }

  // Não autenticado - redireciona para home
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Já tem empresa - redireciona para dashboard
  if (user?.companyId || company) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Onboarding />
    </Suspense>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        
        {/* Marketing Route */}
        <Route path="/dashboard/marketing">
          {() => <ProtectedRoute component={Marketing} />}
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
    </Suspense>
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
