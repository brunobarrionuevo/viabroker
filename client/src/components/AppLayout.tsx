import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ChevronDown,
  Share2,
  Globe,
  Handshake,
  Megaphone
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import TrialBanner from "./TrialBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Imóveis", href: "/dashboard/properties", icon: Home },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Agenda", href: "/dashboard/appointments", icon: Calendar },
  { name: "Meu Site", href: "/dashboard/site", icon: Globe },
  { name: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
  { name: "Integrações", href: "/dashboard/integrations", icon: Share2 },
  { name: "Parcerias", href: "/dashboard/partnerships", icon: Handshake },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

// Memoized navigation item for better performance
const NavItem = memo(({ item, isActive, onClick }: { 
  item: typeof navigation[0]; 
  isActive: boolean;
  onClick?: () => void;
}) => (
  <Link href={item.href} onClick={onClick}>
    <a className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation",
      isActive 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
    )}>
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{item.name}</span>
    </a>
  </Link>
));

NavItem.displayName = "NavItem";

// Bottom navigation for mobile
const MobileBottomNav = memo(({ location }: { location: string }) => {
  const mainNavItems = navigation.slice(0, 5); // Dashboard, Imóveis, Leads, Agenda, Meu Site
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/dashboard" && location.startsWith(item.href));
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg min-w-[60px] touch-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:text-foreground"
              )}>
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-[10px] font-medium truncate">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    window.location.href = "/";
  }, [logout]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slide-in */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-200 ease-out lg:translate-x-0 will-change-transform",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/viabroker-logo.png" 
              alt="Viabroker" 
              className="w-8 h-8 object-contain"
              loading="eager"
            />
            <span className="font-bold text-lg">Viabroker</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden touch-manipulation"
            onClick={closeSidebar}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/dashboard" && location.startsWith(item.href));
            
            return (
              <NavItem 
                key={item.name} 
                item={item} 
                isActive={isActive}
                onClick={closeSidebar}
              />
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-background/95 backdrop-blur border-b flex items-center justify-between px-4 lg:px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden touch-manipulation"
            onClick={openSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 touch-manipulation">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-sm font-medium max-w-[120px] truncate">
                  {user?.name || "Usuário"}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="truncate">{user?.name || "Usuário"}</span>
                  <span className="text-xs text-muted-foreground font-normal truncate">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <TrialBanner />
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav location={location} />
    </div>
  );
}
