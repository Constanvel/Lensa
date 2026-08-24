"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Icon } from "./icons";
import { saveReadingPositions, toggleRail } from "@/lib/actions";

const RAIL_WIDTH = 200;
const RAIL_COLLAPSED = 64;

type Progress = {
  position: number;
  work: { id: string; slug: string; title: string; unit_label: string; unit_count: number | null };
};

type Viewer = { handle: string; display_name: string } | null;

/** Active row: raised ground plus an oxblood bar. No pill, no dot badge. */
function railRow(active: boolean, primary = false) {
  const base =
    "flex h-11 flex-none cursor-pointer items-center gap-[14px] border-0 border-l-2 pl-[18px] pr-4 text-left";
  if (primary) {
    return `${base} border-l-[color:var(--accent)] bg-[color:var(--accent)] text-[#FAF8F3] hover:border-l-[color:var(--accent-h)] hover:bg-[color:var(--accent-h)]`;
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
  children,
}: {
  collapsed: boolean;
  viewer: Viewer;
  progress: Progress[];
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen items-start">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 border-0 bg-[color:var(--ink)]/20 md:hidden"
        />
      )}

      {/* Below 1024 the rail is a drawer at 200px, opened from the menu button. */}
      <div className="absolute inset-y-0 left-0 z-40 md:hidden">
        <nav
          aria-label="Sections"
          className="min-h-full overflow-hidden bg-[color:var(--paper)] pt-[10px] pb-4 transition-[width] duration-150"
          style={{
            width: drawerOpen ? RAIL_WIDTH : 0,
            borderRight: drawerOpen ? "1px solid var(--rule)" : "0",
          }}
        >
          <RailContents
            collapsed={false}
            viewer={viewer}
            progress={progress}
            showCollapse={false}
            onNavigate={() => setDrawerOpen(false)}
          />
        </nav>
      </div>

      {/* 1024 and up: a permanent rail whose labels are always set. */}
      <div
        className="sticky top-0 z-30 hidden self-start transition-[flex-basis] duration-150 md:block"
        style={{ flex: `0 0 ${collapsed ? RAIL_COLLAPSED : RAIL_WIDTH}px` }}
      >
        <nav
          aria-label="Sections"
          className="overflow-hidden border-r border-[color:var(--rule)] bg-[color:var(--paper)] pt-[10px] pb-4 transition-[width] duration-150"
          style={{ width: collapsed ? RAIL_COLLAPSED : RAIL_WIDTH }}
        >
          <RailContents collapsed={collapsed} viewer={viewer} progress={progress} showCollapse />
        </nav>
      </div>

      <div className="min-w-0 flex-1">
        <TopBar viewer={viewer} onMenu={() => setDrawerOpen((v) => !v)} drawerOpen={drawerOpen} />
        {children}
      </div>
    </div>
  );
}

function TopBar({
  viewer,
  onMenu,
  drawerOpen,
}: {
  viewer: Viewer;
  onMenu: () => void;
  drawerOpen: boolean;
}) {
  const pathname = usePathname();
  const onLenses = pathname.startsWith("/lenses");

  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-[color:var(--rule)] bg-[color:var(--paper)] px-4 py-2 md:px-12">
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={drawerOpen}
        onClick={onMenu}
        className="flex h-11 w-11 flex-none items-center justify-center border-0 bg-transparent text-[color:var(--ink2)] hover:text-[color:var(--ink)] md:hidden"
      >
        <Icon.menu />
      </button>

      <Link
        href="/lenses"
        className={`meta relative mr-2 inline-flex items-center border-0 border-b py-[2px] ${
          onLenses
            ? "border-b-[color:var(--accent)] text-[color:var(--accent)]"
            : "border-b-[color:var(--rule)] text-[color:var(--ink2)] hover:text-[color:var(--ink)]"
        }`}
      >
        Lenses
      </Link>

      {/* Hairline underline that grows to fill the header on focus. */}
      <form
        action="/search"
        className="ml-auto flex flex-[1_1_auto] items-center transition-[flex-basis,flex-grow] duration-150 md:flex-[0_0_260px] md:focus-within:flex-[1_1_auto]"
      >
        <label className="sr-only" htmlFor="q">
          Search characters, works, essays
        </label>
        <input
          id="q"
          name="q"
          placeholder="Search characters, works, essays"
          className="field field-ui text-[15px] focus:border-b-[color:var(--ink2)]"
        />
      </form>

      {viewer ? (
        <Link
          href={`/u/${viewer.handle}`}
          className="meta plain hidden px-3 hover:text-[color:var(--ink)] md:block"
        >
          {viewer.display_name}
        </Link>
      ) : (
        <div className="flex items-center gap-2">
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

function RailContents({
  collapsed,
  viewer,
  progress,
  showCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  viewer: Viewer;
  progress: Progress[];
  showCollapse: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [positionsOpen, setPositionsOpen] = useState(false);

  const on = (...prefixes: string[]) =>
    prefixes.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));

  const fade = collapsed ? "opacity-0" : "opacity-100";
  const Label = ({ children }: { children: string }) => (
    <span className={`whitespace-nowrap text-sm leading-none font-medium transition-opacity duration-100 ${fade}`}>
      {children}
    </span>
  );

  const groupClass = `whitespace-nowrap pt-5 pb-2 pl-5 text-[11px] leading-[1.4] font-medium tracking-[0.1em] text-[color:var(--muted)] uppercase transition-opacity duration-100 ${fade}`;

  const Divider = () => (
    <div className="mt-3 ml-[18px] h-px bg-[color:var(--rule)]" style={{ width: RAIL_WIDTH - 36 }} />
  );

  const row = (href: string, icon: ReactNode, text: string, active: boolean) => (
    <Link href={href} onClick={onNavigate} className={`plain ${railRow(active)}`} style={{ width: RAIL_WIDTH }}>
      {icon}
      <Label>{text}</Label>
    </Link>
  );

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className="plain mb-3 flex h-11 flex-none items-center gap-[14px] pl-[18px] pr-4"
        style={{ width: RAIL_WIDTH }}
      >
        <Icon.mark />
        <span
          className={`font-serif text-xl leading-none tracking-[-0.01em] whitespace-nowrap text-[color:var(--ink)] transition-opacity duration-100 ${fade}`}
        >
          Lensa
        </span>
      </Link>

      {/* Reading needs no account; writing does, so the rail says less when signed out. */}
      {viewer && (
        <Link
          href="/write"
          onClick={onNavigate}
          className={`plain ${railRow(false, true)}`}
          style={{ width: RAIL_WIDTH }}
        >
          <Icon.write />
          <Label>Write an essay</Label>
        </Link>
      )}

      <div className={groupClass}>Browse</div>
      {row("/", <Icon.feed />, "Feed", on("/"))}
      {row("/characters", <Icon.characters />, "Characters", on("/characters", "/c/"))}
      {row("/works", <Icon.works />, "Works", on("/works", "/w/"))}

      {viewer && (
        <>
          <Divider />
          <div className={groupClass}>Mine</div>
          {row("/me", <Icon.mywork />, "My work", on("/me"))}

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
                viewer={viewer}
                progress={progress}
                onDone={() => setPositionsOpen(false)}
              />
            )}
          </div>
        </>
      )}

      <Divider />
      {row("/rules", <Icon.rules />, "Writing rules", on("/rules"))}
      {row("/settings", <Icon.settings />, "Settings", on("/settings"))}

      {showCollapse && (
        <>
          <Divider />
          {/* A button at the foot of the rail. The choice persists between sessions. */}
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
        </>
      )}
    </>
  );
}

function PositionPanel({
  collapsed,
  viewer,
  progress,
  onDone,
}: {
  collapsed: boolean;
  viewer: Viewer;
  progress: Progress[];
  onDone: () => void;
}) {
  return (
    <div
      className="absolute top-2 z-50 w-[320px] border border-[color:var(--rule)] bg-[color:var(--paper)] p-5 md:w-[340px]"
      style={{ left: collapsed ? RAIL_COLLAPSED + 8 : RAIL_WIDTH + 8 }}
    >
      <div className="meta rule-b pb-4">Reading position</div>

      {viewer ? (
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
          <div className="rule-t flex gap-2 pt-4">
            <button type="submit" className="btn btn-caps">
              Save position
            </button>
            <button type="button" onClick={onDone} className="text-btn text-btn-bare ml-3">
              Done
            </button>
          </div>
        </form>
      ) : (
        <p className="note-lg mt-4 mb-0">
          Reading position is kept per account. <Link href="/signin">Sign in</Link> to set one.
        </p>
      )}
    </div>
  );
}
