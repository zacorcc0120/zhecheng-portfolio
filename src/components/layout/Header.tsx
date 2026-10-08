"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { href: "/work", label: "Work" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <Link
        href="/"
        className="wordmark"
        onClick={() => setMenuOpen(false)}
        aria-label="Zhecheng Cao, home"
      >
        ZHECHENG CAO<span className="wordmark-sign">©</span>
      </Link>
      <span className="header-note">DESIGN × AI × COMPUTATION</span>
      <nav aria-label="Main navigation" className="desktop-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={
              pathname.startsWith(link.href) && link.href !== "/#contact"
                ? "page"
                : undefined
            }
          >
            {link.label}
            <span className="nav-line" />
          </Link>
        ))}
      </nav>
      <button
        ref={toggle}
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="mobile-nav"
        >
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              <span className="eyebrow">0{i + 1}</span>
              {link.label}
              <ArrowUpRight size={24} />
            </Link>
          ))}
          <p className="caption">曹哲诚 / Computational Designer</p>
        </nav>
      )}
    </header>
  );
}
