"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { Icon } from "./icons";
import { saveReadingPositions, toggleRail } from "@/lib/actions";

const RAIL_WIDTH = 200;
const RAIL_COLLAPSED = 64;

type Progress = {
  position: number;
  work: { id: string; slug: string; title: string; unit_label: string; unit_count: number | null };
};

type Viewer = { handle: string; display_name: string } | null;

/** Lets the reader's own top bar open the drawer without re-plumbing state. */
const ShellContext = createContext<{ openDrawer: () => void }>({ openDrawer: () => {} });
export const useShell = () => useContext(ShellContext);

const NAV = [
  { href: "/", label: "Feed", icon: <Icon.feed />, match: ["/"] },
  { href: "/characters", label: "Characters", icon: <Icon.characters />, match: ["/characters", "/c/"] },
  { href: "/works", label: "Works", icon: <Icon.works />, match: ["/works", "/w/"] },
];

const MINE = [{ href: "/me", label: "My work", icon: <Icon.mywork />, match: ["/me"] }];

const REFERENCE = [
  { href: "/rules", label: "Writing rules", icon: <Icon.rules />, match: ["/rules"] },
  { href: "/settings", label: "Settings", icon: <Icon.settings />, match: ["/settings"] },
];

/** Active row: raised ground plus a 2px accent bar. Write is the one fill. */
function railRow(active: boolean, primary = false) {
  const base =
    "flex h-11 flex-none cursor-pointer items-center gap-[14px] border-0 border-l-2 pl-[18px] pr-4 text-left";
  if (primary) {
    return `${base} border-l-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--paper)] hover:border-l-[color:var(--accent-h)] hover:bg-[color:var(--accent-h)]`;
  }
  if (active) {
    return `${base} border-l-[color:var(--accent)] bg-[color:var(--raised)] text-[color:var(--accent)]`;
  }
  return `${base} border-l-transparent bg-transparent text-[color:var(--ink2)] hover:text-[color:var(--ink)]`;
}

export function AppShell({
  collapsed,
  viewer,
  progress,
  footer,
  children,
}: {
  collapsed: boolean;
  viewer: Viewer;
  progress: Progress[];
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <ShellContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
      <div className="relative flex min-h-screen items-start">
        {/* 1024 and up only. Below that the rail is zero-width and the drawer takes over. */}
        <div
          className="sticky top-0 z-30 hidden self-start transition-[flex-basis] duration-150 md:block"
          style={{ flex: `0 0 ${collapsed ? RAIL_COLLAPSED : RAIL_WIDTH}px` }}
        >
          <Rail collapsed={collapsed} viewer={viewer} progress={progress} pathname={pathname} />
        </div>

        {/* The bar yields only when a reader bar is actually present, so a 404
            under /e/ still gets its chrome. See .shell-main:has(.reader-thesis). */}
        <div className="shell-main flex min-h-screen min-w-0 flex-1 flex-col">
          <TopBar viewer={viewer} onMenu={() => setDrawerOpen(true)} />
          <div className="flex-1">{children}</div>
          {footer}
        </div>
      </div>

      {drawerOpen && <Drawer viewer={viewer} pathname={pathname} onClose={() => setDrawerOpen(false)} />}
    </ShellContext.Provider>
  );
}

// ─── top bar ────────────────────────────────────────────────────────────────

function TopBar({ viewer, onMenu }: { viewer: Viewer; onMenu: () => void }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const onLenses = pathname.startsWith("/lenses");

  return (
    <div className="topbar" data-search={searchOpen ? "open" : undefined}>
      <button type="button" aria-label="Open navigation" onClick={onMenu} className="menu-btn">
        <Icon.menu />
      </button>

      <Link href="/" className="wordmark plain">
        Lensa
      </Link>

      <Link
        href="/lenses"
        className={`chrome-item meta plain ml-2 hidden items-center border-0 border-b py-[2px] md:inline-flex ${
          onLenses
            ? "border-b-[color:var(--accent)] text-[color:var(--accent)]"
            : "border-b-[color:var(--rule)] text-[color:var(--ink2)] hover:text-[color:var(--ink)]"
        }`}
      >
        Lenses
      </Link>

      {/* 44px field that grows to fill the bar on focus over 160ms. */}
      <form action="/search" className="search-slot flex items-center">
        <label className="sr-only" htmlFor="q">
          Search characters, works, essays
        </label>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Search characters, works, essays"
          className="search"
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setSearchOpen(false)}
        />
      </form>

      {viewer ? (
        <Link
          href={`/u/${viewer.handle}`}
          className="chrome-item meta plain hidden px-3 hover:text-[color:var(--ink)] md:block"
        >
          {viewer.display_name}
        </Link>
      ) : (
        <div className="chrome-item flex items-center gap-2">
          <Link
            href="/signin"
            className="meta plain hidden h-11 items-center px-3 hover:text-[color:var(--ink)] md:flex"
          >
            Sign in
          </Link>
          <Link href="/signin?mode=signup" className="btn plain">
            Make an account
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── left rail ──────────────────────────────────────────────────────────────

function Rail({
  collapsed,
  viewer,
  progress,
  pathname,
}: {
  collapsed: boolean;
  viewer: Viewer;
  progress: Progress[];
  pathname: string;
}) {
  const [positionsOpen, setPositionsOpen] = useState(false);

  const on = (prefixes: string[]) =>
    prefixes.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));

  const fade = collapsed ? "opacity-0" : "opacity-100";
  const Label = ({ children }: { children: string }) => (
    <span
      className={`whitespace-nowrap text-sm leading-none font-medium transition-opacity duration-100 ${fade}`}
    >
      {children}
    </span>
  );

  const groupClass = `whitespace-nowrap pt-5 pb-2 pl-5 text-[11px] leading-[1.4] font-medium tracking-[0.1em] text-[color:var(--muted)] uppercase transition-opacity duration-100 ${fade}`;

  const Divider = () => (
    <div className="mt-3 ml-[18px] h-px bg-[color:var(--rule)]" style={{ width: RAIL_WIDTH - 36 }} />
  );

  const row = (item: { href: string; label: string; icon: ReactNode; match: string[] }) => (
    <Link
      key={item.href}
      href={item.href}
      className={`plain ${railRow(on(item.match))}`}
      style={{ width: RAIL_WIDTH }}
    >
      {item.icon}
      <Label>{item.label}</Label>
    </Link>
  );

  return (
    <nav
      aria-label="Sections"
      className="overflow-hidden border-r border-[color:var(--rule)] bg-[color:var(--paper)] pt-4 pb-4 transition-[width] duration-150"
      style={{ width: collapsed ? RAIL_COLLAPSED : RAIL_WIDTH }}
    >
      {/* The only filled accent surface anywhere in the chrome. */}
      {viewer && (
        <Link href="/write" className={`plain ${railRow(false, true)}`} style={{ width: RAIL_WIDTH }}>
          <Icon.write />
          <Label>Write an essay</Label>
        </Link>
      )}

      <div className={groupClass}>Browse</div>
      {NAV.map(row)}

      {viewer && (
        <>
          <Divider />
          <div className={groupClass}>Mine</div>
          {MINE.map(row)}

          <div className="relative">
            <button
              type="button"
              aria-expanded={positionsOpen}
              onClick={() => setPositionsOpen(!positionsOpen)}
              className={railRow(false)}
              style={{ width: RAIL_WIDTH }}
            >
              <Icon.position />
              <Label>Reading position</Label>
            </button>
            {positionsOpen && (
              <PositionPanel
                collapsed={collapsed}
                progress={progress}
                onDone={() => setPositionsOpen(false)}
              />
            )}
          </div>
        </>
      )}

      <Divider />
      <div className={groupClass}>Reference</div>
      {REFERENCE.map(row)}

      <Divider />
      {/* A button the reader presses. The choice persists; hover changes nothing. */}
      <form action={toggleRail.bind(null, collapsed)}>
        <button
          type="submit"
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
          className={railRow(false)}
          style={{ width: RAIL_WIDTH }}
        >
          <Icon.collapse flipped={collapsed} />
          <Label>Collapse</Label>
        </button>
      </form>
    </nav>
  );
}

// ─── drawer ─────────────────────────────────────────────────────────────────

const DRAWER_ITEMS = [
  { href: "/", label: "Feed", match: ["/"] },
  { href: "/characters", label: "Characters", match: ["/characters", "/c/"] },
  { href: "/works", label: "Works", match: ["/works", "/w/"] },
  { href: "/lenses", label: "Lenses", match: ["/lenses"] },
  { href: "/rules", label: "Writing rules", match: ["/rules"] },
];

const DRAWER_MINE = [
  { href: "/me", label: "My work", match: ["/me"] },
  { href: "/settings", label: "Settings", match: ["/settings"] },
];

/** Below 1024 this is the whole navigation: full screen, set in Literata. */
function Drawer({
  viewer,
  pathname,
  onClose,
}: {
  viewer: Viewer;
  pathname: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const on = (prefixes: string[]) =>
    prefixes.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));

  const item = (entry: { href: string; label: string; match: string[] }) => (
    <Link key={entry.href} href={entry.href} className="drawer-item plain" data-on={on(entry.match) || undefined}>
      {entry.label}
    </Link>
  );

  return (
    <div className="drawer md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="flex items-center gap-3">
        <Link href="/" className="wordmark plain">
          Lensa
        </Link>
        <button type="button" onClick={onClose} className="text-btn text-btn-bare ml-auto">
          Close
        </button>
      </div>

      <nav className="drawer-nav overflow-y-auto">
        {DRAWER_ITEMS.map(item)}
        {viewer && (
          <>
            <div className="drawer-group">Mine</div>
            {DRAWER_MINE.map(item)}
          </>
        )}
      </nav>

      <div className="drawer-foot">
        {viewer ? (
          <>
            <Link href="/write" className="btn btn-accent plain mb-4 w-full">
              Write an essay
            </Link>
            <Link href={`/u/${viewer.handle}`} className="plain flex items-center gap-3">
              <span className="avatar h-8 w-8" />
              <span className="serif-md flex-1">{viewer.display_name}</span>
              <span className="meta">Profile</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {/* Outline, not filled: Write is the only accent fill in the chrome. */}
            <Link href="/signin?mode=signup" className="btn plain">
              Make an account
            </Link>
            <Link href="/signin" className="text-btn text-btn-bare plain">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── reading position ───────────────────────────────────────────────────────

function PositionPanel({
  collapsed,
  progress,
  onDone,
}: {
  collapsed: boolean;
  progress: Progress[];
  onDone: () => void;
}) {
  return (
    <div
      className="absolute top-2 z-50 w-[340px] border border-[color:var(--rule)] bg-[color:var(--paper)] p-5"
      style={{ left: collapsed ? RAIL_COLLAPSED + 8 : RAIL_WIDTH + 8 }}
    >
      <div className="meta rule-b pb-4">Reading position</div>

      <form action={saveReadingPositions}>
        {progress.length === 0 && (
          <p className="note-lg mt-4 mb-0">
            No works tracked yet. Set one from Settings, or from any work page.
          </p>
        )}
        {progress.map(({ work, position }) => (
          <div key={work.id} className="flex items-baseline gap-3 pt-4">
            <span className="serif-sm flex-1">{work.title}</span>
            <input
              name={`position:${work.id}`}
              defaultValue={position}
              inputMode="numeric"
              className="field field-num"
              aria-label={`Position in ${work.title}`}
            />
            <span className="meta">of {work.unit_count ?? "—"}</span>
          </div>
        ))}
        <p className="note mt-4 mb-4">
          Paragraphs past your position stay blurred, labelled with the chapters they cover, until you
          choose to see them.
        </p>
        <div className="rule-t flex items-center gap-2 pt-4">
          <button type="submit" className="btn btn-caps">
            Save position
          </button>
          <button type="button" onClick={onDone} className="text-btn text-btn-bare ml-3">
            Done
          </button>
        </div>
      </form>
    </div>
  );
}
