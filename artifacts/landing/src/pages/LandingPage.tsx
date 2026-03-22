import { useState, useEffect, useRef } from "react";

export default function LandingPage() {
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitted, setHeroSubmitted] = useState(false);
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubmitted, setFooterSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: number) => {
    carouselRef.current?.scrollBy({ left: dir * 440, behavior: "smooth" });
  };

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroEmail.trim()) {
      setHeroSubmitted(true);
      setHeroEmail("");
    }
  };

  const handleFooterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (footerEmail.trim()) {
      setFooterSubmitted(true);
      setFooterEmail("");
    }
  };

  return (
    <div className="bg-[#FEF9F3] text-[#1C1A17] font-sans selection:bg-[#9A4100]/20">
      <header className="fixed top-0 w-full z-50 bg-transparent">
        <nav className="flex justify-between items-center px-8 py-6 max-w-[1536px] mx-auto">
          <div className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9A4100]">explore</span>
            Fork &amp; Compass
          </div>
          <div className="hidden md:flex items-center space-x-12">
            {["Journal", "Ethos", "Destinations"].map((link) => (
              <a key={link} href="#" className="text-white/90 font-medium hover:text-white transition-colors text-xs uppercase tracking-[0.2em]">
                {link}
              </a>
            ))}
          </div>
          <button
            className="bg-[#9A4100] text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            onClick={() => document.getElementById("hero-signup")?.scrollIntoView({ behavior: "smooth" })}
          >
            Early Access
          </button>
        </nav>
      </header>

      <main>
        <section className="relative h-[110vh] min-h-[900px] w-full overflow-hidden bg-[#1C1A17]">
          <img
            alt="Vineyard at Sunset"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuChMpRqdNeAh86v51t2nZOMRO-8OekmzcxLrhg3d0CQdSCMDSGahUD62M5cR0J8Askr07ZZc_FfOscn3tr6jsiO72jvdaCdwxA3THGVUW6LeQOfe61vXGnew_An8QWgEZnlnaFGyjXswlVLSNdfNLbw1u7AA9bYT-Ob_z2q5953Onne7Etj0jf_qV6YuLzMA-yZssD4-g_Q4rKDcCPVYZr47NIYhQEX0F_4dGJHiqnCk5WpA9BfspHOI_4x6SY5xem96iiAEPoQueCs"
          />
          <div className="absolute inset-0 hero-vignette" />
          <div className="absolute bottom-0 left-0 w-full h-1/3 hero-bottom-fade" />

          <div className="relative h-full max-w-[1536px] mx-auto px-8 flex flex-col lg:flex-row items-center justify-between pt-32 gap-16">
            <div className="lg:w-1/2 text-left space-y-8">
              <span className="text-[#9A4100] font-bold uppercase tracking-[0.5em] text-sm block">Fork &amp; Compass</span>
              <h1 className="font-serif text-white text-6xl md:text-8xl font-semibold tracking-tighter leading-[0.9] text-shadow-elegant">
                Eat Your Way<br />Across the<br /><span className="italic font-normal">Globe.</span>
              </h1>
              <p className="text-white/80 text-xl md:text-2xl max-w-xl leading-relaxed text-shadow-elegant">
                A curated journal through the world's most soul-stirring cuisines, delivered from your kitchen to your table.
              </p>
              <div id="hero-signup" className="flex flex-col sm:flex-row gap-4 pt-4">
                {heroSubmitted ? (
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-4">
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
                    <button type="submit" className="bg-[#9A4100] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all">
                      Join
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div
              className="lg:w-1/2 flex justify-center lg:justify-end"
              style={{ transform: `translateY(${scrollY * -0.12}px)`, willChange: "transform" }}
            >
              <div className="iphone-frame w-[320px] h-[650px] overflow-hidden bg-black relative">
                <img
                  alt="Fork & Compass app discover page"
                  className="w-full h-full object-cover object-top"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQOqHGDc4JFp3_NUeIn0HiXxtnKzT-gjibC5ooZvQkZoBYju7agGflS36AsoRTKyVf9gqEI9J8fUbjmTTuoY191ZDg-WEslCX0E7Pts7PxA3tMT6hPFNDchTI_wA1c3V92czcYjp2ufvv8LbrysPUQCWE94sDARlVpgsCf3obHQQYqCtNTZJ_IK0KgF5LoHcK5rIDRh9XGHl227Vt3I4xDhnQZKg-RgOjPkFK50_G9OA1s1tBookbDv3eRWAbUcJuSAQpK3TPuUwEP"
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1C1A17] rounded-b-2xl z-50" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-8 bg-[#FEF9F3]">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <span className="text-[#9A4100] font-bold uppercase tracking-[0.4em] text-sm block">The Digital Curator</span>
                <h2 className="font-serif text-5xl md:text-7xl leading-tight">A New Chapter in Every Meal.</h2>
                <div className="w-20 h-1.5 bg-[#9A4100] rounded-full" />
              </div>
              <p className="text-[#725a3c] text-xl leading-relaxed italic">
                "We strip away the noise of traditional recipe sites to bring you the narrative of flavor. Each issue is a passport to a culture's heart."
              </p>
              <div className="space-y-10">
                {[
                  { num: "01", title: "Snap Your Pantry", desc: "Photograph your ingredients and our AI vision engine matches what you have to authentic regional recipes — no typing, no guessing." },
                  { num: "02", title: "Build Your List", desc: "One tap builds your grocery list. Adjust servings, check off what you own, and order the rest through Instacart — all without leaving the app." },
                  { num: "03", title: "Follow the Journey", desc: "Step-by-step cook mode with built-in timers, hands-free voice control, and cultural context that transports you to the destination." },
                ].map((step) => (
                  <div key={step.num} className="flex gap-8 group">
                    <span className="font-serif text-5xl text-[#9A4100]/20 group-hover:text-[#9A4100] transition-colors duration-500">{step.num}</span>
                    <div>
                      <h3 className="font-serif text-2xl mb-2">{step.title}</h3>
                      <p className="text-[#725a3c] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  alt="Cooking interface preview"
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB1Y6QQqOkqUdqr1Qh5C6yYOLzusGF4fT_R6zhwrCeI6dZNWsAlNNgqqE4FmnDBt6SuO5ObCrC3FYMiOxnG5W1nPUSeyx_TrUjqjzxcjW1cxSqvt7XINlNfjbGD-eEcIZUaIxp_SUgDwQCgjeO7pvg958WlWHw7yGhlr8yibInFs57Mj7SsMxAdohGhLrCRDaNuxPbycntgOJkrftQnUIMidI3tPH_gXHvAISJF2Nnyh-QyCcCyb48yWWdF5y_uwkwEwKcJli_wyqJ"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-xl shadow-xl max-w-xs border border-[#F2EDE7]">
                <p className="font-serif text-lg mb-2">Cooking Now</p>
                <p className="text-[#725a3c] text-sm">Tagine from Marrakech. Step 4 of 12. 45m remaining.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-[#1C1A17] text-[#FEF9F3] overflow-hidden">
          <div className="max-w-[1536px] mx-auto px-8 mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <span className="text-[#9A4100] font-bold uppercase tracking-[0.4em] text-sm block mb-4">Global Portfolios</span>
              <h2 className="font-serif text-5xl md:text-7xl">Current Destinations</h2>
            </div>
            <div className="flex gap-4">
              <button onClick={() => scrollCarousel(-1)} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={() => scrollCarousel(1)} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div ref={carouselRef} className="flex gap-8 px-8 overflow-x-auto hide-scrollbar pb-12 snap-x">
            {[
              {
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA94SdzbFiFlAxj25dZMw7DU-46gCPvqkzPdV7R_iBnJs6f5Al2ylegSwsnpE_S0uTTGv0vVtKrq_71OIgTUeXFUj-AMzEPRqXqdhxo-OhUf4NN-oOldqDcYEizeNYcpJQvAYliVoht2XgFWRCMJUiO3bihJIuBQU10P2frC00YjgPs6SQZ8f6Z7QUJr8EX6LHqgDZhVGXRVozc26HuqiUym6grarBypHcdvd8SsQSPuc0rauHHiXrmwifrP5cLMwj_3v5H6JlQItu_",
                vol: "Volume I",
                title: "Marrakech",
                desc: "The Crimson Spice. A journey through the bustling medinas and ancient tagine traditions.",
              },
              {
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAu3-KSQOfwHCWcChqFrSLDuYSZn11EcTkI-WjvuBCRBwLrfc_att2ysaZiGf9TEjqOJqe5jDhBKo4cUQYBsucusseC_J7cw2JNnn2JsPYP9h-QlyarZJgZsAhoQSA5HJXE0AZyUmf4LD1Zam4qFkGgD02t9vCoYX9m-jfGPf4OndnxBR8jRCorDxQJGWEVdO0RjdSXOSzz65bHWBcqK9RCeue22e662NFBDIEBYYVnYbSxrmhnUbk7qD89s680Vdht1T_uS1oNMefR",
                vol: "Volume II",
                title: "Tuscany",
                desc: "The Gold of the Earth. Rolling hills, heritage olive oils, and the soul of the Italian countryside.",
              },
              {
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdWXrkKkUpRHGU2c5BUiOez13606j57cIEDzw02IdOlIqB7Ni04sCD4f1rvlYLHLzBreuvRazZPx-HB3usv_YCRDQRljlHc2UD8Ba81-oJTtgc1vBu_sKRZ47sjhDUgJpriwMZ5mjFKCP1RhH1lnIjnMnzLOS6jusL9RKfieFioO3wbquZpVxmFb7zlVzAGbR0qjeSOMXrdGP0K2ia8HalUlhO1hv-ogmOqta8P4n596XeIaaVAsh2wy7KgZpDjDgOAC1l0NxKNNmj",
                vol: "Volume III",
                title: "Kyoto",
                desc: "The Art of Umami. Finding serenity in the precision of Kaiseki and the tradition of tea ceremony.",
              },
            ].map((card) => (
              <div key={card.title} className="min-w-[400px] aspect-[3/4.5] group relative overflow-hidden rounded-2xl snap-center flex-shrink-0">
                <img alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={card.img} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 p-12 flex flex-col justify-between">
                  <span className="tracking-[0.4em] uppercase text-xs text-white border-l-2 border-[#9A4100] pl-4">{card.vol}</span>
                  <div>
                    <h3 className="font-serif text-5xl mb-4">{card.title}</h3>
                    <p className="italic text-xl mb-8 text-white/80">{card.desc}</p>
                    <button className="bg-white text-[#1C1A17] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#9A4100] hover:text-white transition-colors">
                      Explore Issue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative py-40 flex items-center justify-center px-8 overflow-hidden bg-[#1C1A17]">
          <div className="absolute inset-0 z-0">
            <img
              alt="Spices background"
              className="w-full h-full object-cover opacity-20 grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0bN96Jr4ck4sr4fw9hc5R5SN4P9WryPO53t3sCEuewxCAyW4zrlavGXNs2l5GeK7Wxmw5dCpu6YPX3mjavMcTTXuCYS5IJ7VOYE7i7eTbh-_dOYUNnaiVDir_8ZDfZIW7YkdtvKTkvHjlvMgXrzV-ZikQd4wJn8BzDrRi_dXyBmVGqfCOalVpfWRAWHMDc3rwIIJ4fpyOmSfIfzRM0WXLVUWrUrhej1IpxpcFwUo0LCpkJDnCNY8pqBKaGpDk-zfUGdrbilaO3u1z"
            />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
            <h2 className="font-serif text-6xl md:text-8xl text-white leading-tight">Bring the World to Your Table.</h2>
            <p className="text-2xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed italic">
              Join our community of global explorers. 8 countries. 97 recipes. Launching soon.
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
              <button
                className="bg-[#9A4100] text-white px-16 py-6 rounded-full text-xl font-bold shadow-2xl hover:brightness-110 transition-all"
                onClick={() => document.getElementById("hero-signup")?.scrollIntoView({ behavior: "smooth" })}
              >
                Claim Early Access
              </button>
              <button className="bg-white/10 text-white border border-white/20 px-16 py-6 rounded-full text-xl font-bold backdrop-blur-md hover:bg-white/20 transition-all">
                Gift an Issue
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-[#F2EDE7] border-t border-[#8a7266]/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 px-12 py-24 max-w-[1536px] mx-auto">
          <div className="md:col-span-5 space-y-8">
            <div className="flex items-center gap-3 text-[#9A4100]">
              <span className="material-symbols-outlined text-4xl">explore</span>
              <span className="text-3xl font-serif font-bold block">Fork &amp; Compass</span>
            </div>
            <p className="text-lg leading-relaxed text-[#725a3c] max-w-md">
              Curating the world's most evocative food stories and delivering the soul of global cuisines directly to your home.
            </p>
            <div className="flex gap-8">
              {["Instagram", "Pinterest", "Twitter"].map((social) => (
                <a key={social} href="#" className="text-[#9A4100] hover:opacity-70 font-bold text-xs uppercase tracking-[0.2em]">
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
            <h4 className="font-bold uppercase tracking-widest text-xs text-[#9A4100]">The Newsletter</h4>
            <p className="text-base text-[#725a3c]">Weekly stories of flavor and far-off places.</p>
            {footerSubmitted ? (
              <div className="flex items-center gap-3 bg-[#fbdab3]/60 border border-[#dec1b3] rounded-lg px-6 py-4">
                <span className="material-symbols-outlined text-[#9A4100]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-serif italic text-[#1C1A17]">You're on the list — we'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleFooterSubmit} className="flex flex-col gap-4">
                <input
                  type="email"
                  required
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="Your email"
                  className="bg-[#FEF9F3] border border-[#8a7266]/20 px-6 py-4 w-full focus:ring-2 focus:ring-[#9A4100] rounded-lg text-base outline-none"
                />
                <button type="submit" className="bg-[#9A4100] text-white px-8 py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">
                  Join the Editorial
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="px-12 py-12 border-t border-[#8a7266]/5 text-center">
          <p className="text-sm text-[#725a3c]/60">
            © 2025 Fork &amp; Compass. All rights reserved. Designed for the global explorer.
          </p>
        </div>
      </footer>
    </div>
  );
}
