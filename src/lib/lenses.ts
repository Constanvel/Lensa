/**
 * The taxonomy is closed. It grows only when a lens is proposed with essays
 * already written under it — never because a lens sounds like it should exist.
 *
 * The keys are the `lens` enum, which is what actually closes the set. The
 * copy here is the UI's, read synchronously wherever a chip is drawn; the
 * `lenses` table holds the database's own copy for anything reading SQL
 * directly. Adding or renaming a lens changes both, in one migration.
 */
export const LENSES = {
  nietzschean: {
    name: "Nietzschean",
    short: "Value made by an act of will, and what the act costs the one who makes it.",
    long: "Will, self-overcoming, and the ethics that survive the loss of a guarantor.",
  },
  jungian: {
    name: "Jungian",
    short: "Characters read as parts of one psyche: the shadow, the mask, the figure who refuses the call.",
    long: "Archetype, shadow, individuation; the character read as a map of a psyche.",
  },
  psychoanalytic: {
    name: "Psychoanalytic",
    short: "Desire and repression, and what a character cannot say about themselves.",
    long: "Desire, repression, and what a text cannot bring itself to say directly.",
  },
  metafictional: {
    name: "Metafictional",
    short: "The work knows it is a work, and behaves differently because of it.",
    long: "The character's awareness of, or subjection to, the fact of being written.",
  },
  sociopolitical: {
    name: "Sociopolitical",
    short: "Power, labour, and class as the machinery running under the personal story.",
    long: "Class, power, and the material conditions a story treats as weather.",
  },
  narratological: {
    name: "Narratological",
    short: "Who is telling it, in what order, and what the telling holds back.",
    long: "Focalisation and structure: what the telling does that the told does not.",
  },
} as const;

export type Lens = keyof typeof LENSES;

export const LENS_KEYS = Object.keys(LENSES) as Lens[];

export const MAX_LENSES_PER_ESSAY = 2;
export const MAX_LENSES_AT_ONBOARDING = 3;

export function isLens(value: string): value is Lens {
  return value in LENSES;
}

export function lensName(key: string): string {
  return isLens(key) ? LENSES[key].name : key;
}

export function lensNames(keys: readonly string[]): string {
  return keys.map(lensName).join(" · ");
}
