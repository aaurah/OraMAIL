import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import Emails from "@/pages/emails";
import Compose from "@/pages/compose";
import Inbound from "@/pages/inbound";
import Templates from "@/pages/templates";
import Domains from "@/pages/domains";
import Suppressions from "@/pages/suppressions";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/emails" component={Emails} />
      <Route path="/emails/compose" component={Compose} />
      <Route path="/inbound" component={Inbound} />
      <Route path="/templates" component={Templates} />
      <Route path="/domains" component={Domains} />
      <Route path="/suppressions" component={Suppressions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppLayout>
            <Router />
          </AppLayout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
