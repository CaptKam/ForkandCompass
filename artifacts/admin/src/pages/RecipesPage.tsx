import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search,
  Star,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchRecipes,
  fetchCountries,
  toggleFeatured,
  updateRecipeStatus,
  deleteRecipe,
  type AdminRecipe,
  type RecipeListParams,
  type CountryOption,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const DIFFICULTIES = ["Easy", "Intermediate", "Advanced"];
const STATUSES = ["live", "hidden", "draft"];
const PAGE_SIZE = 25;

export function RecipesPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<RecipeListParams>({
    page: 1,
    limit: PAGE_SIZE,
    sort: "createdAt",
    order: "desc",
  });
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data: countriesData } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
  const countries: CountryOption[] = countriesData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "recipes", params],
    queryFn: () => fetchRecipes(params),
  });

  const recipes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = params.page ?? 1;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "recipes"] });
  }, [queryClient]);

  const featureMut = useMutation({
    mutationFn: toggleFeatured,
    onSuccess: () => { invalidate(); toast.success("Featured status toggled"); },
    onError: () => toast.error("Failed to toggle featured"),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateRecipeStatus(id, status),
    onSuccess: () => { invalidate(); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => { invalidate(); toast.success("Recipe deleted"); },
    onError: () => toast.error("Failed to delete recipe"),
  });

  const handleSearch = () => {
    setParams((p) => ({ ...p, search: searchInput || undefined, page: 1 }));
  };

  const handleSort = (column: string) => {
    setParams((p) => ({
      ...p,
      sort: column,
      order: p.sort === column && p.order === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recipes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipes.map((r) => r.id)));
    }
  };

  const handleBulkAction = async (action: "hide" | "unhide" | "delete") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    if (action === "delete") {
      if (!confirm(`Delete ${ids.length} recipes? This cannot be undone.`)) return;
      for (const id of ids) await deleteRecipe(id);
    } else {
      const status = action === "hide" ? "hidden" : "live";
      for (const id of ids) await updateRecipeStatus(id, status);
    }
    setSelectedIds(new Set());
    invalidate();
    toast.success(`${ids.length} recipes ${action === "delete" ? "deleted" : "updated"}`);
  };

  const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <th
      className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {params.sort === column && (
          <span className="text-primary">{params.order === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Recipes {!isLoading && <span className="text-muted-foreground font-sans text-lg">({total})</span>}
          </h1>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={params.country ?? ""}
          onChange={(e) => setParams((p) => ({ ...p, country: e.target.value || undefined, region: undefined, page: 1 }))}
          className="h-9 px-3 rounded-lg border border-input bg-card text-sm"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
          ))}
        </select>

        <select
          value={params.difficulty ?? ""}
          onChange={(e) => setParams((p) => ({ ...p, difficulty: e.target.value || undefined, page: 1 }))}
          className="h-9 px-3 rounded-lg border border-input bg-card text-sm"
        >
          <option value="">All Difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={params.status ?? ""}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}
          className="h-9 px-3 rounded-lg border border-input bg-card text-sm"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <button onClick={() => handleBulkAction("hide")} className="text-sm text-muted-foreground hover:text-foreground">
            Hide
          </button>
          <button onClick={() => handleBulkAction("unhide")} className="text-sm text-muted-foreground hover:text-foreground">
            Unhide
          </button>
          <button onClick={() => handleBulkAction("delete")} className="text-sm text-destructive hover:text-destructive/80">
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-muted-foreground hover:text-foreground ml-auto">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={recipes.length > 0 && selectedIds.size === recipes.length}
                    onChange={toggleSelectAll}
                    className="rounded border-input"
                  />
                </th>
                <th className="w-10 px-1 py-2 text-center text-xs font-semibold text-muted-foreground">
                  <Star className="w-3.5 h-3.5 mx-auto" />
                </th>
                <SortHeader column="title">Name</SortHeader>
                <SortHeader column="countryId">Country</SortHeader>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region</th>
                <SortHeader column="difficulty">Difficulty</SortHeader>
                <SortHeader column="category">Category</SortHeader>
                <th className="h-10 px-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <SortHeader column="cookCount">Cooked</SortHeader>
                <SortHeader column="createdAt">Created</SortHeader>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-muted-foreground text-sm">
                    Loading recipes...
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-muted-foreground text-sm">
                    No recipes found
                  </td>
                </tr>
              ) : (
                recipes.map((recipe) => (
                  <RecipeRow
                    key={recipe.id}
                    recipe={recipe}
                    selected={selectedIds.has(recipe.id)}
                    menuOpen={menuOpenId === recipe.id}
                    onToggleSelect={() => toggleSelect(recipe.id)}
                    onToggleMenu={() => setMenuOpenId(menuOpenId === recipe.id ? null : recipe.id)}
                    onCloseMenu={() => setMenuOpenId(null)}
                    onToggleFeatured={() => featureMut.mutate(recipe.id)}
                    onSetStatus={(status) => statusMut.mutate({ id: recipe.id, status })}
                    onDelete={() => {
                      if (confirm(`Delete "${recipe.title}"? This cannot be undone.`)) {
                        deleteMut.mutate(recipe.id);
                      }
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setParams((p) => ({ ...p, page: currentPage - 1 }))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input text-sm disabled:opacity-50 hover:bg-accent"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setParams((p) => ({ ...p, page: currentPage + 1 }))}
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

function RecipeRow({
  recipe,
  selected,
  menuOpen,
  onToggleSelect,
  onToggleMenu,
  onCloseMenu,
  onToggleFeatured,
  onSetStatus,
  onDelete,
}: {
  recipe: AdminRecipe;
  selected: boolean;
  menuOpen: boolean;
  onToggleSelect: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onToggleFeatured: () => void;
  onSetStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const statusColor: Record<string, string> = {
    live: "bg-emerald-100 text-emerald-800",
    hidden: "bg-amber-100 text-amber-800",
    draft: "bg-gray-100 text-gray-800",
  };

  const diffColor: Record<string, string> = {
    Easy: "text-emerald-700",
    Intermediate: "text-amber-700",
    Advanced: "text-red-700",
  };

  return (
    <tr className={cn("border-b border-border hover:bg-accent/30 transition-colors", selected && "bg-primary/5")}>
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="rounded border-input"
        />
      </td>
      <td className="px-1 py-2.5 text-center">
        <button onClick={onToggleFeatured} className="p-1 hover:scale-110 transition-transform">
          <Star
            className={cn("w-4 h-4", recipe.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
          />
        </button>
      </td>
      <td className="px-3 py-2.5">
        <Link href={`/recipes/${recipe.id}`}>
          <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            {recipe.title}
          </a>
        </Link>
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {recipe.countryName ?? recipe.countryId}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {recipe.region ?? "—"}
      </td>
      <td className="px-3 py-2.5">
        <span className={cn("text-sm font-medium", diffColor[recipe.difficulty] ?? "text-foreground")}>
          {recipe.difficulty}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {recipe.category ?? "—"}
      </td>
      <td className="px-3 py-2.5">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColor[recipe.status] ?? statusColor.draft)}>
          {recipe.status.charAt(0).toUpperCase() + recipe.status.slice(1)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground tabular-nums">
        {recipe.cookCount}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {new Date(recipe.createdAt).toLocaleDateString()}
      </td>
      <td className="px-2 py-2.5 relative">
        <button onClick={onToggleMenu} className="p-1.5 rounded-md hover:bg-accent">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
              <Link href={`/recipes/${recipe.id}`}>
                <a className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={onCloseMenu}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </a>
              </Link>
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left"
                onClick={() => { onToggleFeatured(); onCloseMenu(); }}
              >
                <Star className="w-3.5 h-3.5" /> {recipe.featured ? "Unfeature" : "Feature"}
              </button>
              {recipe.status === "live" ? (
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left"
                  onClick={() => { onSetStatus("hidden"); onCloseMenu(); }}
                >
                  <EyeOff className="w-3.5 h-3.5" /> Hide
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left"
                  onClick={() => { onSetStatus("live"); onCloseMenu(); }}
                >
                  <Eye className="w-3.5 h-3.5" /> Unhide
                </button>
              )}
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left"
                onClick={onCloseMenu}
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <div className="border-t border-border my-1" />
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                onClick={() => { onDelete(); onCloseMenu(); }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
