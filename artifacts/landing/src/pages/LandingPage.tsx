import { useState, useEffect } from "react";

export default function LandingPage() {
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ctaEmail.trim()) {
      setCtaSubmitted(true);
      setCtaEmail("");
    }
  };

  return (
    <div className="bg-[#FEF9F3] text-[#1C1A17] font-sans selection:bg-[#9A4100]/20">
      <header className="fixed top-0 w-full z-50 bg-white/5 backdrop-blur-md border-b border-white/10">
        <nav className="flex justify-between items-center px-8 py-5 max-w-[1536px] mx-auto">
          <div className="text-2xl font-serif font-bold text-white tracking-tight">
            Fork &amp; Compass
          </div>
          <div className="hidden md:flex items-center space-x-12">
            {["Journal", "Ethos", "Destinations"].map((link) => (
              <a key={link} href="#" className="text-white/80 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em]">
                {link}
              </a>
            ))}
          </div>
          <button
            className="bg-[#9A4100] text-white px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
            onClick={() => document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Early Access
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
              <span className="text-[#9A4100] font-bold uppercase tracking-[0.5em] text-sm block">Fork &amp; Compass</span>
              <h1 className="font-serif text-white text-6xl md:text-8xl font-semibold tracking-tighter leading-[0.95] text-shadow-elegant">
                Explore the world.<br />
                <span className="italic font-normal">Cook it at home.</span>
              </h1>
              <p className="text-white/90 text-xl md:text-2xl max-w-xl leading-relaxed italic text-shadow-elegant">
                The high-end digital journal for the global explorer and the curious chef.
              </p>
              <div className="pt-4">
                <button
                  className="bg-[#9A4100] text-white px-12 py-5 rounded-full text-lg font-bold shadow-2xl hover:brightness-110 transition-all flex items-center gap-4"
                  onClick={() => document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Begin Your Journey
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>

            <div
              className="flex justify-center lg:justify-end"
              style={{ transform: `translateY(${scrollY * -0.08}px)`, willChange: "transform" }}
            >
              <div className="iphone-frame w-[320px] h-[650px] overflow-hidden relative">
                <img
                  alt="Fork & Compass app discover page showing Japan"
                  className="w-full h-full object-cover object-top"
                  src="/web/app-screenshot.png"
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1C1A17] rounded-b-2xl z-50" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-[#FEF9F3]">
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

        <section className="py-32 bg-[#1C1A17] text-[#FEF9F3]">
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
              { name: "Morocco", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm" },
              { name: "Italy", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAu3-KSQOfwHCWcChqFrSLDuYSZn11EcTkI-WjvuBCRBwLrfc_att2ysaZiGf9TEjqOJqe5jDhBKo4cUQYBsucusseC_J7cw2JNnn2JsPYP9h-QlyarZJgZsAhoQSA5HJXE0AZyUmf4LD1Zam4qFkGgD02t9vCoYX9m-jfGPf4OndnxBR8jRCorDxQJGWEVdO0RjdSXOSzz65bHWBcqK9RCeue22e662NFBDIEBYYVnYbSxrmhnUbk7qD89s680Vdht1T_uS1oNMefR" },
              { name: "Japan", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdWXrkKkUpRHGU2c5BUiOez13606j57cIEDzw02IdOlIqB7Ni04sCD4f1rvlYLHLzBreuvRazZPx-HB3usv_YCRDQRljlHc2UD8Ba81-oJTtgc1vBu_sKRZ47sjhDUgJpriwMZ5mjFKCP1RhH1lnIjnMnzLOS6jusL9RKfieFioO3wbquZpVxmFb7zlVzAGbR0qjeSOMXrdGP0K2ia8HalUlhO1hv-ogmOqta8P4n596XeIaaVAsh2wy7KgZpDjDgOAC1l0NxKNNmj" },
              { name: "Mexico", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBr0PI2NYdINsGe-4oKwFvFTKv8LOmrzXTk7OJBp2iKSyjYDIK1I1Wl-h1xhDcRJF-oRLIQTnsBf3VvSL3QyPgGrXU_e3Po-rrq1VY4WlvGvMLDULWnDIe4nJU7lNocEZ7zm5AZO2uEPHG3XQJo4BwbkdtAoth0PgE5ENA2w_by5iF9K5XOLeQ-k9KpfgY-uCC3afr4Fa5Jd3lhfNdQv4or5HBOnpz8-c5uJYTWhjo4307dMgOCMiOKmZNxBigpDOOL_ECKpCk-zXVR" },
              { name: "Thailand", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCXbxqqNIcPA-Ij80rKI3T06DMHLM_bHIXDVqMtIxGsUousF2YKJ56rNXB-1vIWWS4Y632e71fmIKEW87bSdKI8z2cm20rRxY7RI4BnOdwZoYRfZkevYmHfHfq_gwXAyey7x39akc7yxVZBQbbyxfZH3tRQDp6DRp_5glF6VgWOxp8SKf_gsRXi-25Cgc8ZNp1g8bsKGmy6Cj4snjIywv5YfRyVLKgdP74ZLj6HloAsTy5bSVGVCVBZE6FUGYxFdyoQUcv0FAV-6Ym" },
              { name: "France", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXs9G1nR_upbGeTUL-OAwsbFi1M6S-hyddJSmSL_EbOLphn-ouho1YBojVCjoAjtyKkRbgVQrpBd566PEol9oE1LOIvRfeul-HtMGD7zof6n6TzXmZzq6OdlipAh4xE3F-0Q2siCQIs9Q_OzeFNXJFLAvLAM2OCAoX8wst90-GLdVUCxchKp6mrKuWq6YATpgmmP1V7MXmryO4pA1K03HnIKgOvkci5W857_nzgGlZ43DVA50lEC5CwOrS0zxuK7U1dPJnGd7eglle" },
            ].map((country) => (
              <div key={country.name} className="text-center group cursor-pointer">
                <div className="aspect-square rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#9A4100] transition-all mb-6">
                  <img
                    alt={country.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                    src={country.img}
                  />
                </div>
                <h4 className="font-serif text-xl">{country.name}</h4>
              </div>
            ))}
          </div>
        </section>

        <section className="py-40 bg-[#FEF9F3] border-y border-[#8a7266]/10 overflow-hidden relative">
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
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXs9G1nR_upbGeTUL-OAwsbFi1M6S-hyddJSmSL_EbOLphn-ouho1YBojVCjoAjtyKkRbgVQrpBd566PEol9oE1LOIvRfeul-HtMGD7zof6n6TzXmZzq6OdlipAh4xE3F-0Q2siCQIs9Q_OzeFNXJFLAvLAM2OCAoX8wst90-GLdVUCxchKp6mrKuWq6YATpgmmP1V7MXmryO4pA1K03HnIKgOvkci5W857_nzgGlZ43DVA50lEC5CwOrS0zxuK7U1dPJnGd7eglle"
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
                <button type="submit" className="bg-[#9A4100] text-white px-10 py-5 rounded-full text-lg font-bold hover:brightness-110 transition-all whitespace-nowrap">
                  Claim Early Access
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
