import { useQuery } from "@tanstack/react-query";
import { Shield, Key, Database, Download } from "lucide-react";
import { fetchStats } from "@/lib/api";

export function SettingsPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Dashboard configuration</p>
      </div>

      <div className="space-y-6">
        {/* Admin Accounts */}
        <SettingsCard title="Admin Accounts" icon={Shield}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">admin@forkandcompass.app</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>
          <button className="mt-3 text-sm text-primary hover:text-primary/80">
            + Invite admin
          </button>
        </SettingsCard>

        {/* API Keys */}
        <SettingsCard title="API Keys" icon={Key}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Recipe API</p>
                <p className="text-xs text-muted-foreground font-mono">rapi_****_****</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-primary hover:underline">Reveal</button>
                <button className="text-xs text-muted-foreground hover:text-foreground">Rotate</button>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Instacart</p>
                <p className="text-xs text-muted-foreground font-mono">****_****</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-primary hover:underline">Reveal</button>
                <button className="text-xs text-muted-foreground hover:text-foreground">Rotate</button>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* App Config */}
        <SettingsCard title="App Config" icon={Database}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Default measurement system</label>
              <select className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                <option value="us">US Customary</option>
                <option value="metric">Metric</option>
                <option value="imperial_uk">Imperial (UK)</option>
                <option value="show_both">Show Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Default cooking tier</label>
              <select className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                <option value="first_steps">First Steps</option>
                <option value="home_cook">Home Cook</option>
                <option value="chefs_table">Chef's Table</option>
              </select>
            </div>
          </div>
        </SettingsCard>

        {/* Database */}
        <SettingsCard title="Database" icon={Database}>
          <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm mb-4">
            <div>
              <span className="text-muted-foreground">Total recipes:</span>{" "}
              <span className="font-medium text-foreground">{stats?.recipes ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total users:</span>{" "}
              <span className="font-medium text-foreground">{stats?.users ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Countries:</span>{" "}
              <span className="font-medium text-foreground">{stats?.countries ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Regions:</span>{" "}
              <span className="font-medium text-foreground">{stats?.regions ?? "—"}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-accent">
              <Download className="w-3.5 h-3.5" />
              Export all recipes as JSON
            </button>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border rounded-xl bg-card">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
