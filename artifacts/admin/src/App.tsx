import { Route, Switch, Router } from "wouter";
import { Toaster } from "sonner";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RecipesPage } from "@/pages/RecipesPage";
import { RecipeEditPage } from "@/pages/RecipeEditPage";
import { UsersPage } from "@/pages/UsersPage";
import { UserDetailPage } from "@/pages/UserDetailPage";
import { FeaturedPage } from "@/pages/FeaturedPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <Router base="/admin">
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <AppShell>
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/recipes" component={RecipesPage} />
              <Route path="/recipes/:id" component={RecipeEditPage} />
              <Route path="/users" component={UsersPage} />
              <Route path="/users/:id" component={UserDetailPage} />
              <Route path="/featured" component={FeaturedPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route>
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Page not found</p>
                </div>
              </Route>
            </Switch>
          </AppShell>
        </Route>
      </Switch>
      <Toaster position="bottom-right" richColors />
    </Router>
  );
}
