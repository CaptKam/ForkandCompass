import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchRecipe,
  updateRecipe,
  deleteRecipe,
  fetchCountries,
  type AdminRecipe,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const DIFFICULTIES = ["Easy", "Intermediate", "Advanced"];
const CATEGORIES = ["Main Course", "Side Dish", "Appetizer", "Dessert", "Soup", "Salad", "Drink", "Condiment", "Snack"];
const STATUSES = ["live", "hidden", "draft"];

export function RecipeEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["admin", "recipe", id],
    queryFn: () => fetchRecipe(id),
  });

  const { data: countriesData } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
  const countries = countriesData ?? [];

  const [form, setForm] = useState<Partial<AdminRecipe>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (recipe) {
      setForm(recipe);
      setDirty(false);
    }
  }, [recipe]);

  const updateField = <K extends keyof AdminRecipe>(key: K, value: AdminRecipe[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMut = useMutation({
    mutationFn: () => updateRecipe(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setDirty(false);
      toast.success("Recipe saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteRecipe(id),
    onSuccess: () => {
      toast.success("Recipe deleted");
      navigate("/recipes");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleDelete = () => {
    if (confirm(`Delete "${form.title}"? This cannot be undone.`)) {
      deleteMut.mutate();
    }
  };

  // Ingredient helpers
  const addIngredient = () => {
    const ingredients = [...(form.ingredients ?? [])];
    ingredients.push({ id: `ing-${Date.now()}`, name: "", amount: "" });
    updateField("ingredients", ingredients);
  };

  const updateIngredient = (index: number, field: "name" | "amount", value: string) => {
    const ingredients = [...(form.ingredients ?? [])];
    ingredients[index] = { ...ingredients[index], [field]: value };
    updateField("ingredients", ingredients);
  };

  const removeIngredient = (index: number) => {
    const ingredients = [...(form.ingredients ?? [])];
    ingredients.splice(index, 1);
    updateField("ingredients", ingredients);
  };

  // Step helpers
  const addStep = () => {
    const steps = [...(form.steps ?? [])];
    steps.push({
      id: `step-${Date.now()}`,
      title: "prep",
      instruction: "",
      materials: [],
    });
    updateField("steps", steps);
  };

  const updateStep = (index: number, field: string, value: string) => {
    const steps = [...(form.steps ?? [])];
    steps[index] = { ...steps[index], [field]: value };
    updateField("steps", steps);
  };

  const removeStep = (index: number) => {
    const steps = [...(form.steps ?? [])];
    steps.splice(index, 1);
    updateField("steps", steps);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm">Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Recipe not found</p>
        <Link href="/recipes">
          <a className="text-primary text-sm hover:underline">Back to Recipes</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/recipes">
            <a className="p-2 rounded-lg hover:bg-accent">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </a>
          </Link>
          <h1 className="text-xl font-serif font-semibold text-foreground">
            {form.title || "Edit Recipe"}
          </h1>
          {dirty && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !dirty}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90"
          >
            <Save className="w-4 h-4" />
            {saveMut.isPending ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Info */}
        <Section title="Basic Info">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Name">
              <input
                type="text"
                value={form.title ?? ""}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country">
                <select
                  value={form.countryId ?? ""}
                  onChange={(e) => updateField("countryId", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm"
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Region">
                <input
                  type="text"
                  value={form.region ?? ""}
                  onChange={(e) => updateField("region", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Difficulty">
                <select
                  value={form.difficulty ?? ""}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm"
                >
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select
                  value={form.category ?? ""}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm"
                >
                  <option value="">Select</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Servings">
                <input
                  type="number"
                  value={form.servings ?? 4}
                  onChange={(e) => updateField("servings", parseInt(e.target.value) || 4)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <div className="flex gap-4">
                  {STATUSES.map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={form.status === s}
                        onChange={() => updateField("status", s)}
                        className="text-primary"
                      />
                      <span className="text-sm capitalize">{s}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Featured">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured ?? false}
                    onChange={(e) => updateField("featured", e.target.checked)}
                    className="rounded border-input text-primary"
                  />
                  <span className="text-sm">Featured in country carousel</span>
                </label>
              </Field>
            </div>
          </div>
        </Section>

        {/* Timing */}
        <Section title="Timing">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Prep Time">
              <input
                type="text"
                value={form.prepTime ?? ""}
                onChange={(e) => updateField("prepTime", e.target.value)}
                placeholder="e.g. 15 min"
                className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Cook Time">
              <input
                type="text"
                value={form.cookTime ?? ""}
                onChange={(e) => updateField("cookTime", e.target.value)}
                placeholder="e.g. 30 min"
                className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Featured Order">
              <input
                type="number"
                value={form.featuredOrder ?? ""}
                onChange={(e) => updateField("featuredOrder", parseInt(e.target.value) || null)}
                placeholder="1-5"
                className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
          </div>
        </Section>

        {/* Ingredients */}
        <Section title="Ingredients">
          <div className="space-y-2">
            {form.ingredients?.map((ing, idx) => (
              <div key={ing.id} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                  placeholder="Ingredient name"
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                  placeholder="Amount"
                  className="w-60 h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={() => removeIngredient(idx)} className="p-1.5 rounded-md hover:bg-destructive/10">
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addIngredient}
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add ingredient
          </button>
        </Section>

        {/* Instructions */}
        <Section title="Instructions">
          <div className="space-y-4">
            {form.steps?.map((step, idx) => (
              <div key={step.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                    <select
                      value={step.title}
                      onChange={(e) => updateStep(idx, "title", e.target.value)}
                      className="h-8 px-2 rounded border border-input bg-card text-xs"
                    >
                      <option value="prep">Prep</option>
                      <option value="cook">Cook</option>
                      <option value="assemble">Assemble</option>
                      <option value="finish">Finish</option>
                    </select>
                  </div>
                  <button onClick={() => removeStep(idx)} className="p-1 rounded hover:bg-destructive/10">
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
                <textarea
                  value={step.instruction}
                  onChange={(e) => updateStep(idx, "instruction", e.target.value)}
                  rows={2}
                  placeholder="Instruction text..."
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addStep}
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 text-sm text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add step
          </button>
        </Section>

        {/* Cultural Note */}
        <Section title="Cultural Context">
          <textarea
            value={form.culturalNote ?? ""}
            onChange={(e) => updateField("culturalNote", e.target.value)}
            rows={4}
            placeholder="Cultural context and history..."
            className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </Section>

        {/* Metadata (read-only) */}
        <Section title="Metadata">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Recipe ID:</span>{" "}
              <span className="font-mono text-foreground">{recipe.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span className="text-foreground">{new Date(recipe.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Times cooked:</span>{" "}
              <span className="text-foreground">{recipe.cookCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Image:</span>{" "}
              <span className="text-foreground truncate">{recipe.image}</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-xl bg-card">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
