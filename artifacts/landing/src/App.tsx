import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import LandingPage from "@/pages/LandingPage";
import FeaturesPage from "@/pages/FeaturesPage";
import DestinationsPage from "@/pages/DestinationsPage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import PressPage from "@/pages/PressPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/destinations" component={DestinationsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/press" component={PressPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}
