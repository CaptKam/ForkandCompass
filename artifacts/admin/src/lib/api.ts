const API_BASE = "/api";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// Stats
export interface DashboardStats {
  recipes: number;
  users: number;
  countries: number;
  regions: number;
  recentRecipes: Array<{ id: string; title: string; createdAt: string }>;
}

export function fetchStats(): Promise<DashboardStats> {
  return fetchApi("/admin/stats");
}

// Recipes
export interface AdminRecipe {
  id: string;
  countryId: string;
  countryName?: string;
  region: string | null;
  title: string;
  description: string;
  image: string;
  category: string | null;
  prepTime: string | null;
  cookTime: string | null;
  servings: number | null;
  difficulty: string;
  ingredients: Array<{ id: string; name: string; amount: string }>;
  steps: Array<{
    id: string;
    title: string;
    instruction: string;
    instructionFirstSteps?: string;
    instructionChefsTable?: string;
    materials: string[];
  }>;
  culturalNote: string | null;
  tips: string[];
  status: string;
  featured: boolean;
  featuredOrder: number | null;
  cookCount: number;
  createdAt: string;
}

export interface RecipeListParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  region?: string;
  difficulty?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function fetchRecipes(params: RecipeListParams = {}): Promise<PaginatedResponse<AdminRecipe>> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, String(v));
  }
  return fetchApi(`/admin/recipes?${qs}`);
}

export function fetchRecipe(id: string): Promise<AdminRecipe> {
  return fetchApi(`/admin/recipes/${encodeURIComponent(id)}`);
}

export function updateRecipe(id: string, data: Partial<AdminRecipe>): Promise<AdminRecipe> {
  return fetchApi(`/admin/recipes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteRecipe(id: string): Promise<void> {
  return fetchApi(`/admin/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function toggleFeatured(id: string): Promise<AdminRecipe> {
  return fetchApi(`/admin/recipes/${encodeURIComponent(id)}/feature`, { method: "POST" });
}

export function updateRecipeStatus(id: string, status: string): Promise<AdminRecipe> {
  return fetchApi(`/admin/recipes/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Users
export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  cookingLevel: number;
  cookingTier: string;
  recipesCooked: number;
  cuisinesExplored: string[];
  measurementSystem: string;
  temperaturePreference: string;
  groceryPartner: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  joinedAt: string;
  lastActiveAt: string | null;
}

export interface UserWithHistory extends AdminUser {
  cookingHistory: Array<{
    id: string;
    recipeId: string;
    recipeTitle?: string;
    completedAt: string;
    rating: number | null;
    feedback: string[] | null;
    cookTimeMinutes: number | null;
    servings: number | null;
  }>;
}

export function fetchUsers(params: { page?: number; limit?: number; search?: string; level?: string; plan?: string } = {}): Promise<PaginatedResponse<AdminUser>> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, String(v));
  }
  return fetchApi(`/admin/users?${qs}`);
}

export function fetchUser(id: string): Promise<UserWithHistory> {
  return fetchApi(`/admin/users/${encodeURIComponent(id)}`);
}

// Featured
export interface FeaturedRecipe {
  id: string;
  title: string;
  image: string;
  featuredOrder: number | null;
}

export function fetchFeatured(countryId: string): Promise<FeaturedRecipe[]> {
  return fetchApi(`/admin/featured/${encodeURIComponent(countryId)}`);
}

export function updateFeatured(countryId: string, recipeIds: string[]): Promise<void> {
  return fetchApi(`/admin/featured/${encodeURIComponent(countryId)}`, {
    method: "PUT",
    body: JSON.stringify({ recipeIds }),
  });
}

// Countries (simple list for filters)
export interface CountryOption {
  id: string;
  name: string;
  flag: string;
}

export function fetchCountries(): Promise<CountryOption[]> {
  return fetchApi("/countries").then((data: any) => {
    if (Array.isArray(data)) return data;
    if (data?.countries) return data.countries;
    return [];
  });
}
