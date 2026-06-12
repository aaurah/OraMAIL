import React from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  Activity,
  Send,
  Inbox,
  LayoutTemplate,
  Globe,
  Ban,
  Menu,
  Command,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/emails", label: "Outbound", icon: Send },
    { href: "/inbound", label: "Inbound", icon: Inbox },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/domains", label: "Domains", icon: Globe },
    { href: "/suppressions", label: "Suppressions", icon: Ban },
  ];

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() ?? "PM";

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.emailAddresses?.[0]?.emailAddress ?? "Account";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
              <Command className="h-5 w-5" />
            </div>
            <span className="font-semibold text-sidebar-foreground tracking-tight">Postmaster</span>
          </Link>
        </div>

        <nav className="mt-6 flex flex-col gap-1 px-3 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-sidebar-foreground/50"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3 space-y-1">
          <Link href="/settings">
            <div
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                location === "/settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className={`h-4 w-4 ${location === "/settings" ? "text-primary" : "text-sidebar-foreground/50"}`} />
              Settings
            </div>
          </Link>

          <div className="border-t border-sidebar-border pt-3 mt-2">
            {isLoaded && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={user.imageUrl} alt={displayName} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs">{displayName}</span>
                    <ChevronDown className="h-3 w-3 ml-auto shrink-0 text-sidebar-foreground/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.emailAddresses?.[0]?.emailAddress}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => signOut({ redirectUrl: basePath || "/" })}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-7 w-7 rounded-full bg-sidebar-accent animate-pulse" />
                <div className="h-3 w-24 bg-sidebar-accent rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b bg-background px-4 sm:px-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="-ml-2"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
