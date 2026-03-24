import { Link, useLocation } from "wouter";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Destinations", href: "/destinations" },
  { label: "About", href: "/about" },
];

const FOOTER_DISCOVER = [
  { label: "Features", href: "/features" },
  { label: "Destinations", href: "/destinations" },
  { label: "About", href: "/about" },
];

const FOOTER_COMPANY = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Press", href: "/press" },
];

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <div className="bg-[#FEF9F3] text-[#1C1A17] font-sans selection:bg-[#8A3800]/20 min-h-screen flex flex-col">
      <header className={`fixed top-0 w-full z-50 border-b ${isHome ? "bg-white/5 backdrop-blur-md border-white/10" : "bg-[#FEF9F3]/95 backdrop-blur-md border-[#8a7266]/10"}`}>
        <nav className="flex justify-between items-center px-8 py-5 max-w-[1536px] mx-auto">
          <Link href="/" className={`text-2xl font-serif font-bold tracking-tight ${isHome ? "text-white" : "text-[#1C1A17]"}`}>
            Fork <span className="text-[#8A3800]">&amp;</span> Compass
          </Link>
          <div className="hidden md:flex items-center space-x-12">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`transition-colors text-[13px] font-bold uppercase tracking-[0.2em] ${
                  isHome
                    ? "text-white/80 hover:text-white"
                    : location === link.href
                    ? "text-[#8A3800]"
                    : "text-[#725a3c] hover:text-[#8A3800]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link
            href="/#cta-section"
            className="bg-[#8A3800] text-white px-8 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            Join Waitlist
          </Link>
        </nav>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="w-full bg-[#F2EDE7] border-t border-[#8a7266]/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 px-12 py-24 max-w-[1536px] mx-auto">
          <div className="md:col-span-5 space-y-8">
            <Link href="/" className="text-3xl font-serif font-bold text-[#8A3800] block">Fork &amp; Compass</Link>
            <p className="text-lg leading-relaxed text-[#725a3c] max-w-md">
              Curating the world's most evocative food stories and delivering the soul of global cuisines directly to your home.
            </p>
            <div className="flex gap-6">
              {["Instagram", "Pinterest", "Twitter"].map((social) => (
                <a key={social} href="#" className="text-[#8A3800] hover:opacity-70 font-bold text-[13px] uppercase tracking-widest">
                  {social}
                </a>
              ))}
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="font-bold uppercase tracking-widest text-[13px] text-[#8A3800]">Discover</h4>
              <ul className="space-y-4 text-base text-[#725a3c]">
                {FOOTER_DISCOVER.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[#8A3800] transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-bold uppercase tracking-widest text-[13px] text-[#8A3800]">Company</h4>
              <ul className="space-y-4 text-base text-[#725a3c]">
                {FOOTER_COMPANY.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[#8A3800] transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="md:col-span-4 space-y-8">
            <h4 className="font-bold uppercase tracking-widest text-[13px] text-[#8A3800]">Support</h4>
            <p className="text-base text-[#725a3c]">Have a question about a journey? We're here to help.</p>
            <a href="mailto:hello@forkandcompass.com" className="inline-block text-[#8A3800] font-bold text-lg border-b-2 border-[#8A3800]/20 hover:border-[#8A3800] transition-all pb-1">
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
