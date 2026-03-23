import PageLayout from "@/components/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="pt-32 pb-0">
        <div className="max-w-[1536px] mx-auto px-8 mb-24">
          <div className="max-w-3xl space-y-6">
            <span className="text-[#9A4100] font-bold uppercase tracking-[0.4em] text-sm block">Our Story</span>
            <h1 className="font-serif text-6xl md:text-8xl leading-tight text-[#1C1A17]">The compass always points to the table.</h1>
            <div className="w-20 h-1 bg-[#9A4100] rounded-full" />
          </div>
        </div>

        <div className="relative h-[480px] overflow-hidden">
          <img
            alt="Kitchen scene"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85&fit=crop"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FEF9F3] via-transparent to-transparent" />
        </div>

        <div className="max-w-[1536px] mx-auto px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
            <div className="space-y-8">
              <h2 className="font-serif text-4xl text-[#1C1A17]">Why Fork &amp; Compass?</h2>
              <div className="space-y-6 text-[#725a3c] text-lg leading-relaxed">
                <p>
                  We built Fork &amp; Compass because we believe that cooking a dish from another culture is one of the most generous acts a person can perform. It says: I want to understand where you come from. I want to taste what you grew up eating. I want to sit at your table.
                </p>
                <p>
                  Most recipe apps treat food as fuel — indexed by macros, optimized for speed, stripped of everything that makes a dish worth making. We wanted to build something different.
                </p>
                <p>
                  Fork &amp; Compass is an editorial platform. Every recipe is a story. Every country is a journey. The app is designed to slow you down in the best possible way — to make you curious, to make you want to learn, and ultimately, to make you a better cook.
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="font-serif text-4xl text-[#1C1A17]">How we curate.</h2>
              <div className="space-y-6 text-[#725a3c] text-lg leading-relaxed">
                <p>
                  We don't publish every recipe we find. We publish the ones that earn it. Each dish in Fork &amp; Compass has been selected because it tells you something essential about the culture it comes from — its geography, its history, its people.
                </p>
                <p>
                  Our recipes are tested for accuracy and written for clarity, but they are also written for wonder. The cultural note at the end of each dish isn't a footnote — it's the whole point.
                </p>
                <p>
                  We are endlessly grateful to the chefs, home cooks, food writers, and grandmothers whose knowledge makes this app possible. Every dish has a lineage. We try to honor it.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1A17] py-24 px-8">
          <div className="max-w-[1536px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { number: "97", label: "Curated Recipes" },
              { number: "8", label: "Destinations" },
              { number: "24", label: "Distinct Regions" },
              { number: "1", label: "Guiding Principle" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-3">
                <p className="font-serif text-6xl text-[#9A4100] font-bold">{stat.number}</p>
                <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[1536px] mx-auto px-8 py-24">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <span className="material-symbols-outlined text-[#9A4100]/20 block" style={{ fontSize: "100px", fontVariationSettings: "'FILL' 1" }}>format_quote</span>
            <blockquote className="font-serif text-4xl italic text-[#1C1A17] leading-tight">
              "The fork is how we reach the world. The compass is how we find our way back to ourselves."
            </blockquote>
            <p className="text-[#9A4100] text-xs font-bold uppercase tracking-[0.3em]">The Fork &amp; Compass Ethos</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
