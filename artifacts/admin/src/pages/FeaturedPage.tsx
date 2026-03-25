import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  ChevronDown,
  ChevronUp,
  X,
  GripVertical,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCountries,
  fetchFeatured,
  updateFeatured,
  fetchRecipes,
  type CountryOption,
  type FeaturedRecipe,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export function FeaturedPage() {
  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
  const countries: CountryOption[] = countriesData ?? [];

  const [editingCountry, setEditingCountry] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-foreground">Featured Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage which recipes appear in the "Popular in [Country]" carousel strips
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Popular in [Country] Strips
        </h2>

        {countriesLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading countries...</div>
        ) : (
          countries.map((country) => (
            <CountryFeaturedCard
              key={country.id}
              country={country}
              isEditing={editingCountry === country.id}
              onToggleEdit={() => setEditingCountry(editingCountry === country.id ? null : country.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CountryFeaturedCard({
  country,
  isEditing,
  onToggleEdit,
}: {
  country: CountryOption;
  isEditing: boolean;
  onToggleEdit: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: featured, isLoading } = useQuery({
    queryKey: ["admin", "featured", country.id],
    queryFn: () => fetchFeatured(country.id),
  });

  const featuredList = featured ?? [];

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button
        onClick={onToggleEdit}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{country.flag}</span>
          <span className="font-medium text-foreground">{country.name}</span>
          <span className="text-sm text-muted-foreground">
            ({isLoading ? "..." : featuredList.length} featured)
          </span>
        </div>
        {isEditing ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isEditing && (
        <FeaturedEditor
          countryId={country.id}
          featured={featuredList}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "featured", country.id] });
          }}
        />
      )}
    </div>
  );
}

function FeaturedEditor({
  countryId,
  featured,
  onSaved,
}: {
  countryId: string;
  featured: FeaturedRecipe[];
  onSaved: () => void;
}) {
  const [items, setItems] = useState<FeaturedRecipe[]>(featured);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: searchResults } = useQuery({
    queryKey: ["admin", "recipes", "search", countryId, searchQuery],
    queryFn: () => fetchRecipes({ country: countryId, search: searchQuery, limit: 10 }),
    enabled: showSearch && searchQuery.length > 1,
  });

  const saveMut = useMutation({
    mutationFn: () => updateFeatured(countryId, items.map((i) => i.id)),
    onSuccess: () => {
      onSaved();
      toast.success("Featured recipes updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addItem = (recipe: { id: string; title: string; image: string }) => {
    if (items.length >= 5) {
      toast.error("Maximum 5 featured recipes per country");
      return;
    }
    if (items.some((i) => i.id === recipe.id)) {
      toast.error("Recipe already featured");
      return;
    }
    setItems((prev) => [...prev, { ...recipe, featuredOrder: prev.length + 1 }]);
    setSearchQuery("");
    setShowSearch(false);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[index], newItems[targetIdx]] = [newItems[targetIdx], newItems[index]];
    setItems(newItems);
  };

  const isDirty = JSON.stringify(items.map((i) => i.id)) !== JSON.stringify(featured.map((i) => i.id));

  return (
    <div className="border-t border-border px-6 py-5">
      {/* Current items */}
      <div className="space-y-2 mb-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No featured recipes yet</p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {idx + 1}
              </span>
              {item.image && (
                <img src={item.image} alt="" className="w-10 h-10 rounded object-cover bg-muted" />
              )}
              <span className="flex-1 text-sm font-medium text-foreground">{item.title}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveItem(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-accent disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveItem(idx, "down")}
                  disabled={idx === items.length - 1}
                  className="p-1 rounded hover:bg-accent disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-destructive/10">
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add recipe */}
      {items.length < 5 && (
        <div className="mb-4">
          {showSearch ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search recipes to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {searchResults?.data?.length ? (
                <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {searchResults.data
                    .filter((r) => !items.some((i) => i.id === r.id))
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => addItem({ id: r.id, title: r.title, image: r.image })}
                        className="flex items-center gap-3 px-3 py-2 w-full hover:bg-accent text-left"
                      >
                        <img src={r.image} alt="" className="w-8 h-8 rounded object-cover bg-muted" />
                        <span className="text-sm">{r.title}</span>
                      </button>
                    ))}
                </div>
              ) : searchQuery.length > 1 ? (
                <p className="text-xs text-muted-foreground px-1">No results found</p>
              ) : null}
              <button onClick={() => setShowSearch(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="text-sm text-primary hover:text-primary/80"
            >
              + Add recipe ({5 - items.length} remaining)
            </button>
          )}
        </div>
      )}

      {/* Save */}
      {isDirty && (
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90"
        >
          <Star className="w-4 h-4" />
          {saveMut.isPending ? "Saving..." : "Save Changes"}
        </button>
      )}
    </div>
  );
}
