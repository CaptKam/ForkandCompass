import { useLocation } from "wouter";
import PageLayout from "@/components/PageLayout";

const features = [
  {
    icon: "menu_book",
    title: "Editorial Recipes",
    subtitle: "97 curated dishes across 8 countries",
    desc: "Every recipe in Fork & Compass comes with the story behind it — the region it hails from, the technique passed down through generations, and the cultural ritual it belongs to. We don't just tell you what to cook. We tell you why it matters.",
    detail: "From Roman carbonara to Kyoto-style dashi, each recipe is written with the same care as a long-form food essay.",
  },
  {
    icon: "restaurant_menu",
    title: "Cook Mode",
    subtitle: "A cinematic, hands-free kitchen companion",
    desc: "When your hands are covered in flour, the last thing you need is to tap a phone screen. Cook Mode presents each step one at a time in a large, legible format — so you stay in the flow of cooking from first chop to final plate.",
    detail: "Voice-friendly, distraction-free, and designed to feel like having a calm sous chef at your side.",
  },
  {
    icon: "shopping_basket",
    title: "Smart Grocery Lists",
    subtitle: "From recipe to cart in one tap",
    desc: "Every ingredient in every recipe can be added to your grocery list with a single tap. Fork & Compass groups items by category, flags specialty ingredients you might need to source, and integrates with Instacart for direct ordering.",
    detail: "Find saffron, sumac, and shiso leaf — not just the basics.",
  },
  {
    icon: "explore",
    title: "Curated Destinations",
    subtitle: "8 countries, dozens of regions",
    desc: "We've organized the app around the world's great culinary cultures — not ingredient lists. Browse Italy by region (Tuscany, Rome, Amalfi Coast), or explore all of Japan from Kyoto street food to Tokyo ramen.",
    detail: "Each destination has a curated set of recipes that tell the full story of its cuisine.",
  },
  {
    icon: "bookmark",
    title: "Saved Collections",
    subtitle: "Build your personal cookbook",
    desc: "Save any recipe to your personal collection and build a library of dishes that matter to you. Organize by country, occasion, or season — your cookbook, your way.",
    detail: "Your saved recipes sync across devices and are always available offline.",
  },
  {
    icon: "auto_stories",
    title: "The Spice Market",
    subtitle: "Ingredients as ingredients, not afterthoughts",
    desc: "Fresh basil. Extra-virgin olive oil. Dried chiles. The best dishes are built on quality ingredients. The Spice Market section of the app teaches you about the essential pantry staples of each cuisine so you can cook with confidence.",
    detail: "Learn what makes Moroccan ras el hanout different from a generic curry powder.",
  },
];

export default function FeaturesPage() {
  const [, navigate] = useLocation();
  return (
    <PageLayout>
      <div className="pt-32 pb-24">
        <div className="max-w-[1536px] mx-auto px-8">
          <div className="text-center mb-24 space-y-6 max-w-3xl mx-auto">
            <span className="text-[#8A3800] font-bold uppercase tracking-[0.4em] text-sm block">The App</span>
            <h1 className="font-serif text-6xl md:text-7xl leading-tight text-[#1C1A17]">Everything you need to cook the world.</h1>
            <div className="w-20 h-1 bg-[#8A3800] mx-auto rounded-full" />
            <p className="text-[#725a3c] text-xl leading-relaxed">
              Fork &amp; Compass is built for the curious home cook — someone who wants more than a recipe. Someone who wants the story, the technique, and the confidence to bring it all together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {features.map((feat) => (
              <div key={feat.title} className="space-y-5 group">
                <div className="bg-[#8A3800]/5 text-[#8A3800] w-16 h-16 flex items-center justify-center rounded-full transition-colors group-hover:bg-[#8A3800] group-hover:text-white">
                  <span className="material-symbols-outlined text-3xl">{feat.icon}</span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-[#1C1A17] font-bold">{feat.title}</h3>
                  <p className="text-[#8A3800] text-[13px] font-bold uppercase tracking-[0.2em] mt-1">{feat.subtitle}</p>
                </div>
                <p className="text-[#725a3c] text-base leading-relaxed">{feat.desc}</p>
                <p className="text-[#1C1A17]/50 text-sm italic leading-relaxed border-l-2 border-[#8A3800]/20 pl-4">{feat.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-32 bg-[#1C1A17] py-24 px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-5xl text-white leading-tight">Available soon on iOS &amp; Android.</h2>
            <p className="text-white/60 text-lg leading-relaxed">
              We're putting the finishing touches on the experience. Join the waitlist to be the first to know when Fork &amp; Compass opens its doors.
            </p>
            <button
              type="button"
              className="inline-block bg-[#8A3800] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all"
              onClick={() => {
                navigate("/");
                requestAnimationFrame(() => {
                  document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" });
                });
              }}
            >
              Join the Waitlist
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
