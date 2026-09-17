"use client";

import { ReactNode } from "react";

const THEME_ACCENTS: Record<string, { primary: string; hover: string; soft: string }> = {
  default: {
    primary: "#0a0a0a",
    hover: "#1a1a1a",
    soft: "#f5f5f5",
  },
  warm: {
    primary: "#d97706",
    hover: "#b45309",
    soft: "#fef3c7",
  },
  cool: {
    primary: "#2563eb",
    hover: "#1d4ed8",
    soft: "#dbeafe",
  },
};

export default function ThemeWrapper({
  theme,
  children,
}: {
  theme: string;
  children: ReactNode;
}) {
  const accent = THEME_ACCENTS[theme] || THEME_ACCENTS.default;

  const css = `
    :root {
      --accent-primary: ${accent.primary};
      --accent-hover: ${accent.hover};
      --accent-soft: ${accent.soft};
    }
    .theme-accent-bg {
      background-color: var(--accent-primary) !important;
    }
    .theme-accent-bg:hover {
      background-color: var(--accent-hover) !important;
    }
    .theme-accent-text {
      color: var(--accent-primary) !important;
    }
    .theme-accent-border {
      border-color: var(--accent-primary) !important;
    }
    .theme-accent-bar {
      background-color: var(--accent-primary) !important;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}