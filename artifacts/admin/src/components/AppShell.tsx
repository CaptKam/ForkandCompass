import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Star,
  Settings,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recipes", label: "Recipes", icon: UtensilsCrossed },
  { href: "/users", label: "Users", icon: Users },
  { href: "/featured", label: "Featured", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 flex flex-col"
        style={{
          backgroundColor: "hsl(var(--sidebar))",
          borderRight: "1px solid hsl(var(--sidebar-border))",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "hsl(var(--sidebar-primary))" }}
          >
            <ChefHat
              className="w-5 h-5"
              style={{ color: "hsl(var(--sidebar-primary-foreground))" }}
            />
          </div>
          <div>
            <p
              className="font-serif font-semibold text-sm leading-tight"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            >
              Fork & Compass
            </p>
            <p
              className="text-xs"
              style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}
            >
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
                  isActive
                    ? "bg-sidebar-primary/15 text-orange-400"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
        >
          <p
            className="text-xs"
            style={{ color: "hsl(var(--sidebar-foreground) / 0.35)" }}
          >
            v1.0.0
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
