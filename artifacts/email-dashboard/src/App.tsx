import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
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

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(221, 83%, 53%)",
    colorForeground: "hsl(210, 40%, 98%)",
    colorMutedForeground: "hsl(215, 20%, 55%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(222, 47%, 11%)",
    colorInput: "hsl(217, 32%, 17%)",
    colorInputForeground: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(217, 32%, 25%)",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(222,47%,11%)] border border-[hsl(217,32%,17%)] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(210,40%,98%)]",
    headerSubtitle: "text-[hsl(215,20%,55%)]",
    socialButtonsBlockButtonText: "text-[hsl(210,40%,98%)]",
    formFieldLabel: "text-[hsl(210,40%,98%)]",
    footerActionLink: "text-[hsl(221,83%,63%)]",
    footerActionText: "text-[hsl(215,20%,55%)]",
    dividerText: "text-[hsl(215,20%,55%)]",
    identityPreviewEditButton: "text-[hsl(221,83%,63%)]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-[hsl(210,40%,98%)]",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border-[hsl(217,32%,25%)] bg-[hsl(217,32%,17%)] hover:bg-[hsl(217,32%,22%)]",
    formButtonPrimary: "bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]",
    formFieldInput: "bg-[hsl(217,32%,17%)] border-[hsl(217,32%,25%)] text-[hsl(210,40%,98%)]",
    footerAction: "border-t border-[hsl(217,32%,17%)]",
    dividerLine: "bg-[hsl(217,32%,25%)]",
    alert: "border-[hsl(217,32%,25%)]",
    otpCodeFieldInput: "bg-[hsl(217,32%,17%)] border-[hsl(217,32%,25%)] text-[hsl(210,40%,98%)]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(222,47%,8%)] px-4">
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(222,47%,8%)] px-4">
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
    <div className="flex min-h-[100dvh] flex-col bg-[hsl(222,47%,8%)] text-white">
      <header className="flex h-16 items-center px-6 border-b border-[hsl(217,32%,17%)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
            <Command className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight">Postmaster</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => setLocation("/sign-in")}>
            Sign In
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setLocation("/sign-up")}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-600/30">
          <Mail className="h-10 w-10 text-blue-400" />
        </div>
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Transactional email,{" "}
            <span className="text-blue-400">under control</span>
          </h1>
          <p className="text-lg text-white/60">
            Send, receive, track, and analyze every email your platform delivers. Powered by Postmark.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8" onClick={() => setLocation("/sign-up")}>
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8" onClick={() => setLocation("/sign-in")}>
            Sign In
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-white/40 pt-4">
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
