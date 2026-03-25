import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { fetchUsers, type AdminUser } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;
const TIER_ICONS: Record<string, string> = {
  first_steps: "🌱",
  home_cook: "🍳",
  chefs_table: "👨‍🍳",
};

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", { page, search, level: levelFilter, plan: planFilter }],
    queryFn: () => fetchUsers({ page, limit: PAGE_SIZE, search: search || undefined, level: levelFilter || undefined, plan: planFilter || undefined }),
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Users {!isLoading && <span className="text-muted-foreground font-sans text-lg">({total})</span>}
          </h1>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-lg text-sm font-medium text-foreground hover:bg-accent">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-input bg-card text-sm"
        >
          <option value="">All Levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
          <option value="4">Level 4</option>
          <option value="5">Level 5</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-input bg-card text-sm"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name / Email</th>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level</th>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipes</th>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cuisines</th>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-3">
                      <Link href={`/users/${user.id}`}>
                        <a className="text-sm font-medium text-foreground hover:text-primary">
                          {user.name || user.email || user.id}
                        </a>
                      </Link>
                      {user.email && user.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm">
                        {TIER_ICONS[user.cookingTier] ?? "🌱"} {user.cookingLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">
                      {user.recipesCooked}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">
                      {user.cuisinesExplored?.length ?? 0}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        user.subscriptionPlan === "pro" ? "bg-blue-100 text-blue-800" :
                        user.subscriptionPlan === "premium" ? "bg-purple-100 text-purple-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input text-sm disabled:opacity-50 hover:bg-accent"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input text-sm disabled:opacity-50 hover:bg-accent"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
