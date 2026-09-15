const ADJECTIVES = [
  "bright",
  "calm",
  "clear",
  "cool",
  "fresh",
  "happy",
  "keen",
  "light",
  "lucky",
  "modern",
  "neat",
  "quick",
  "sharp",
  "smart",
  "smooth",
  "steady",
  "swift",
  "tidy",
  "warm",
  "wise",
];

const NOUNS = [
  "acorn",
  "beacon",
  "cedar",
  "clover",
  "compass",
  "coral",
  "crest",
  "ember",
  "fern",
  "harbor",
  "ivy",
  "laurel",
  "maple",
  "mint",
  "oak",
  "onyx",
  "pebble",
  "pine",
  "quartz",
  "river",
  "sage",
  "slate",
  "sparrow",
  "stone",
  "thistle",
  "willow",
];

export function generateSlug(applicationName: string): string {
  // Sanitize the app name into a slug-friendly base
  const base = applicationName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  // Pick a random suffix for uniqueness
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  if (base) {
    return `${base}-${adj}-${noun}`.slice(0, 60);
  }

  return `${adj}-${noun}-${Math.floor(Math.random() * 1000)}`;
}