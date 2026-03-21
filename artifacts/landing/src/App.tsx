import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import LandingPage from "@/pages/LandingPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
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
