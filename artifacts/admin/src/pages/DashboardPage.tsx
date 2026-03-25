import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  UtensilsCrossed,
  Users,
  Globe,
  MapPin,
  Plus,
  Star,
  ArrowRight,
} from "lucide-react";
import { fetchStats, type DashboardStats } from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your Fork & Compass content
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Recipes"
          value={isLoading ? "..." : stats?.recipes ?? 0}
          icon={UtensilsCrossed}
        />
        <StatCard
          label="Users"
          value={isLoading ? "..." : stats?.users ?? 0}
          icon={Users}
        />
        <StatCard
          label="Countries"
          value={isLoading ? "..." : stats?.countries ?? 0}
          icon={Globe}
        />
        <StatCard
          label="Regions"
          value={isLoading ? "..." : stats?.regions ?? 0}
          icon={MapPin}
        />
      </div>

      {/* Recent activity */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Recent Recipes
        </h2>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
          ) : stats?.recentRecipes?.length ? (
            stats.recentRecipes.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`}>
                <a className="flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
                  <span className="text-sm font-medium text-foreground">{r.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </a>
              </Link>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No recipes yet
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/recipes">
            <a className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Add Recipe
            </a>
          </Link>
          <Link href="/featured">
            <a className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-card rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
              <Star className="w-4 h-4" />
              Feature Recipes
            </a>
          </Link>
          <Link href="/users">
            <a className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-card rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
              <Users className="w-4 h-4" />
              View Users
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
