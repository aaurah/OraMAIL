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
import { Badge } from "@/components/ui/badge";
import { Command, Mail, Send, BarChart3, Inbox, LayoutTemplate, Globe, ShieldCheck, Zap, Key } from "lucide-react";
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

const FEATURES = [
  { icon: Send, title: "Outbound Sending", desc: "Send transactional emails via any SMTP provider — Gmail, SendGrid, AWS SES, or your own server." },
  { icon: Inbox, title: "Inbound Routing", desc: "Receive, parse, and store incoming email via webhook. Full message body, headers, and attachments." },
  { icon: BarChart3, title: "Delivery Analytics", desc: "Track open rates, click-throughs, bounces, and spam complaints in real time." },
  { icon: LayoutTemplate, title: "Email Templates", desc: "Create reusable HTML + text templates. Pick from compose and auto-populate subject and body." },
  { icon: Globe, title: "Domain Management", desc: "Manage sender domains with one-click SPF, DKIM, DMARC, and MX record guidance." },
  { icon: ShieldCheck, title: "Suppression Lists", desc: "Auto-suppress bounced and spam-flagged addresses. Add manual suppressions instantly." },
  { icon: Key, title: "API Key Management", desc: "Generate secure API keys with one-time reveal. Revoke access instantly from the dashboard." },
  { icon: Zap, title: "Provider-Agnostic SMTP", desc: "Configure any SMTP endpoint from the settings panel — no vendor lock-in, ever." },
];

function LandingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-10 flex h-16 items-center px-6 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Command className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight text-lg">OraMAIL</span>
          <Badge variant="secondary" className="text-xs ml-1">Beta</Badge>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setLocation("/sign-in")}>
            Sign In
          </Button>
          <Button size="sm" onClick={() => setLocation("/sign-up")}>
            Get Started Free
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_70%)]" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 shadow-lg">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="max-w-3xl space-y-5">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Transactional email,{" "}
            <span className="text-primary">finally yours</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Send, receive, track, and analyze every email your platform delivers —
            with full control, zero vendor lock-in, and a beautiful dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="px-10 text-base font-semibold shadow-md" onClick={() => setLocation("/sign-up")}>
            Start Free
          </Button>
          <Button size="lg" variant="outline" className="px-10 text-base" onClick={() => setLocation("/sign-in")}>
            Sign In
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          {["Any SMTP provider", "Real-time analytics", "API-first", "Open tracking"].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />{t}
            </span>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-16 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Everything you need to deliver email at scale</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-card p-5 space-y-3 hover:border-primary/40 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-10">Up and running in minutes</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Connect your SMTP", desc: "Enter any SMTP credentials — or use the default OraMAIL relay. No lock-in." },
            { step: "02", title: "Verify your domain", desc: "Add SPF, DKIM, and DMARC records with our guided DNS setup." },
            { step: "03", title: "Send & analyze", desc: "Start sending emails and watch opens, clicks, and bounces in real time." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col gap-3">
              <span className="text-4xl font-black text-primary/20 leading-none">{step}</span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 border-t border-border bg-muted/20 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to take control?</h2>
          <p className="text-muted-foreground">Join teams delivering millions of emails with OraMAIL.</p>
          <Button size="lg" className="px-12 text-base font-semibold" onClick={() => setLocation("/sign-up")}>
            Create Free Account
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} OraMAIL · Transactional email infrastructure
      </footer>
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
        signIn: { start: { title: "Welcome back to OraMAIL", subtitle: "Sign in to your account" } },
        signUp: { start: { title: "Create your OraMAIL account", subtitle: "Get started in seconds" } },
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
