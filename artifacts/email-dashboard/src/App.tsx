import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import Emails from "@/pages/emails";
import Compose from "@/pages/compose";
import Inbound from "@/pages/inbound";
import Templates from "@/pages/templates";
import Domains from "@/pages/domains";
import Suppressions from "@/pages/suppressions";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { Command, Mail, Send, BarChart3 } from "lucide-react";
import React from "react";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function buildClerkAppearance(resolvedTheme: string | undefined) {
  const isLight = resolvedTheme === "light";
  const isAmoled = resolvedTheme === "amoled";

  const bg = isAmoled ? "hsl(0,0%,0%)" : isLight ? "hsl(210,20%,98%)" : "hsl(222,47%,11%)";
  const inputBg = isAmoled ? "hsl(0,0%,8%)" : isLight ? "hsl(214,32%,91%)" : "hsl(217,32%,17%)";
  const fg = isLight ? "hsl(222,47%,11%)" : "hsl(210,40%,98%)";
  const mutedFg = isAmoled ? "hsl(0,0%,55%)" : isLight ? "hsl(215,16%,47%)" : "hsl(215,20%,55%)";
  const neutral = isAmoled ? "hsl(0,0%,18%)" : isLight ? "hsl(214,32%,75%)" : "hsl(217,32%,25%)";

  return {
    baseTheme: isLight ? undefined : dark,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: "hsl(221, 83%, 53%)",
      colorForeground: fg,
      colorMutedForeground: mutedFg,
      colorDanger: "hsl(0, 84%, 60%)",
      colorBackground: bg,
      colorInput: inputBg,
      colorInputForeground: fg,
      colorNeutral: neutral,
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "0.5rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox: `border rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl`,
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      logoBox: "flex justify-center mb-2",
      logoImage: "h-10 w-10",
      formButtonPrimary: "bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]",
      formFieldRow: "",
      main: "",
    },
  };
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function LandingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Command className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Postmaster</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setLocation("/sign-in")}>
            Sign In
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setLocation("/sign-up")}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Transactional email,{" "}
            <span className="text-primary">under control</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Send, receive, track, and analyze every email your platform delivers. Powered by Postmark.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8" onClick={() => setLocation("/sign-up")}>
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" className="px-8" onClick={() => setLocation("/sign-in")}>
            Sign In
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground/60 pt-4">
          <div className="flex items-center gap-2"><Send className="h-4 w-4" /> Outbound emails</div>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Inbound routing</div>
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Delivery analytics</div>
        </div>
      </main>
    </div>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  const [, setLocation] = useLocation();
  const { resolvedTheme } = useTheme();
  const clerkAppearance = buildClerkAppearance(resolvedTheme);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back to Postmaster", subtitle: "Sign in to your account" } },
        signUp: { start: { title: "Create your Postmaster account", subtitle: "Get started in seconds" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/emails">
              <ProtectedRoute component={Emails} />
            </Route>
            <Route path="/emails/compose">
              <ProtectedRoute component={Compose} />
            </Route>
            <Route path="/inbound">
              <ProtectedRoute component={Inbound} />
            </Route>
            <Route path="/templates">
              <ProtectedRoute component={Templates} />
            </Route>
            <Route path="/domains">
              <ProtectedRoute component={Domains} />
            </Route>
            <Route path="/suppressions">
              <ProtectedRoute component={Suppressions} />
            </Route>
            <Route path="/settings">
              <ProtectedRoute component={Settings} />
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
