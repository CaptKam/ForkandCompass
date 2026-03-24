import PageLayout from "@/components/PageLayout";

const facts = [
  { label: "App Name", value: "Fork & Compass" },
  { label: "Category", value: "Food & Drink / Travel" },
  { label: "Platform", value: "iOS & Android (coming soon)" },
  { label: "Recipes", value: "97 curated dishes" },
  { label: "Destinations", value: "8 countries, 24 regions" },
  { label: "Pricing", value: "TBA — premium subscription" },
  { label: "Founded", value: "2025" },
  { label: "Press Contact", value: "hello@forkandcompass.com" },
];

const brandColors = [
  { name: "Terracotta", hex: "#8A3800", bg: "bg-[#8A3800]", text: "text-white" },
  { name: "Dark Espresso", hex: "#1C1A17", bg: "bg-[#1C1A17]", text: "text-white" },
  { name: "Warm Cream", hex: "#FEF9F3", bg: "bg-[#FEF9F3] border border-[#E6E2DC]", text: "text-[#1C1A17]" },
  { name: "Aged Leather", hex: "#725a3c", bg: "bg-[#725a3c]", text: "text-white" },
];

export default function PressPage() {
  return (
    <PageLayout>
      <div className="pt-32 pb-24">
        <div className="max-w-[1536px] mx-auto px-8">
          <div className="space-y-6 mb-20 max-w-3xl">
            <span className="text-[#8A3800] font-bold uppercase tracking-[0.4em] text-sm block">Media</span>
            <h1 className="font-serif text-6xl md:text-7xl text-[#1C1A17] leading-tight">Press &amp; Media Kit</h1>
            <div className="w-20 h-1 bg-[#8A3800] rounded-full" />
            <p className="text-[#725a3c] text-xl leading-relaxed">
              Fork &amp; Compass is a premium culinary travel app for the curious home cook — 97 curated recipes across 8 countries, with editorial storytelling, cook mode, and smart grocery lists.
            </p>
            <a
              href="mailto:hello@forkandcompass.com?subject=Press Inquiry"
              className="inline-flex items-center gap-2 bg-[#8A3800] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[13px] hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Media Inquiries
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            <div className="space-y-8">
              <h2 className="font-serif text-3xl text-[#1C1A17]">About Fork &amp; Compass</h2>
              <div className="space-y-5 text-[#725a3c] text-lg leading-relaxed">
                <p>
                  Fork &amp; Compass is a premium culinary travel app built for home cooks who want to explore the world through food. Every recipe comes with the story behind it — the region, the technique, the cultural ritual. It's not just what to cook. It's why it matters.
                </p>
                <p>
                  The app features 97 curated recipes across 8 countries — Italy, Japan, Morocco, Mexico, India, Thailand, Spain, and France — organized by region and presented with an editorial sensibility borrowed from the best food and travel magazines.
                </p>
                <p>
                  Features include Cook Mode (a hands-free, step-by-step cooking companion), Smart Grocery Lists with Instacart integration, Saved Collections, and a dedicated Spice Market section that teaches home cooks about the essential ingredients of each cuisine.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif text-3xl text-[#1C1A17]">Key Facts</h2>
              <div className="border border-[#E6E2DC] rounded-2xl overflow-hidden">
                {facts.map((fact, i) => (
                  <div
                    key={fact.label}
                    className={`flex justify-between items-center px-6 py-4 ${i !== facts.length - 1 ? "border-b border-[#E6E2DC]" : ""}`}
                  >
                    <span className="text-[#725a3c] text-sm font-bold uppercase tracking-[0.15em]">{fact.label}</span>
                    <span className="text-[#1C1A17] font-medium text-right">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-24 space-y-8">
            <h2 className="font-serif text-3xl text-[#1C1A17]">Brand Colors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {brandColors.map((color) => (
                <div key={color.name} className="space-y-3">
                  <div className={`h-24 rounded-2xl ${color.bg}`} />
                  <p className={`font-bold text-[#1C1A17]`}>{color.name}</p>
                  <p className="text-[#725a3c] text-sm font-mono">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-24 space-y-8">
            <h2 className="font-serif text-3xl text-[#1C1A17]">Typography</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-[#E6E2DC] rounded-2xl p-8 space-y-4">
                <p className="text-[#8A3800] text-[13px] font-bold uppercase tracking-[0.3em]">Headlines</p>
                <p className="font-serif text-5xl text-[#1C1A17] leading-tight">Noto Serif</p>
                <p className="text-[#725a3c]">Used for all display text, headings, and editorial pull quotes. Available from Google Fonts.</p>
              </div>
              <div className="border border-[#E6E2DC] rounded-2xl p-8 space-y-4">
                <p className="text-[#8A3800] text-[13px] font-bold uppercase tracking-[0.3em]">Body Text</p>
                <p className="font-sans text-4xl text-[#1C1A17] font-normal leading-tight">Inter</p>
                <p className="text-[#725a3c]">Used for all body copy, UI labels, and navigation. Available from Google Fonts.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#F2EDE7] rounded-3xl p-12 space-y-6">
            <h2 className="font-serif text-3xl text-[#1C1A17]">Get in Touch</h2>
            <p className="text-[#725a3c] text-lg leading-relaxed max-w-2xl">
              For press inquiries, interview requests, review access, or high-resolution assets, please reach out directly. We aim to respond to all media requests within 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:hello@forkandcompass.com?subject=Press Inquiry"
                className="inline-flex items-center gap-2 bg-[#8A3800] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[13px] hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                hello@forkandcompass.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
