import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { fetchUser, type UserWithHistory } from "@/lib/api";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<string, string> = {
  first_steps: "First Steps",
  home_cook: "Home Cook",
  chefs_table: "Chef's Table",
};

const TIER_ICONS: Record<string, string> = {
  first_steps: "🌱",
  home_cook: "🍳",
  chefs_table: "👨‍🍳",
};

export function UserDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: user, isLoading } = useQuery<UserWithHistory>({
    queryKey: ["admin", "user", id],
    queryFn: () => fetchUser(id),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Link href="/users">
          <a className="text-primary text-sm hover:underline">Back to Users</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/users">
          <a className="p-2 rounded-lg hover:bg-accent">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </a>
        </Link>
        <div>
          <h1 className="text-xl font-serif font-semibold text-foreground">
            {user.name || user.email || user.id}
          </h1>
          {user.email && user.name && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Cooking Profile */}
        <InfoCard title="Cooking Profile">
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <InfoRow label="Level">
              {TIER_ICONS[user.cookingTier] ?? "🌱"}{" "}
              {TIER_LABELS[user.cookingTier] ?? user.cookingTier} (Level {user.cookingLevel})
            </InfoRow>
            <InfoRow label="Recipes cooked">{user.recipesCooked}</InfoRow>
            <InfoRow label="Cuisines explored">
              {user.cuisinesExplored?.length
                ? user.cuisinesExplored.join(", ")
                : "None yet"}
            </InfoRow>
          </div>
        </InfoCard>

        {/* Preferences */}
        <InfoCard title="Preferences">
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <InfoRow label="Measurement">{user.measurementSystem}</InfoRow>
            <InfoRow label="Temperature">{user.temperaturePreference}</InfoRow>
            <InfoRow label="Grocery partner">{user.groceryPartner ?? "None"}</InfoRow>
          </div>
        </InfoCard>

        {/* Subscription */}
        <InfoCard title="Subscription">
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <InfoRow label="Plan">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                user.subscriptionPlan === "pro" ? "bg-blue-100 text-blue-800" :
                user.subscriptionPlan === "premium" ? "bg-purple-100 text-purple-800" :
                "bg-gray-100 text-gray-800"
              )}>
                {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}
              </span>
            </InfoRow>
            <InfoRow label="Status">{user.subscriptionStatus}</InfoRow>
            <InfoRow label="Joined">
              {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </InfoRow>
            <InfoRow label="Last active">
              {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </InfoRow>
          </div>
        </InfoCard>

        {/* Cooking History */}
        <InfoCard title="Cooking History">
          {user.cookingHistory?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="h-8 pr-4 text-left text-xs font-semibold text-muted-foreground">Recipe</th>
                    <th className="h-8 px-4 text-left text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="h-8 px-4 text-left text-xs font-semibold text-muted-foreground">Rating</th>
                    <th className="h-8 px-4 text-left text-xs font-semibold text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {user.cookingHistory.map((h) => (
                    <tr key={h.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-4">
                        <Link href={`/recipes/${h.recipeId}`}>
                          <a className="text-sm text-foreground hover:text-primary">
                            {h.recipeTitle ?? h.recipeId}
                          </a>
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-sm text-muted-foreground">
                        {new Date(h.completedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 text-sm">
                        {h.rating ? "★".repeat(h.rating) + "☆".repeat(5 - h.rating) : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-sm text-muted-foreground">
                        {h.cookTimeMinutes ? `${h.cookTimeMinutes}m` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No cooking history yet</p>
          )}
        </InfoCard>

        {/* Feedback */}
        {user.cookingHistory?.some((h) => h.feedback?.length) && (
          <InfoCard title="Feedback">
            <div className="space-y-3">
              {user.cookingHistory
                .filter((h) => h.feedback?.length)
                .map((h) => (
                  <div key={h.id} className="text-sm">
                    <span className="font-medium text-foreground">{h.recipeTitle ?? h.recipeId}: </span>
                    <span className="text-muted-foreground">"{h.feedback!.join(", ")}"</span>
                  </div>
                ))}
            </div>
          </InfoCard>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-xl bg-card">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="text-foreground">{children}</span>
    </div>
  );
}
