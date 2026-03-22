import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace("/web", "") + "/api";

async function submitWaitlist(email: string, source: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function LandingPage() {
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitted, setHeroSubmitted] = useState(false);
  const [heroLoading, setHeroLoading] = useState(false);
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [ctaLoading, setCtaLoading] = useState(false);
  const phoneFrameRef = useRef<HTMLDivElement>(null);
  const phoneContentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updateParallax = useCallback(() => {
    const sy = window.scrollY;
    if (phoneFrameRef.current) {
      phoneFrameRef.current.style.transform = `translate3d(0, ${sy * -0.08}px, 0)`;
    }
    if (phoneContentRef.current) {
      phoneContentRef.current.style.transform = `translate3d(0, ${Math.min(0, -(sy * 0.35))}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateParallax);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateParallax();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateParallax]);

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroEmail.trim()) return;
    setHeroLoading(true);
    const ok = await submitWaitlist(heroEmail, "hero");
    setHeroLoading(false);
    if (ok) {
      setHeroSubmitted(true);
      setHeroEmail("");
    }
  };

  const handleCtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctaEmail.trim()) return;
    setCtaLoading(true);
    const ok = await submitWaitlist(ctaEmail, "cta");
    setCtaLoading(false);
    if (ok) {
      setCtaSubmitted(true);
      setCtaEmail("");
    }
  };

  return (
    <div className="bg-[#FEF9F3] text-[#1C1A17] font-sans selection:bg-[#9A4100]/20">
      <header className="fixed top-0 w-full z-50 bg-white/5 backdrop-blur-md border-b border-white/10">
        <nav className="flex justify-between items-center px-8 py-5 max-w-[1536px] mx-auto">
          <div className="text-2xl font-serif font-bold text-white tracking-tight">
            Fork <span className="text-[#9A4100]">&amp;</span> Compass
          </div>
          <div className="hidden md:flex items-center space-x-12">
            {[
              { label: "Journal", target: "features-section" },
              { label: "Ethos", target: "quote-section" },
              { label: "Destinations", target: "destinations-section" },
            ].map((link) => (
              <a
                key={link.label}
                href={`#${link.target}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(link.target)?.scrollIntoView({ behavior: "smooth" }); }}
                className="text-white/80 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em] cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>
          <button
            className="bg-[#9A4100] text-white px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
            onClick={() => document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Join Waitlist
          </button>
        </nav>
      </header>
      <main>
        <section className="relative min-h-screen w-full overflow-hidden flex items-center pt-24">
          <img
            alt="Vineyard at Sunset"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuChMpRqdNeAh86v51t2nZOMRO-8OekmzcxLrhg3d0CQdSCMDSGahUD62M5cR0J8Askr07ZZc_FfOscn3tr6jsiO72jvdaCdwxA3THGVUW6LeQOfe61vXGnew_An8QWgEZnlnaFGyjXswlVLSNdfNLbw1u7AA9bYT-Ob_z2q5953Onne7Etj0jf_qV6YuLzMA-yZssD4-g_Q4rKDcCPVYZr47NIYhQEX0F_4dGJHiqnCk5WpA9BfspHOI_4x6SY5xem96iiAEPoQueCs"
          />
          <div className="absolute inset-0 hero-vignette" />

          <div className="relative max-w-[1536px] mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            <div className="text-left space-y-8">
              <h1 className="font-serif text-6xl md:text-8xl font-semibold tracking-tighter leading-[0.95] text-shadow-elegant text-white mt-[16px]">
                Explore the world.<br />
                <span className="italic font-normal text-[#9A4100]">Cook it at home.</span>
              </h1>
              <p className="text-white/90 text-xl md:text-2xl max-w-xl leading-relaxed italic text-shadow-elegant">
                A premium cooking app for the curious home cook.
              </p>
              <div id="hero-signup" className="pt-4">
                {heroSubmitted ? (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-4 max-w-md">
                    <span className="material-symbols-outlined text-[#9A4100]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="font-serif italic text-white">You're on the list — we'll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleHeroSubmit} className="bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-full flex items-center w-full max-w-md">
                    <input
                      type="email"
                      required
                      value={heroEmail}
                      onChange={(e) => setHeroEmail(e.target.value)}
                      placeholder="Your email for early access"
                      className="bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-white/50 px-6 py-3 flex-grow text-lg"
                    />
                    <button type="submit" disabled={heroLoading} className="bg-[#9A4100] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all disabled:opacity-60">
                      {heroLoading ? "..." : "Join"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div
              ref={phoneFrameRef}
              className="flex justify-center lg:justify-end"
              style={{ willChange: "transform" }}
            >
              <div className="iphone-frame w-[320px] h-[650px] overflow-hidden relative bg-[#FEF9F3]">
                <div
                  ref={phoneContentRef}
                  className="absolute left-0 top-0 w-full"
                  style={{ willChange: "transform" }}
                >
                  <div className="relative w-full h-[360px] overflow-hidden">
                    <img
                      alt="Italian pasta dish"
                      className="w-full h-full object-cover"
                      src="https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=700&q=85&fit=crop"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5 text-white">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#9A4100] font-bold mb-1">Featured Destination</p>
                      <h3 className="font-serif text-3xl font-bold leading-tight">Italy</h3>
                      <p className="text-xs text-white/80 mt-1 max-w-[200px]">Sun-drenched kitchens, handmade pasta, and the art of la dolce vita.</p>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="text-2xl">🇮🇹</span>
                    </div>
                  </div>

                  <div className="px-4 pt-5 pb-3">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#725a3c] font-bold">Explore Destinations</p>
                    <div className="flex gap-3 mt-3 overflow-hidden justify-center">
                      {[
                        { flag: "🇫🇷", code: "FR", name: "France", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&q=80&fit=crop", active: false },
                        { flag: "🇮🇳", code: "IN", name: "India", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80&fit=crop", active: false },
                        { flag: "🇮🇹", code: "IT", name: "Italy", img: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=200&q=80&fit=crop", active: true },
                      ].map((c) => (
                        <div key={c.name} className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <div className={`w-[72px] h-[72px] rounded-full overflow-hidden ${c.active ? "border-[3px] border-[#9A4100]" : "border-2 border-[#E6E2DC]"}`}>
                              <img alt={c.name} className="w-full h-full object-cover" src={c.img} />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 text-[11px] bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-[#E6E2DC]">{c.flag}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${c.active ? "text-[#9A4100]" : "text-[#725a3c]"}`}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-4 pt-5 pb-3">
                    <p className="font-serif text-xl text-[#1C1A17] font-bold">Featured Locations</p>
                  </div>
                  <div className="px-4 flex gap-3 pb-4">
                    <div className="w-[140px] flex-shrink-0 rounded-2xl overflow-hidden relative h-[160px]">
                      <img alt="Tuscany" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1523528283115-9bf9b1699245?w=400&q=80&fit=crop" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white text-sm font-bold">Tuscany</p>
                        <p className="text-white/70 text-[9px]">The Eternal Countryside</p>
                      </div>
                    </div>
                    <div className="w-[140px] flex-shrink-0 rounded-2xl overflow-hidden relative h-[160px]">
                      <img alt="Rome" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80&fit=crop" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white text-sm font-bold">Rome</p>
                        <p className="text-white/70 text-[9px]">The Eternal City</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pt-4 pb-3">
                    <p className="font-serif text-xl text-[#1C1A17] font-bold">Tonight's Tasting Menu</p>
                  </div>
                  <div className="px-4 flex gap-3 pb-4">
                    <div className="w-[140px] flex-shrink-0 rounded-2xl overflow-hidden bg-white shadow-sm border border-[#E6E2DC]">
                      <img alt="Pasta Carbonara" className="w-full h-[100px] object-cover" src="https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80&fit=crop" />
                      <div className="p-2.5">
                        <p className="text-[9px] text-[#9A4100] font-bold uppercase tracking-wider">Main Course</p>
                        <p className="text-xs font-bold text-[#1C1A17] mt-0.5">Pasta Carbonara</p>
                      </div>
                    </div>
                    <div className="w-[140px] flex-shrink-0 rounded-2xl overflow-hidden bg-white shadow-sm border border-[#E6E2DC]">
                      <img alt="Tiramisu" className="w-full h-[100px] object-cover" src="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80&fit=crop" />
                      <div className="p-2.5">
                        <p className="text-[9px] text-[#9A4100] font-bold uppercase tracking-wider">Dessert</p>
                        <p className="text-xs font-bold text-[#1C1A17] mt-0.5">Classic Tiramisu</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pt-4 pb-3">
                    <p className="font-serif text-xl text-[#1C1A17] font-bold">The Spice Market</p>
                  </div>
                  <div className="px-4 flex gap-3 pb-6">
                    <div className="w-[140px] flex-shrink-0 rounded-2xl overflow-hidden bg-white shadow-sm border border-[#E6E2DC]">
                      <img alt="Basil" className="w-full h-[100px] object-cover" src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=80&fit=crop" />
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-[#1C1A17]">Fresh Basil</p>
                        <p className="text-[9px] text-[#725a3c] mt-0.5">Essential Italian herb</p>
                      </div>
                    </div>
                    <div className="w-[140px] flex-shrink-0 rounded-2xl overflow-hidden bg-white shadow-sm border border-[#E6E2DC]">
                      <img alt="Olive Oil" className="w-full h-[100px] object-cover" src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80&fit=crop" />
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-[#1C1A17]">Olive Oil</p>
                        <p className="text-[9px] text-[#725a3c] mt-0.5">Extra virgin, cold-pressed</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F2EDE7] border-t border-[#E6E2DC] flex justify-around py-2.5 px-2">
                    {[
                      { icon: "explore", label: "Discover", active: true },
                      { icon: "calendar_today", label: "Itinerary", active: false },
                      { icon: "search", label: "Search", active: false },
                      { icon: "shopping_cart", label: "Grocery", active: false },
                      { icon: "more_horiz", label: "More", active: false },
                    ].map((tab) => (
                      <div key={tab.label} className="flex flex-col items-center gap-0.5">
                        <span className={`material-symbols-outlined text-[18px] ${tab.active ? "text-[#9A4100]" : "text-[#725a3c]/40"}`} style={tab.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
                        <span className={`text-[8px] font-bold ${tab.active ? "text-[#9A4100]" : "text-[#725a3c]/40"}`}>{tab.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1C1A17] rounded-b-2xl z-50" />
              </div>
            </div>
          </div>
        </section>

        <section id="features-section" className="py-32 bg-[#FEF9F3]">
          <div className="max-w-[1536px] mx-auto px-8">
            <div className="text-center mb-24 space-y-6">
              <span className="text-[#9A4100] font-bold uppercase tracking-[0.4em] text-sm block">The Digital Experience</span>
              <h2 className="font-serif text-5xl md:text-7xl leading-tight">Your Passport to Global Flavor.</h2>
              <div className="w-20 h-1 bg-[#9A4100] mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { icon: "menu_book", title: "Editorial recipes", desc: "Thoughtfully curated stories behind every dish, with techniques passed down through generations." },
                { icon: "restaurant_menu", title: "Cook mode", desc: "A cinematic, hands-free cooking interface designed to keep you in the flow of the kitchen." },
                { icon: "shopping_basket", title: "Grocery lists", desc: "Smart ingredient lists that find the authentic spices and essentials you need near you." },
              ].map((feat) => (
                <div key={feat.title} className="space-y-6 group">
                  <div className="bg-[#9A4100]/5 text-[#9A4100] w-16 h-16 flex items-center justify-center rounded-full transition-colors group-hover:bg-[#9A4100] group-hover:text-white">
                    <span className="material-symbols-outlined text-3xl">{feat.icon}</span>
                  </div>
                  <h4 className="font-serif text-3xl">{feat.title}</h4>
                  <p className="text-[#725a3c] text-lg leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="destinations-section" className="py-32 bg-[#1C1A17] text-[#FEF9F3]">
          <div className="max-w-[1536px] mx-auto px-8 flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <span className="text-[#9A4100] font-bold uppercase tracking-[0.4em] text-sm block">Global Portfolios</span>
              <h2 className="font-serif text-5xl md:text-7xl">Current Destinations</h2>
            </div>
            <a href="#" className="text-[#9A4100] font-bold flex items-center gap-2 group text-xl border-b border-[#9A4100]/30 pb-2">
              View All Issues <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </a>
          </div>
          <div className="max-w-[1536px] mx-auto px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12">
            {[
              { name: "Morocco", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=85&fit=crop" },
              { name: "Italy", img: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=600&q=85&fit=crop" },
              { name: "Japan", img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=85&fit=crop" },
              { name: "Mexico", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=85&fit=crop" },
              { name: "Thailand", img: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&q=85&fit=crop" },
              { name: "France", img: "https://images.unsplash.com/photo-1608855238293-a8853e7f7c98?w=600&q=85&fit=crop" },
            ].map((country) => (
              <div key={country.name} className="text-center group cursor-pointer">
                <div className="aspect-square rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#9A4100] transition-all mb-6">
                  <img
                    alt={country.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                    src={country.img}
                  />
                </div>
                <h4 className="font-serif text-xl">{country.name}</h4>
              </div>
            ))}
          </div>
        </section>

        <section id="quote-section" className="py-40 bg-[#FEF9F3] border-y border-[#8a7266]/10 overflow-hidden relative">
          <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
            <span
              className="material-symbols-outlined text-[#9A4100]/20 block"
              style={{ fontSize: "144px", fontVariationSettings: "'FILL' 1" }}
            >
              format_quote
            </span>
            <h3 className="font-serif text-5xl md:text-7xl italic leading-[1.1] text-[#1C1A17]">
              "Fork &amp; Compass is an evening of discovery that turns my kitchen into a bistro in Provence."
            </h3>
            <div className="pt-8 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6">
                <img
                  alt="Elena Rossi"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=85&fit=crop&crop=face"
                />
              </div>
              <p className="font-bold text-xl">Elena Rossi</p>
              <p className="text-[#9A4100] text-xs uppercase tracking-[0.3em] font-bold mt-2">Travel Writer &amp; Home Chef</p>
            </div>
          </div>
        </section>

        <section id="cta-section" className="py-40 flex items-center justify-center px-8 bg-[#1C1A17] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              alt="Spices background"
              className="w-full h-full object-cover grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0bN96Jr4ck4sr4fw9hc5R5SN4P9WryPO53t3sCEuewxCAyW4zrlavGXNs2l5GeK7Wxmw5dCpu6YPX3mjavMcTTXuCYS5IJ7VOYE7i7eTbh-_dOYUNnaiVDir_8ZDfZIW7YkdtvKTkvHjlvMgXrzV-ZikQd4wJn8BzDrRi_dXyBmVGqfCOalVpfWRAWHMDc3rwIIJ4fpyOmSfIfzRM0WXLVUWrUrhej1IpxpcFwUo0LCpkJDnCNY8pqBKaGpDk-zfUGdrbilaO3u1z"
            />
          </div>
          <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
            <h2 className="font-serif text-6xl md:text-8xl text-white leading-none">Bring the World to Your Table.</h2>
            <p className="text-2xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed italic">
              Join a community of thousands exploring the intersection of culture and cuisine.
            </p>
            {ctaSubmitted ? (
              <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-8 py-5 max-w-2xl mx-auto">
                <span className="material-symbols-outlined text-[#9A4100]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-serif italic text-white text-lg">You're on the list — we'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleCtaSubmit} className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto pt-8">
                <input
                  type="email"
                  required
                  value={ctaEmail}
                  onChange={(e) => setCtaEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-white/10 border border-white/20 text-white placeholder-white/50 px-8 py-5 flex-grow rounded-full text-lg backdrop-blur-md focus:ring-2 focus:ring-[#9A4100] focus:border-transparent outline-none"
                />
                <button type="submit" disabled={ctaLoading} className="bg-[#9A4100] text-white px-10 py-5 rounded-full text-lg font-bold hover:brightness-110 transition-all whitespace-nowrap disabled:opacity-60">
                  {ctaLoading ? "Saving..." : "Claim Early Access"}
                </button>
              </form>
            )}
            <p className="text-white/40 text-sm">Be the first to know when the next volume drops.</p>
          </div>
        </section>
      </main>
      <footer className="w-full bg-[#F2EDE7] border-t border-[#8a7266]/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 px-12 py-24 max-w-[1536px] mx-auto">
          <div className="md:col-span-5 space-y-8">
            <span className="text-3xl font-serif font-bold text-[#9A4100] block">Fork &amp; Compass</span>
            <p className="text-lg leading-relaxed text-[#725a3c] max-w-md">
              Curating the world's most evocative food stories and delivering the soul of global cuisines directly to your home.
            </p>
            <div className="flex gap-6">
              {["Instagram", "Pinterest", "Twitter"].map((social) => (
                <a key={social} href="#" className="text-[#9A4100] hover:opacity-70 font-bold text-xs uppercase tracking-widest">
                  {social}
                </a>
              ))}
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="font-bold uppercase tracking-widest text-xs text-[#9A4100]">Discover</h4>
              <ul className="space-y-4 text-base text-[#725a3c]">
                {["Journal", "Ethos", "Destinations"].map((link) => (
                  <li key={link}><a href="#" className="hover:text-[#9A4100] transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-bold uppercase tracking-widest text-xs text-[#9A4100]">Company</h4>
              <ul className="space-y-4 text-base text-[#725a3c]">
                {["Privacy", "Terms", "Press"].map((link) => (
                  <li key={link}><a href="#" className="hover:text-[#9A4100] transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="md:col-span-4 space-y-8">
            <h4 className="font-bold uppercase tracking-widest text-xs text-[#9A4100]">Support</h4>
            <p className="text-base text-[#725a3c]">Have a question about a journey? We're here to help.</p>
            <a href="mailto:hello@forkandcompass.com" className="inline-block text-[#9A4100] font-bold text-lg border-b-2 border-[#9A4100]/20 hover:border-[#9A4100] transition-all pb-1">
              hello@forkandcompass.com
            </a>
          </div>
        </div>
        <div className="px-12 py-12 border-t border-[#8a7266]/5 text-center">
          <p className="text-sm text-[#725a3c]/60 italic">
            © 2025 Fork &amp; Compass. All rights reserved. Designed for the global explorer.
          </p>
        </div>
      </footer>
    </div>
  );
}
