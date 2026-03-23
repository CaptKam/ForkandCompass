import PageLayout from "@/components/PageLayout";

const destinations = [
  {
    name: "Italy",
    flag: "🇮🇹",
    img: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=85&fit=crop",
    tagline: "La Dolce Vita on a Plate",
    desc: "From the sun-drenched markets of Sicily to the handmade pasta kitchens of Emilia-Romagna, Italian cuisine is an act of love. Fork & Compass explores three defining regions: Tuscany, Rome, and the Amalfi Coast — each with its own dialect of flavor.",
    recipeCount: 16,
    regions: ["Tuscany", "Rome", "Amalfi Coast"],
    highlight: "Pasta Carbonara, Ribollita, Limoncello Tiramisu",
  },
  {
    name: "Japan",
    flag: "🇯🇵",
    img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=85&fit=crop",
    tagline: "Precision, Patience, and Perfection",
    desc: "Japanese cuisine is a philosophy before it is a technique. The balance of umami, the ceremony of presentation, the patience of a long dashi — Fork & Compass takes you through the distinctive kitchens of Kyoto, Tokyo, and Osaka.",
    recipeCount: 16,
    regions: ["Kyoto", "Tokyo", "Osaka"],
    highlight: "Tonkotsu Ramen, Matcha Wagashi, Kyoto-Style Kaiseki",
  },
  {
    name: "Morocco",
    flag: "🇲🇦",
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85&fit=crop",
    tagline: "Spice Routes and Slow Fires",
    desc: "Moroccan cuisine is built on patience — slow-braised tagines, hand-rolled couscous, and the layered warmth of ras el hanout. We trace the flavors of the imperial cities of Marrakech and Fes, and the cool mountain air of Chefchaouen.",
    recipeCount: 10,
    regions: ["Marrakech", "Chefchaouen", "Atlas Mountains"],
    highlight: "Lamb Tagine, Bastilla, Harissa Chermoula",
  },
  {
    name: "Mexico",
    flag: "🇲🇽",
    img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=85&fit=crop",
    tagline: "Ancient Ingredients, Living Traditions",
    desc: "Mexican cuisine is one of only two in the world designated an Intangible Cultural Heritage by UNESCO. Fork & Compass explores the complex moles of Oaxaca, the citrus-bright ceviches of the Yucatán, and the street food culture of Mexico City.",
    recipeCount: 13,
    regions: ["Oaxaca", "Yucatán", "Mexico City"],
    highlight: "Mole Negro, Cochinita Pibil, Chiles en Nogada",
  },
  {
    name: "India",
    flag: "🇮🇳",
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=85&fit=crop",
    tagline: "A Continent of Cuisines",
    desc: "India is not one cuisine — it is dozens, divided by region, religion, season, and history. Fork & Compass focuses on three distinct culinary traditions: the Mughal grandeur of Delhi, the coconut-rich cooking of Kerala, and the desert spices of Rajasthan.",
    recipeCount: 14,
    regions: ["Delhi", "Kerala", "Rajasthan"],
    highlight: "Butter Chicken, Kerala Fish Curry, Laal Maas",
  },
  {
    name: "Thailand",
    flag: "🇹🇭",
    img: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=85&fit=crop",
    tagline: "Sweet, Sour, Salty, Spicy — All at Once",
    desc: "Thai cuisine is a masterclass in balance — the interplay of four flavors in every dish. Fork & Compass explores the street food markets of Bangkok, the aromatic curries of Chiang Mai, and the fresh seafood of Phuket.",
    recipeCount: 12,
    regions: ["Bangkok", "Chiang Mai", "Phuket"],
    highlight: "Pad Thai, Green Curry, Tom Yum Goong",
  },
  {
    name: "Spain",
    flag: "🇪🇸",
    img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=85&fit=crop",
    tagline: "Tapas, Tradition, and the Art of Gathering",
    desc: "Spanish cuisine is fundamentally social — designed to be shared over long tables with good wine and better conversation. From the pintxos bars of San Sebastián to the paella of Valencia to the avant-garde kitchens of Barcelona.",
    recipeCount: 8,
    regions: ["Barcelona", "Seville", "San Sebastián"],
    highlight: "Paella Valenciana, Gazpacho, Pintxos",
  },
  {
    name: "France",
    flag: "🇫🇷",
    img: "https://images.unsplash.com/photo-1608855238293-a8853e7f7c98?w=800&q=85&fit=crop",
    tagline: "The Foundation of the Western Kitchen",
    desc: "French cuisine gave the world its culinary vocabulary — sauté, braise, mise en place. Fork & Compass explores the bistros and boulangeries of Paris, the rustic farmhouse cooking of Provence, and the rich traditions of Lyon.",
    recipeCount: 8,
    regions: ["Paris", "Provence", "Lyon"],
    highlight: "Boeuf Bourguignon, Soupe à l'Oignon, Tarte Tatin",
  },
];

export default function DestinationsPage() {
  return (
    <PageLayout>
      <div className="pt-32 pb-24">
        <div className="max-w-[1536px] mx-auto px-8">
          <div className="text-center mb-20 space-y-6 max-w-3xl mx-auto">
            <span className="text-[#9A4100] font-bold uppercase tracking-[0.4em] text-sm block">8 Countries</span>
            <h1 className="font-serif text-6xl md:text-7xl leading-tight text-[#1C1A17]">Current Destinations</h1>
            <div className="w-20 h-1 bg-[#9A4100] mx-auto rounded-full" />
            <p className="text-[#725a3c] text-xl leading-relaxed">
              Each destination is a deep dive into a culinary culture — its regions, its rituals, and its most essential recipes.
            </p>
          </div>

          <div className="space-y-4">
            {destinations.map((dest, i) => (
              <div
                key={dest.name}
                className="group grid grid-cols-1 md:grid-cols-12 gap-0 rounded-3xl overflow-hidden border border-[#E6E2DC] hover:border-[#9A4100]/30 transition-all"
              >
                <div className="md:col-span-4 h-64 md:h-auto overflow-hidden">
                  <img
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    src={dest.img}
                  />
                </div>
                <div className="md:col-span-8 p-10 bg-white flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{dest.flag}</span>
                    <div>
                      <p className="text-[#9A4100] text-xs font-bold uppercase tracking-[0.3em]">{dest.tagline}</p>
                      <h2 className="font-serif text-4xl text-[#1C1A17] font-bold">{dest.name}</h2>
                    </div>
                    <span className="ml-auto text-[#725a3c]/40 font-serif text-6xl font-bold leading-none select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-[#725a3c] text-base leading-relaxed max-w-2xl">{dest.desc}</p>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
                    <div>
                      <p className="text-[#9A4100] text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Regions</p>
                      <div className="flex gap-2 flex-wrap">
                        {dest.regions.map((r) => (
                          <span key={r} className="text-xs bg-[#FEF9F3] border border-[#E6E2DC] rounded-full px-3 py-1 text-[#725a3c]">{r}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[#9A4100] text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Recipes</p>
                      <span className="text-sm font-bold text-[#1C1A17]">{dest.recipeCount} curated dishes</span>
                    </div>
                  </div>
                  <p className="text-[#1C1A17]/40 text-sm italic">{dest.highlight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
