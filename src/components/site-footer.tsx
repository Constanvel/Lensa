import Link from "next/link";

/**
 * Inter 13px muted throughout. Column heads differ from their column by weight
 * alone — same size, same colour. Nothing here is accent and nothing is Literata.
 */
const COLUMNS: Array<{ head: string; links: Array<{ href: string; label: string }> }> = [
  {
    head: "Read",
    links: [
      { href: "/", label: "Feed" },
      { href: "/lenses", label: "The six lenses" },
      { href: "/characters", label: "Characters" },
      { href: "/works", label: "Works" },
    ],
  },
  {
    head: "Write",
    links: [
      { href: "/rules", label: "The writing rules" },
      { href: "/write", label: "Start an essay" },
      { href: "/characters/new", label: "Add a character" },
    ],
  },
  {
    head: "Account",
    links: [
      { href: "/me", label: "My work" },
      { href: "/settings", label: "Settings" },
      { href: "/design/states", label: "Component states" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-cols">
        {COLUMNS.map((column) => (
          <div key={column.head}>
            <h2 className="footer-head">{column.head}</h2>
            <ul className="list-none p-0">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="plain">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
