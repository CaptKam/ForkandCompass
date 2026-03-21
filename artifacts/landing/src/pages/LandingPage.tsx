import { useState } from "react";

const DESTINATIONS = [
  {
    id: "tuscany",
    label: "Tuscany",
    subtitle: "The Gold of the Earth",
    volume: "Volume IV",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAu3-KSQOfwHCWcChqFrSLDuYSZn11EcTkI-WjvuBCRBwLrfc_att2ysaZiGf9TEjqOJqe5jDhBKo4cUQYBsucusseC_J7cw2JNnn2JsPYP9h-QlyarZJgZsAhoQSA5HJXE0AZyUmf4LD1Zam4qFkGgD02t9vCoYX9m-jfGPf4OndnxBR8jRCorDxQJGWEVdO0RjdSXOSzz65bHWBcqK9RCeue22e662NFBDIEBYYVnYbSxrmhnUbk7qD89s680Vdht1T_uS1oNMefR",
    offset: false,
  },
  {
    id: "marrakech",
    label: "Marrakech",
    subtitle: "The Crimson Spice",
    volume: "Volume V",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA94SdzbFiFlAxj25dZMw7DU-46gCPvqkzPdV7R_iBnJs6f5Al2ylegSwsnpE_S0uTTGv0vVtKrq_71OIgTUeXFUj-AMzEPRqXqdhxo-OhUf4NN-oOldqDcYEizeNYcpJQvAYliVoht2XgFWRCMJUiO3bihJIuBQU10P2frC00YjgPs6SQZ8f6Z7QUJr8EX6LHqgDZhVGXRVozc26HuqiUym6grarBypHcdvd8SsQSPuc0rauHHiXrmwifrP5cLMwj_3v5H6JlQItu_",
    offset: true,
  },
  {
    id: "kyoto",
    label: "Kyoto",
    subtitle: "The Art of Umami",
    volume: "Volume VI",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdWXrkKkUpRHGU2c5BUiOez13606j57cIEDzw02IdOlIqB7Ni04sCD4f1rvlYLHLzBreuvRazZPx-HB3usv_YCRDQRljlHc2UD8Ba81-oJTtgc1vBu_sKRZ47sjhDUgJpriwMZ5mjFKCP1RhH1lnIjnMnzLOS6jusL9RKfieFioO3wbquZpVxmFb7zlVzAGbR0qjeSOMXrdGP0K2ia8HalUlhO1hv-ogmOqta8P4n596XeIaaVAsh2wy7KgZpDjDgOAC1l0NxKNNmj",
    offset: false,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick a Country",
    body: "Select your destination. From the spice markets of Istanbul to the coastal trattorias of Amalfi.",
    align: "left",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrKCIhkAt1hDVN4Amv8WwQNAQi3YNQ5qEfXNaYN7jrZ9exREhTX12F0FhxL8KjCmUgoEucezeGGNZuI8JMjD3PxsZsYFG1Pg-Q0XYmT7zS_DkHS_JCELxppXpM7qkEpxwBLfuiNqsKYSmNHP2Ahtpheq974iFKDOXDsmweZTBcc23nUB9gTlKheQIyQUDlNQsVcXwYBrc7EBRfRj_O6S_FbwNTDcjdoZHe7aSKGVdkuvqgrWMB_q3Umdx8HKoX1jXGbKaYWwvOvGpy",
  },
  {
    step: "02",
    title: "Get the Ingredients",
    body: "We source rare spices, heritage grains, and local essentials directly from the source.",
    align: "right",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8zjL-hleO14Ysm5Gg1_odr4-v7-Ebfts49_V9gVWJ1khICK4RWh6j-6h6OtBxXGr4DWC0V8oOXItVMysCiBLWZNcaTDu4NRFtBeA776GYsQya_O5bi--keFwfpIaPN0_wbqpxJywwbSsxuECXZaWbKx0ebG7cLG4wcujvBPFC8C-BUd7ZWWle2v93vk8ekbtdQ7QFrPxTxfMR4MTPI_tdIMQnV5smTUtR0WPM2qzv7gwIOsWaITNIsOw7r_xwNboXjZ9NQQbi14hj",
  },
  {
    step: "03",
    title: "Follow the Journey",
    body: "Access our cinematic cooking guides and cultural playlists that transport you to your destination as you cook.",
    align: "center",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCB1Y6QQqOkqUdqr1Qh5C6yYOLzusGF4fT_R6zhwrCeI6dZNWsAlNNgqqE4FmnDBt6SuO5ObCrC3FYMiOxnG5W1nPUSeyx_TrUjqjzxcjW1cxSqvt7XINlNfjbGD-eEcIZUaIxp_SUgDwQCgjeO7pvg958WlWHw7yGhlr8yibInFs57Mj7SsMxAdohGhLrCRDaNuxPbycntgOJkrftQnUIMidI3tPH_gXHvAISJF2Nnyh-QyCcCyb48yWWdF5y_uwkwEwKcJli_wyqJ",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitted, setHeroSubmitted] = useState(false);
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
    if (email.trim()) {
      setCtaSubmitted(true);
      setEmail("");
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#fef9f3", color: "#1d1b18" }}>
      {/* ── NAV ── */}
      <header
        className="fixed top-0 w-full z-50"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <nav className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-5 max-w-screen-2xl mx-auto">
          <div
            className="text-xl sm:text-2xl font-semibold text-white drop-shadow-md"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            The Culinary Editorial
          </div>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-10">
            {["Journal", "Ethos", "Destinations"].map((item, i) => (
              <a
                key={item}
                href="#"
                className="transition-colors"
                style={{
                  fontFamily: "'Noto Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "18px",
                  color: i === 0 ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.8)",
                  borderBottom: i === 0 ? "2px solid white" : "none",
                  paddingBottom: i === 0 ? "4px" : "0",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = i === 0 ? "white" : "rgba(255,255,255,0.8)"; }}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-full font-medium transition-all hover:opacity-90 active:scale-95 text-sm sm:text-base"
              style={{ backgroundColor: "#9a4100", color: "#ffffff", padding: "10px 24px" }}
              onClick={() => document.getElementById("hero-signup")?.scrollIntoView({ behavior: "smooth" })}
            >
              Early Access
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </nav>
        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden" style={{ backgroundColor: "rgba(29,27,24,0.95)", backdropFilter: "blur(16px)" }}>
            {["Journal", "Ethos", "Destinations"].map((item) => (
              <a
                key={item}
                href="#"
                className="block px-8 py-4 text-white/90 hover:text-white border-b"
                style={{ fontFamily: "'Noto Serif', Georgia, serif", fontStyle: "italic", fontSize: "18px", borderColor: "rgba(255,255,255,0.08)" }}
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </header>
      <main>
        {/* ── HERO ── */}
        <section className="relative w-full overflow-hidden" style={{ height: "100svh", minHeight: "600px" }}>
          <img
            alt="Sunset dinner in a lush vineyard"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuChMpRqdNeAh86v51t2nZOMRO-8OekmzcxLrhg3d0CQdSCMDSGahUD62M5cR0J8Askr07ZZc_FfOscn3tr6jsiO72jvdaCdwxA3THGVUW6LeQOfe61vXGnew_An8QWgEZnlnaFGyjXswlVLSNdfNLbw1u7AA9bYT-Ob_z2q5953Onne7Etj0jf_qV6YuLzMA-yZssD4-g_Q4rKDcCPVYZr47NIYhQEX0F_4dGJHiqnCk5WpA9BfspHOI_4x6SY5xem96iiAEPoQueCs"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)" }}
          />
          <div className="relative h-full flex flex-col items-center justify-center pt-20 px-6 text-center">
            <h1
              className="text-white font-semibold tracking-tighter leading-none mb-6 sm:mb-8"
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontSize: "clamp(3rem, 10vw, 9rem)",
                maxWidth: "1400px",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Eat Your Way Across the Globe.
            </h1>
            <p
              className="text-white/95 max-w-3xl leading-relaxed mb-10 sm:mb-12"
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.875rem)",
                fontStyle: "italic",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              A curated journey through the world's most soul-stirring cuisines, delivered from your kitchen.
            </p>
            {/* Early access sign-up */}
            <div id="hero-signup" className="w-full max-w-xl">
              {heroSubmitted ? (
                <div
                  className="flex items-center justify-center gap-3 rounded-full px-8 py-5"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="text-white font-medium" style={{ fontFamily: "'Noto Serif', Georgia, serif", fontStyle: "italic", fontSize: "1.125rem" }}>
                    You're on the list — we'll be in touch soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={heroEmail}
                    onChange={(e) => setHeroEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="flex-1 rounded-full outline-none text-base sm:text-lg"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#ffffff",
                      padding: "18px 28px",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.22)"; }}
                    onBlur={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
                  />
                  <button
                    type="submit"
                    className="rounded-full font-semibold shadow-2xl transition-all hover:opacity-90 active:scale-[0.98] whitespace-nowrap"
                    style={{
                      backgroundColor: "#9a4100",
                      color: "#ffffff",
                      padding: "18px 36px",
                      fontSize: "1rem",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Request Early Access
                  </button>
                </form>
              )}
              <p className="text-white/60 text-sm mt-4 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                Be first to explore the world from your kitchen. No spam, ever.
              </p>
            </div>
          </div>
        </section>

        {/* ── EDITORIAL STATEMENT ── */}
        <section
          className="flex flex-col items-center justify-center px-8 py-24 sm:py-36"
          style={{ backgroundColor: "#fef9f3", borderTop: "1px solid #f2ede7", borderBottom: "1px solid #f2ede7", minHeight: "40vh" }}
        >
          <div className="max-w-4xl text-center space-y-6">
            <span
              className="block mb-4 text-sm font-bold uppercase"
              style={{ color: "#9a4100", letterSpacing: "0.4em", fontFamily: "'Inter', sans-serif" }}
            >
              The Experience
            </span>
            <h2
              className="leading-tight"
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                color: "#1d1b18",
              }}
            >
              A New Chapter in Every Meal.
            </h2>
            <p
              className="leading-relaxed font-light max-w-3xl mx-auto"
              style={{
                fontSize: "clamp(1rem, 2vw, 1.5rem)",
                color: "#725a3c",
              }}
            >
              We strip away the noise of traditional recipe sites to bring you the narrative of flavor. Each box is a passport to a culture's heart.
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS — 3 full-screen sections ── */}
        {HOW_IT_WORKS.map((step) => (
          <section key={step.step} className="relative w-full overflow-hidden" style={{ minHeight: "100svh" }}>
            <img
              alt={step.title}
              className="absolute inset-0 w-full h-full object-cover"
              src={step.image}
            />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.42)" }} />
            <div
              className="relative h-full flex items-center p-8 sm:p-16 md:p-24"
              style={{
                minHeight: "100svh",
                justifyContent:
                  step.align === "left"
                    ? "flex-start"
                    : step.align === "right"
                    ? "flex-end"
                    : "center",
                textAlign: step.align === "center" ? "center" : "left",
              }}
            >
              <div className="max-w-2xl text-white">
                <span
                  className="block mb-4 opacity-60 text-[60px]"
                  style={{ fontFamily: "'Noto Serif', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2rem, 4vw, 2.5rem)" }}
                >
                  {step.step}
                </span>
                <h3
                  className="leading-none mb-6 sm:mb-8"
                  style={{
                    fontFamily: "'Noto Serif', Georgia, serif",
                    fontSize: "clamp(3rem, 8vw, 6.5rem)",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="leading-relaxed font-light text-white/90"
                  style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}
                >
                  {step.body}
                </p>
              </div>
            </div>
          </section>
        ))}

        {/* ── CURRENT DESTINATIONS ── */}
        <section className="py-24 sm:py-32" style={{ backgroundColor: "#fef9f3" }}>
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 mb-16 sm:mb-20">
            <div
              className="flex flex-col md:flex-row justify-between items-baseline gap-6 pb-10 sm:pb-12"
              style={{ borderBottom: "1px solid rgba(154,65,0,0.2)" }}
            >
              <div>
                <span
                  className="block mb-2 text-sm font-bold uppercase"
                  style={{ color: "#9a4100", letterSpacing: "0.3em", fontFamily: "'Inter', sans-serif" }}
                >
                  This Month's Features
                </span>
                <h2
                  className="leading-none"
                  style={{
                    fontFamily: "'Noto Serif', Georgia, serif",
                    fontSize: "clamp(3rem, 8vw, 6rem)",
                    color: "#1d1b18",
                  }}
                >
                  Current Destinations
                </h2>
              </div>
              <a
                href="#"
                className="flex items-center gap-2 font-semibold text-lg hover:gap-3 transition-all"
                style={{ color: "#9a4100" }}
              >
                View All Issues
                <span className="material-symbols-outlined">arrow_right_alt</span>
              </a>
            </div>
          </div>

          {/* Desktop: staggered 3-col grid */}
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 hidden md:grid grid-cols-3 gap-10 lg:gap-12 items-start">
            {DESTINATIONS.map((dest) => (
              <DestinationCard key={dest.id} dest={dest} stagger={dest.offset} />
            ))}
          </div>

          {/* Mobile: stacked */}
          <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 flex flex-col gap-8 md:hidden">
            {DESTINATIONS.map((dest) => (
              <DestinationCard key={dest.id} dest={dest} stagger={false} />
            ))}
          </div>
        </section>

        {/* ── QUOTE ── */}
        <section className="py-28 sm:py-40 px-8" style={{ backgroundColor: "#ffffff" }}>
          <div className="max-w-5xl mx-auto text-center space-y-12 sm:space-y-16">
            <span
              className="material-symbols-outlined block"
              style={{ color: "rgba(154,65,0,0.3)", fontSize: "80px", fontVariationSettings: "'FILL' 1" }}
            >
              format_quote
            </span>
            <blockquote
              className="leading-tight"
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
                color: "#1d1b18",
              }}
            >
              "The Culinary Editorial isn't just a recipe box. It's an evening of discovery that turns my Tuesday night kitchen into a sun-drenched bistro in Provence. Every ingredient tells a story."
            </blockquote>
            <div className="flex flex-col items-center gap-5 sm:gap-6">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-xl"
              >
                <img
                  alt="Elena Rossi"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXs9G1nR_upbGeTUL-OAwsbFi1M6S-hyddJSmSL_EbOLphn-ouho1YBojVCjoAjtyKkRbgVQrpBd566PEol9oE1LOIvRfeul-HtMGD7zof6n6TzXmZzq6OdlipAh4xE3F-0Q2siCQIs9Q_OzeFNXJFLAvLAM2OCAoX8wst90-GLdVUCxchKp6mrKuWq6YATpgmmP1V7MXmryO4pA1K03HnIKgOvkci5W857_nzgGlZ43DVA50lEC5CwOrS0zxuK7U1dPJnGd7eglle"
                />
              </div>
              <div>
                <p className="font-bold text-xl sm:text-2xl">Elena Rossi</p>
                <p
                  className="text-sm uppercase mt-2"
                  style={{ color: "#9a4100", letterSpacing: "0.3em", fontFamily: "'Inter', sans-serif" }}
                >
                  Travel Writer &amp; Home Chef
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          className="relative flex items-center justify-center px-8 overflow-hidden"
          style={{ minHeight: "600px", backgroundColor: "#1d1b18", paddingTop: "80px", paddingBottom: "80px" }}
        >
          <div className="absolute inset-0 z-0">
            <img
              alt="Spices and food"
              className="w-full h-full object-cover"
              style={{ opacity: 0.3, filter: "grayscale(1)" }}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0bN96Jr4ck4sr4fw9hc5R5SN4P9WryPO53t3sCEuewxCAyW4zrlavGXNs2l5GeK7Wxmw5dCpu6YPX3mjavMcTTXuCYS5IJ7VOYE7i7eTbh-_dOYUNnaiVDir_8ZDfZIW7YkdtvKTkvHjlvMgXrzV-ZikQd4wJn8BzDrRi_dXyBmVGqfCOalVpfWRAWHMDc3rwIIJ4fpyOmSfIfzRM0WXLVUWrUrhej1IpxpcFwUo0LCpkJDnCNY8pqBKaGpDk-zfUGdrbilaO3u1z"
            />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10 sm:space-y-12">
            <h2
              className="text-white leading-none"
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontSize: "clamp(2.5rem, 9vw, 8rem)",
              }}
            >
              Bring the World to Your Table.
            </h2>
            <p
              className="text-white/80 max-w-3xl mx-auto font-light leading-relaxed"
              style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}
            >
              Subscribe now to receive your first curated editorial experience. Shipping globally starting this winter.
            </p>
            <div className="pt-4 sm:pt-8 w-full max-w-xl mx-auto">
              {ctaSubmitted ? (
                <div
                  className="flex items-center justify-center gap-3 rounded-full px-8 py-5"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="text-white font-medium" style={{ fontFamily: "'Noto Serif', Georgia, serif", fontStyle: "italic", fontSize: "1.125rem" }}>
                    You're on the list — we'll be in touch soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="flex-1 rounded-full outline-none text-base sm:text-lg"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#ffffff",
                      padding: "18px 28px",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"; }}
                    onBlur={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)"; }}
                  />
                  <button
                    type="submit"
                    className="rounded-full font-bold shadow-2xl transition-all hover:opacity-90 active:scale-[0.98] whitespace-nowrap"
                    style={{
                      backgroundColor: "#9a4100",
                      color: "#ffffff",
                      padding: "18px 36px",
                      fontSize: "1rem",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Request Early Access
                  </button>
                </form>
              )}
              <p className="text-white/50 text-sm mt-4 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                Shipping globally — launching this winter.
              </p>
            </div>
          </div>
        </section>
      </main>
      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: "#f8f3ed", borderTop: "1px solid #ece7e2" }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 sm:gap-16 px-8 sm:px-12 py-16 sm:py-24 max-w-screen-2xl mx-auto">
          {/* Brand */}
          <div className="md:col-span-5 space-y-6 sm:space-y-8">
            <span
              className="block font-bold"
              style={{ fontFamily: "'Noto Serif', Georgia, serif", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#9a4100" }}
            >
              The Culinary Editorial
            </span>
            <p className="text-lg leading-relaxed max-w-md" style={{ color: "#725a3c" }}>
              Curating the world's most evocative food stories and delivering the soul of global cuisines directly to your home.
            </p>
            <div className="flex gap-6">
              {["Instagram", "Pinterest", "Twitter"].map((s) => (
                <a key={s} href="#" className="hover:opacity-70 transition-opacity" style={{ color: "#9a4100" }}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-3 grid grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-4 sm:space-y-6">
              <h4 className="font-bold uppercase text-xs" style={{ color: "#9a4100", letterSpacing: "0.2em" }}>Discover</h4>
              <ul className="space-y-3 sm:space-y-4 text-base" style={{ color: "#725a3c" }}>
                {["Journal", "Ethos", "Destinations"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-[#9a4100] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <h4 className="font-bold uppercase text-xs" style={{ color: "#9a4100", letterSpacing: "0.2em" }}>Company</h4>
              <ul className="space-y-3 sm:space-y-4 text-base" style={{ color: "#725a3c" }}>
                {["Privacy", "Terms", "Press"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-[#9a4100] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-6 sm:space-y-8">
            <h4 className="font-bold uppercase text-xs" style={{ color: "#9a4100", letterSpacing: "0.2em" }}>The Newsletter</h4>
            <p className="text-base" style={{ color: "#725a3c" }}>Weekly stories of flavor and far-off places.</p>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full text-base outline-none focus:ring-2 rounded-lg"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #ece7e2",
                  padding: "16px 24px",
                  color: "#1d1b18",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                type="submit"
                className="font-bold uppercase rounded-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#9a4100",
                  color: "#ffffff",
                  padding: "16px 32px",
                  fontSize: "14px",
                  letterSpacing: "0.1em",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Join the Editorial
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div
          className="px-12 py-8 sm:py-12 text-center"
          style={{ borderTop: "1px solid rgba(222,193,179,0.2)" }}
        >
          <p className="text-sm" style={{ color: "#725a3c" }}>
            © 2024 The Culinary Editorial. All rights reserved. Designed for the global explorer.
          </p>
        </div>
      </footer>
    </div>
  );
}

function DestinationCard({ dest, stagger }: { dest: typeof DESTINATIONS[number]; stagger: boolean }) {
  return (
    <div
      className="group relative overflow-hidden cursor-pointer"
      style={{
        backgroundColor: "#f8f3ed",
        aspectRatio: "3/4.5",
        marginTop: stagger ? "96px" : "0",
      }}
    >
      <img
        alt={dest.label}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 group-hover:[filter:grayscale(0%)]"
        style={{ filter: "grayscale(20%)" }}
        src={dest.image}
      />
      <div
        className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.8) 100%)" }}
      >
        <span
          className="text-white text-sm uppercase self-start"
          style={{ letterSpacing: "0.4em", borderLeft: "2px solid #9a4100", paddingLeft: "16px", fontFamily: "'Inter', sans-serif" }}
        >
          {dest.volume}
        </span>
        <div className="text-white text-left">
          <h3
            className="leading-none mb-3 sm:mb-4"
            style={{ fontFamily: "'Noto Serif', Georgia, serif", fontSize: "clamp(3rem, 6vw, 5rem)", textAlign: "left" }}
          >
            {dest.label}
          </h3>
          <p
            className="mb-6 sm:mb-8 opacity-90"
            style={{ fontFamily: "'Noto Serif', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1rem, 2vw, 1.5rem)", textAlign: "left" }}
          >
            {dest.subtitle}
          </p>
          <button
            className="rounded-full font-bold uppercase transition-colors text-sm"
            style={{
              backgroundColor: "#ffffff",
              color: "#1d1b18",
              padding: "12px 32px",
              letterSpacing: "0.1em",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#9a4100"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "white"; (e.currentTarget as HTMLButtonElement).style.color = "#1d1b18"; }}
          >
            Explore Issue
          </button>
        </div>
      </div>
    </div>
  );
}
