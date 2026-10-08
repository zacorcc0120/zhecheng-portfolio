import Link from "next/link";
import { ArrowUp, ArrowUpRight, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { site } from "@/data/site";

type Channel = {
  name: string;
  href: string | null;
  // Only real external destinations open a new tab. mailto: and tel: stay in
  // the page flow and must not get a blank tab the reader cannot come back from.
  external: boolean;
  Icon: LucideIcon;
};

export function Contact({ compact = false }: { compact?: boolean }) {
  // Only configured channels are rendered. A missing one used to print
  // "待补充" into the last thing a visitor sees, which reads as unfinished
  // work rather than as an honest absence.
  const allChannels: Channel[] = [
    {
      name: "Email",
      href: site.email ? `mailto:${site.email}` : null,
      external: false,
      Icon: ArrowUpRight,
    },
    {
      // The number is the label on purpose. A "Phone" heading would hide the
      // only value a reader can actually copy or dial from this page.
      name: site.phoneLabel,
      href: site.phone ? `tel:${site.phone}` : null,
      external: false,
      Icon: Phone,
    },
    { name: "GitHub", href: site.github, external: true, Icon: ArrowUpRight },
    { name: "LinkedIn", href: site.linkedin, external: true, Icon: ArrowUpRight },
  ];
  const channels = allChannels.filter(
    (c): c is Channel & { href: string } => Boolean(c.href),
  );

  return (
    <section
      id="contact"
      className={`contact-section section-shell ${compact ? "compact-contact" : ""}`}
    >
      <div className="section-kicker">
        <span>GET IN TOUCH</span>
        <span>GUILIN, CHINA ↗</span>
      </div>
      <h2>
        LET’S CREATE
        <br />
        <span className="muted">SOMETHING.</span>
      </h2>
      <div className="contact-bottom">
        <p>
          关于设计系统、AI 工作流，
          <br />
          或者一个值得探索的问题。
        </p>
        {channels.length > 0 && (
          <div className="contact-links">
            {channels.map((contact) => (
              <a
                key={contact.name}
                href={contact.href}
                target={contact.external ? "_blank" : undefined}
                rel={contact.external ? "noopener noreferrer" : undefined}
              >
                {contact.name}
                <contact.Icon size={18} />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <span>© 2026 ZHECHENG CAO</span>
      <span className="footer-phrase">RULES INTO POSSIBILITIES.</span>
      <Link href="#top" scroll={true} className="text-link">
        BACK TO TOP <ArrowUp size={14} />
      </Link>
    </footer>
  );
}
