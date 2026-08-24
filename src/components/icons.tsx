const stroke = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "flex-none",
  "aria-hidden": true,
};

export const Icon = {
  mark: () => (
    <svg {...stroke}>
      <rect x="2.5" y="2.5" width="15" height="15" rx="1" />
      <path d="M6 7h8M6 10h8M6 13h5" />
    </svg>
  ),
  write: () => (
    <svg {...stroke}>
      <path d="M13.5 3.5l3 3-9 9H4.5v-3z" />
    </svg>
  ),
  feed: () => (
    <svg {...stroke}>
      <path d="M3 5h14M3 10h14M3 15h9" />
    </svg>
  ),
  characters: () => (
    <svg {...stroke}>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  ),
  works: () => (
    <svg {...stroke}>
      <path d="M4 3.5h5.5v13H4z" />
      <path d="M10.5 3.5H16v13h-5.5z" />
    </svg>
  ),
  mywork: () => (
    <svg {...stroke}>
      <path d="M3 6.5h6l1.5 2H17V16H3z" />
      <path d="M3 6.5V4.5h5" />
    </svg>
  ),
  position: () => (
    <svg {...stroke}>
      <path d="M6 3h8v14l-4-3.5L6 17z" />
    </svg>
  ),
  rules: () => (
    <svg {...stroke}>
      <path d="M5 3h10v14H5z" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" />
    </svg>
  ),
  settings: () => (
    <svg {...stroke}>
      <path d="M3 6h14M3 14h14" />
      <circle cx="7.5" cy="6" r="2" />
      <circle cx="13" cy="14" r="2" />
    </svg>
  ),
  menu: () => (
    <svg {...stroke}>
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  ),
  collapse: ({ flipped }: { flipped: boolean }) => (
    <svg {...stroke} style={flipped ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M12 5l-5 5 5 5" />
      <path d="M3.5 3.5v13" />
    </svg>
  ),
  check: () => (
    <svg
      viewBox="0 0 16 16"
      width={11}
      height={11}
      fill="none"
      stroke="var(--paper)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8.4l3.2 3.2L13 4.8" />
    </svg>
  ),
};
