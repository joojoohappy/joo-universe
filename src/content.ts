/**
 * Site content and configuration.
 *
 * Everything you are likely to edit lives here. Values left as `undefined`
 * are treated as "not configured yet" and are simply not rendered — the site
 * never falls back to a generic destination such as https://github.com.
 */

export type ContactLink = {
  label: string;
  /** Full URL (https://…) or `mailto:` address. Leave undefined to hide. */
  href: string | undefined;
};

export const contact: ContactLink[] = [
  { label: "GITHUB", href: "https://github.com/joojoohappy" },
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/chinhsuann" },
  { label: "EMAIL", href: "mailto:chin.h.liao@gmail.com" },
];

export type Project = {
  id: string;
  /** Name exactly as it should appear on the orbit. */
  name: string;
  /** The question this project asks. Optional — without it, the name is shown in the centre. */
  question?: string;
  /** Optional outbound link (case study, repo, article…). Not rendered when undefined. */
  href?: string;
};

/**
 * Projects on the QUESTIONS orbit, in clockwise order starting from the
 * selected (top) position. The first project is selected on load.
 * Names come from the Figma export; questions and links were supplied by JOO.
 */
export const projects: Project[] = [
  {
    id: "memory",
    name: "MEmory",
    question: "How can AI become a new medium between human memory and cultural experience?",
  },
  {
    id: "world-sky",
    name: "WORLD SKY",
    question: "What is the last time you observe your surroundings?",
    href: "https://github.com/joojoohappy/look-up",
  },
  { id: "writing", name: "WRITING", question: "What becomes clearer when I put it into words?" },
  { id: "ai-safety", name: "AI SAFETY", question: "What does it take to make AI worthy of our trust?" },
  {
    id: "mosaic",
    name: "MOSAIC",
    question: "What if... existing the place that get close with technology, human and art?",
    href: "https://github.com/joojoohappy/mosAIc",
  },
];

export const now = {
  place: "Taipei",
  lines: ["Customer Engineer", "Building MEmory", "Researching AI Safety", "Writing", "Learning"],
  aside: "Probably somewhere between projects.",
};

export const hero = {
  location: "TAIPEI / 2026",
  tagline: ["I pay attention to things.", "Sometimes they become questions."],
};

export const footer = "JOO JOO — 2026";
