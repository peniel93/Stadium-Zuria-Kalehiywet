import Link from "next/link";
import { navItems } from "@/lib/portal-data";

type Locale = "en" | "am";

type ExtraNavLink = {
  href: string;
  labelEn: string;
  labelAm?: string;
  isActive?: boolean;
};

type PublicSiteHeaderProps = {
  locale?: Locale;
  activeNavKey?: string;
  extraNavLink?: ExtraNavLink;
  rightControls?: React.ReactNode;
};

export function PublicSiteHeader({
  locale = "en",
  activeNavKey,
  extraNavLink,
  rightControls,
}: PublicSiteHeaderProps) {
  return (
    <header className="top-bar" style={{ gridTemplateColumns: "auto 1fr auto" }}>
      <div className="logo logo-left">DSZ</div>

      <nav className="desktop-nav public-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={item.key === activeNavKey ? "active" : undefined}
            aria-current={item.key === activeNavKey ? "page" : undefined}
          >
            {locale === "am" ? item.label.am : item.label.en}
          </Link>
        ))}

        {extraNavLink ? (
          <Link
            href={extraNavLink.href}
            className={extraNavLink.isActive ? "active" : undefined}
            aria-current={extraNavLink.isActive ? "page" : undefined}
          >
            {locale === "am" ? extraNavLink.labelAm ?? extraNavLink.labelEn : extraNavLink.labelEn}
          </Link>
        ) : null}
      </nav>

      <div className="controls">{rightControls}</div>
    </header>
  );
}
