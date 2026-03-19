import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import "katex/dist/katex.min.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// A simple fallback Toaster component in case the UI folder one isn't fully generated
const SimpleFallbackToaster = () => {
  return null; // The app relies mainly on inline errors, but keeping this for API compatibility
};

const SimpleFallbackTooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Using standard fallbacks for context providers just in case the template files are missing
  const SafeToaster = typeof Toaster !== 'undefined' ? Toaster : SimpleFallbackToaster;
  const SafeTooltipProvider = typeof TooltipProvider !== 'undefined' ? TooltipProvider : SimpleFallbackTooltipProvider;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeTooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <SafeToaster />
      </SafeTooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
