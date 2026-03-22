import { useState } from "react";

export default function LandingPage() {
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitted, setHeroSubmitted] = useState(false);
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroEmail.trim()) {
      setHeroSubmitted(true);
      setHeroEmail("");
    }
  };

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ctaEmail.trim()) {
      setCtaSubmitted(true);
      setCtaEmail("");
    }
  };

  return (
    <div className="bg-[#fef9f3] text-[#1d1b18] font-sans">
      <nav className="fixed top-0 w-full z-50 bg-[#FEF9F3]/90 backdrop-blur-md">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 py-5 md:py-6">
          <div className="text-2xl font-semibold font-serif text-[#9A4100]">Fork &amp; Compass</div>
          <div className="hidden md:flex items-center gap-10">
            {[
              { label: "The Story", active: false },
              { label: "Destinations", active: false },
              { label: "Recipes", active: false },
              { label: "The App", active: true },
            ].map((item) => (
              <a
                key={item.label}
                href="#"
                className={`font-serif text-lg tracking-tight transition-opacity duration-300 hover:opacity-80 ${
                  item.active
                    ? "text-[#9A4100] border-b-2 border-[#9A4100] pb-1"
                    : "text-[#725A3C] hover:text-[#9A4100]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="bg-[#9a4100] text-white px-6 py-2.5 rounded-xl font-medium active:scale-95 transition-transform hover:opacity-90"
              onClick={() => document.getElementById("hero-signup")?.scrollIntoView({ behavior: "smooth" })}
            >
              Join Waitlist
            </button>
            <button
              className="md:hidden text-[#9A4100]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-2xl">{menuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#FEF9F3] border-t border-[#ece7e2]">
            {["The Story", "Destinations", "Recipes", "The App"].map((item) => (
              <a
                key={item}
                href="#"
                className="block px-8 py-4 font-serif text-lg text-[#725A3C] hover:text-[#9A4100] border-b border-[#f2ede7]"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      <main className="pt-24 overflow-x-hidden">
        <section className="relative w-full min-h-[750px] lg:min-h-[870px]">
          <img
            alt="Sun-drenched vineyard at golden hour"
            className="absolute inset-0 w-full h-full object-cover brightness-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXoCF6VeBTnl2C4wT_J7lK2HbzrIex7d6vj6nlrdTTQhG2nKFQutiUavtPJosNmIwsVZQ8XLPOszdEedv7KkU5B2kvgorGAJZ0b80P2HKbaeHOoCMwFgwjUXbYMBSLld_WWJamxQIzq_PYUD8F4LgS0yDWQVMq4uaSbrxmQL2XmmybBjcYlPPXQlpybayR6corDd0-xwKm100fhGSS8VMbqkQFMz1sdfHVNAuZIhplnbaI2HyNksQXU47NfwxQdetDxz01Zn2-JL1X"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fef9f3]/80 via-[#fef9f3]/20 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[750px] lg:min-h-[870px]">
          <div className="space-y-7 relative z-10 py-12 lg:py-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbdab3]/80 backdrop-blur-sm text-[#775e3f] text-xs font-semibold tracking-widest uppercase">
              New: 8 Countries &amp; 97 Recipes
            </div>
            <h1 className="font-serif text-5xl md:text-7xl text-[#1d1b18] leading-[1.1] tracking-tight">
              Eat Your Way Across <span className="italic text-[#9a4100]">The Globe</span>.
            </h1>
            <p className="text-lg md:text-xl text-[#574238] leading-relaxed max-w-lg">
              More than a recipe book—a curated companion for the culinary explorer. Sync your kitchen with your wanderlust.
            </p>
            <div id="hero-signup" className="pt-2 max-w-lg">
              {heroSubmitted ? (
                <div className="flex items-center gap-3 rounded-xl px-6 py-4 bg-[#fbdab3]/60 border border-[#dec1b3]">
                  <span className="material-symbols-outlined text-[#9a4100]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="font-serif italic text-[#1d1b18]">You're on the list — we'll be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={heroEmail}
                    onChange={(e) => setHeroEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="flex-1 rounded-xl outline-none text-base bg-white/80 backdrop-blur-sm border border-[#dec1b3] text-[#1d1b18] px-5 py-4 focus:border-[#9a4100] focus:ring-1 focus:ring-[#9a4100] transition-colors placeholder:text-[#8a7266]"
                  />
                  <button
                    type="submit"
                    className="bg-[#9a4100] text-white px-7 py-4 rounded-xl text-base font-semibold shadow-xl shadow-[#9a4100]/10 hover:opacity-90 transition-opacity whitespace-nowrap active:scale-[0.98]"
                  >
                    Join Waitlist
                  </button>
                </form>
              )}
              <p className="text-[#8a7266] text-sm mt-3">Be first to explore the world from your kitchen. No spam, ever.</p>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end py-10 lg:py-20 z-10">
            <div className="relative w-full max-w-[320px] lg:max-w-[340px] aspect-[9/19.5] rounded-[3rem] p-[10px] bg-black shadow-2xl border-[8px] border-[#1d1b18]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-[#1d1b18] rounded-b-2xl z-30" />
              <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-[#f2ede7] relative">
                <img
                  alt="Fork & Compass app showing curated culinary travel experience"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQOqHGDc4JFp3_NUeIn0HiXxtnKzT-gjibC5ooZvQkZoBYju7agGflS36AsoRTKyVf9gqEI9J8fUbjmTTuoY191ZDg-WEslCX0E7Pts7PxA3tMT6hPFNDchTI_wA1c3V92czcYjp2ufvv8LbrysPUQCWE94sDARlVpgsCf3obHQQYqCtNTZJ_IK0KgF5LoHcK5rIDRh9XGHl227Vt3I4xDhnQZKg-RgOjPkFK50_G9OA1s1tBookbDv3eRWAbUcJuSAQpK3TPuUwEP"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1d1b18]/80 via-transparent to-transparent flex flex-col justify-end p-5">
                  <div className="bg-[#fef9f3]/90 backdrop-blur-md p-4 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#9a4100] tracking-widest uppercase">Current Destination</span>
                      <span className="material-symbols-outlined text-[#9a4100] text-sm">location_on</span>
                    </div>
                    <h3 className="font-serif text-base text-[#1d1b18]">San Sebastián, Spain</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 p-2 bg-[#f2ede7] rounded-lg">
                        <span className="material-symbols-outlined text-[#725a3c] text-sm">restaurant</span>
                        <div className="text-[10px]">
                          <p className="font-bold text-[#1d1b18]">Ganbara Pintxos</p>
                          <p className="text-[#574238]">Recommended: Wild Mushrooms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 bg-[#f2ede7] rounded-lg">
                        <span className="material-symbols-outlined text-[#725a3c] text-sm">explore</span>
                        <div className="text-[10px]">
                          <p className="font-bold text-[#1d1b18]">Market Tour</p>
                          <p className="text-[#574238]">10:00 AM — La Bretxa</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="bg-[#f8f3ed] py-24 lg:py-32 mt-12 lg:mt-20">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="max-w-2xl mb-16 lg:mb-20">
              <h2 className="font-serif text-4xl md:text-5xl text-[#1d1b18] mb-6">More than recipes.</h2>
              <p className="text-lg text-[#574238]">We built the tool we wanted: a curator that understands the context of a meal, the history of an ingredient, and the logistics of a journey.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { icon: "menu_book", title: "Curated Editorial", desc: "Deep-dives into culinary traditions across 8 countries, from the trattorias of Tuscany to the spice markets of Marrakech." },
                { icon: "smart_toy", title: "AI Pantry Sync", desc: "Photograph your ingredients and our engine suggests recipes based on regional authenticity and what you have on hand." },
                { icon: "share_location", title: "Local Sourcing", desc: "Traveling? We map out the farmers' markets and specialty shops to find your recipe's soul wherever you go." },
              ].map((feat) => (
                <div key={feat.title} className="bg-[#fef9f3] p-8 lg:p-10 rounded-xl space-y-5 lg:space-y-6 hover:bg-white transition-colors group">
                  <div className="w-14 h-14 rounded-2xl bg-[#ece7e2] flex items-center justify-center text-[#9a4100] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">{feat.icon}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1d1b18]">{feat.title}</h3>
                  <p className="text-[#574238] leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-8 mb-10 lg:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="font-serif text-4xl text-[#1d1b18] mb-3 lg:mb-4">A Global Collection</h2>
              <p className="text-[#574238]">Explore curated culinary experiences across 8 countries and 24 regions.</p>
            </div>
            <div className="flex gap-3">
              <button className="w-11 h-11 rounded-full border border-[#dec1b3]/40 flex items-center justify-center text-[#1d1b18] hover:bg-[#f2ede7] transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button className="w-11 h-11 rounded-full border border-[#dec1b3]/40 flex items-center justify-center text-[#1d1b18] hover:bg-[#f2ede7] transition-colors">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="flex gap-6 lg:gap-8 overflow-x-auto px-6 md:px-8 pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {[
              { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCXbxqqNIcPA-Ij80rKI3T06DMHLM_bHIXDVqMtIxGsUousF2YKJ56rNXB-1vIWWS4Y632e71fmIKEW87bSdKI8z2cm20rRxY7RI4BnOdwZoYRfZkevYmHfHfq_gwXAyey7x39akc7yxVZBQbbyxfZH3tRQDp6DRp_5glF6VgWOxp8SKf_gsRXi-25Cgc8ZNp1g8bsKGmy6Cj4snjIywv5YfRyVLKgdP74ZLj6HloAsTy5bSVGVCVBZE6FUGYxFdyoQUcv0FAV-6Ym", title: "The Maghreb Heart", loc: "Marrakech, Morocco" },
              { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-2nQUWusCP2mzrBG6AI2EWlsQuZoudmPTxu7rLUFC5rvcaEoNSMekXAlNDfotX6toH6wJWO-zf5sGQ1bqXLM5UnWmJKe304Wu8xFko5i1RAyQutZK9BOwPhLXZZxqQgG6ULwizqoCDL47bXRP_BQ5L8f0MhWrqhCoeDZAJCzIRrskrBLQToS9_S2qEgMcQwz66qZhz0uiKUXTNBfPKaWCYDjXukSVjt7fQBMiwJ6ookBuw7W21lkxAd4AnUbVVMdqhIuYxoBXFSxe", title: "Zen Kitchens", loc: "Kyoto, Japan" },
              { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQWtI_OZ3ZXmR7pA6sX1kcQr6s-CDCctUtoO-rwotxhxcG-s-icdCCizlkBjv4aTOzjDztBh63phMqvyB6PAUR590qs1bFTDQQee4DgO242YJl1Ew0F3RH7er5dD_GeWA7yw9mVhm48KAigvVysLavC6RkTbUvjBwZNox9vnwSnkT5N3WVkUJo2FkZdxUH75hQoXz1NMXMGqewCA-CsTTQU9SdwzBqzi9d0VJeVmBuDw29cz2QuGgCBZoWrOAJ3UEx0rU-TY32OhoR", title: "Flour & Water", loc: "Bologna, Italy" },
              { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBr0PI2NYdINsGe-4oKwFvFTKv8LOmrzXTk7OJBp2iKSyjYDIK1I1Wl-h1xhDcRJF-oRLIQTnsBf3VvSL3QyPgGrXU_e3Po-rrq1VY4WlvGvMLDULWnDIe4nJU7lNocEZ7zm5AZO2uEPHG3XQJo4BwbkdtAoth0PgE5ENA2w_by5iF9K5XOLeQ-k9KpfgY-uCC3afr4Fa5Jd3lhfNdQv4or5HBOnpz8-c5uJYTWhjo4307dMgOCMiOKmZNxBigpDOOL_ECKpCk-zXVR", title: "The Masa Trail", loc: "Oaxaca, Mexico" },
            ].map((card) => (
              <div key={card.title} className="flex-shrink-0 w-72 lg:w-80 group cursor-pointer">
                <div className="aspect-[4/5] rounded-xl overflow-hidden mb-4 relative">
                  <img alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={card.img} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
                <h4 className="font-serif text-xl text-[#1d1b18]">{card.title}</h4>
                <p className="text-sm text-[#725a3c] tracking-wide uppercase">{card.loc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-24 lg:py-32 bg-[#ece7e2]">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="text-center mb-16 lg:mb-20">
              <h2 className="font-serif text-4xl text-[#1d1b18] mb-4 italic">The New Paradigm</h2>
              <p className="text-[#574238] max-w-xl mx-auto leading-relaxed">
                We aren't just another app on your home screen. We are the bridge between the digital world and the tactile reality of food.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="bg-[#fef9f3]/50 p-10 lg:p-12 flex flex-col items-center text-center space-y-5 lg:space-y-6">
                <span className="material-symbols-outlined text-4xl text-[#725a3c] opacity-40">shopping_basket</span>
                <h4 className="font-bold text-lg text-[#1d1b18]">Not a subscription box</h4>
                <p className="text-sm text-[#574238]">No plastic waste or pre-measured packets. We teach you to source like a local.</p>
              </div>
              <div className="bg-[#9a4100] text-white p-10 lg:p-12 flex flex-col items-center text-center space-y-5 lg:space-y-6 md:scale-105 z-10 shadow-xl">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                <h4 className="font-bold text-xl uppercase tracking-widest">A Travel Experience</h4>
                <p className="text-sm opacity-90 leading-relaxed font-medium">Curated itineraries, historical context, and on-the-ground guides for the curious palate.</p>
              </div>
              <div className="bg-[#fef9f3]/50 p-10 lg:p-12 flex flex-col items-center text-center space-y-5 lg:space-y-6">
                <span className="material-symbols-outlined text-4xl text-[#725a3c] opacity-40">menu_book</span>
                <h4 className="font-bold text-lg text-[#1d1b18]">Not a recipe site</h4>
                <p className="text-sm text-[#574238]">Beyond simple instructions. We offer cultural storytelling and artisanal technique mastery.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 px-6 md:px-8 bg-white">
          <div className="max-w-5xl mx-auto text-center space-y-10 sm:space-y-14">
            <span
              className="material-symbols-outlined block"
              style={{ color: "rgba(154,65,0,0.3)", fontSize: "72px", fontVariationSettings: "'FILL' 1" }}
            >
              format_quote
            </span>
            <blockquote className="font-serif italic text-[#1d1b18] leading-tight" style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}>
              "Fork &amp; Compass isn't just a recipe box. It's an evening of discovery that turns my Tuesday night kitchen into a sun-drenched bistro in Provence."
            </blockquote>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <img
                  alt="Elena Rossi"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXs9G1nR_upbGeTUL-OAwsbFi1M6S-hyddJSmSL_EbOLphn-ouho1YBojVCjoAjtyKkRbgVQrpBd566PEol9oE1LOIvRfeul-HtMGD7zof6n6TzXmZzq6OdlipAh4xE3F-0Q2siCQIs9Q_OzeFNXJFLAvLAM2OCAoX8wst90-GLdVUCxchKp6mrKuWq6YATpgmmP1V7MXmryO4pA1K03HnIKgOvkci5W857_nzgGlZ43DVA50lEC5CwOrS0zxuK7U1dPJnGd7eglle"
                />
              </div>
              <div>
                <p className="font-bold text-lg sm:text-xl">Elena Rossi</p>
                <p className="text-sm uppercase mt-1 text-[#9a4100] tracking-[0.3em]">Travel Writer &amp; Home Chef</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#9a4100]/5 rounded-l-[8rem] lg:rounded-l-[10rem] -z-10" />
          <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="font-serif text-4xl lg:text-5xl text-[#1d1b18] mb-6 lg:mb-8 leading-tight">
                Your table is<br />reserved. Globally.
              </h2>
              <p className="text-lg lg:text-xl text-[#574238] mb-8 lg:mb-10 leading-relaxed">
                Join culinary explorers who have ditched the tourist traps for the authentic soul of food. Be the first to know when we launch.
              </p>
              <div className="max-w-lg">
                {ctaSubmitted ? (
                  <div className="flex items-center gap-3 rounded-xl px-6 py-4 bg-[#fbdab3]/60 border border-[#dec1b3]">
                    <span className="material-symbols-outlined text-[#9a4100]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="font-serif italic text-[#1d1b18]">You're on the list — we'll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      value={ctaEmail}
                      onChange={(e) => setCtaEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 rounded-xl outline-none text-base bg-white border border-[#dec1b3] text-[#1d1b18] px-5 py-4 focus:border-[#9a4100] focus:ring-1 focus:ring-[#9a4100] transition-colors placeholder:text-[#8a7266]"
                    />
                    <button
                      type="submit"
                      className="bg-[#9a4100] text-white px-7 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity whitespace-nowrap active:scale-[0.98]"
                    >
                      Join Waitlist
                    </button>
                  </form>
                )}
                <p className="text-[#8a7266] text-sm mt-3">No spam. Just recipes, destinations, and stories.</p>
              </div>
            </div>
            <div className="relative">
              <img
                alt="Beautiful dish served in an outdoor setting"
                className="w-full aspect-[4/3] object-cover rounded-[2rem] lg:rounded-[3rem] shadow-2xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY0uwXwRR-ZeT2sG43NBEx2eTJwZXxTlP2HAvB5Wbphcn08I-mUZkVILMv_QvEMyXEmIhts9TsdWlIOZCrGhsEjt3qMvzAP6FRIbH6phJxNGOp0114bEUV64C6VuOLv_CBSY1XFVXHImVe_O2L0lKl5OUlep_OkNtJRipmnKQBvD_v9miAWCdJgQFrw9eAnbt-1FB0pQSo6wK-GzESPls71PFD9bPjEKhKlQDuqRpHHYMd5snj0-pchKlW_yAa_bU2EKTxIrMX3-mf"
              />
              <div className="absolute -top-8 -right-4 lg:-top-12 lg:-right-12 w-36 h-36 lg:w-44 lg:h-44 bg-[#ffdbcb] rounded-full flex items-center justify-center p-6 lg:p-8 text-center rotate-12 shadow-lg">
                <p className="font-serif text-[#341100] text-base lg:text-lg leading-snug">8 Countries 24 Regions</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-16 lg:py-20 bg-[#f8f3ed] border-t border-[#ece7e2]">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 md:px-8 gap-6 lg:gap-8">
          <div className="text-xl font-serif text-[#9A4100]">Fork &amp; Compass</div>
          <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
            {["Privacy Policy", "Terms of Service", "Press Kit", "Contact"].map((link) => (
              <a key={link} href="#" className="text-sm tracking-wide text-[#725A3C] hover:text-[#9A4100] transition-colors">
                {link}
              </a>
            ))}
          </div>
          <p className="text-sm tracking-wide text-[#725A3C]">© 2025 Fork &amp; Compass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
