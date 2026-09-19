"use client";

import {
  isSafeUrl,
  prettyUrl,
  richText,
} from "@/lib/fields/render";

interface FieldValueProps {
  value: any;
  type: string;
  /** Optional className to apply — used by conditional formatting styles */
  className?: string;
  /** Compact mode for cards — truncates long text and shows smaller image thumbnails */
  compact?: boolean;
}

/**
 * Renders a field value based on its type.
 * - text / longtext: plain text; URLs and emails inside become clickable
 * - email: clickable mailto link
 * - url: clickable link with pretty display
 * - image: small thumbnail that opens the full image in a new tab
 * - currency / integer / decimal: formatted numbers
 * - date / datetime: formatted date
 * - boolean: Yes / No
 */
export default function FieldValue({
  value,
  type,
  className = "",
  compact = false,
}: FieldValueProps) {
  if (value === null || value === undefined || value === "") {
    return <span className={className}>—</span>;
  }

  const str = String(value);

  // --- Long text with embedded links ---
  if (type === "longtext") {
    const html = richText(str);
    return (
      <span
        className={`${className} whitespace-pre-wrap break-words ${
          compact ? "line-clamp-3" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // --- Short text: linkify URLs and emails but keep it as one line ---
  if (type === "text" || type === "select") {
    const html = richText(str);
    return (
      <span
        className={`${className} break-words`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // --- Email ---
  if (type === "email") {
    const safe = str.trim();
    return (
      <a
        href={`mailto:${safe}`}
        className={`${className} text-blue-600 underline hover:text-blue-800 break-all`}
      >
        {safe}
      </a>
    );
  }

  // --- URL ---
  if (type === "url") {
    const safe = str.trim();
    if (!isSafeUrl(safe)) {
      return <span className={className}>{safe}</span>;
    }
    return (
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} text-blue-600 underline hover:text-blue-800 break-all`}
      >
        {prettyUrl(safe)}
        <span className="text-[10px] ml-0.5">↗</span>
      </a>
    );
  }

  // --- Image URL ---
  if (type === "image") {
    const safe = str.trim();
    if (!isSafeUrl(safe)) {
      return <span className={className}>{safe}</span>;
    }
    return (
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <img
          src={safe}
          alt=""
          loading="lazy"
          className={`rounded border border-gray-200 object-cover bg-gray-50 ${
            compact ? "h-12 w-12" : "h-24 w-24"
          }`}
          onError={(e) => {
            // Fallback: if image fails to load, show the URL as text
            const target = e.currentTarget;
            target.replaceWith(
              Object.assign(document.createElement("span"), {
                textContent: prettyUrl(safe),
                className: `${className} text-xs text-gray-500`,
              })
            );
          }}
        />
      </a>
    );
  }

  // --- Numbers ---
  if (type === "currency") {
    const n = Number(str);
    return (
      <span className={className}>
        {isNaN(n) ? str : `$${n.toFixed(2)}`}
      </span>
    );
  }

  if (type === "integer" || type === "decimal") {
    return <span className={className}>{str}</span>;
  }

  // --- Dates ---
  if (type === "date" || type === "datetime") {
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return <span className={className}>{str}</span>;
      return (
        <span className={className}>
          {type === "datetime"
            ? d.toLocaleString()
            : d.toLocaleDateString()}
        </span>
      );
    } catch {
      return <span className={className}>{str}</span>;
    }
  }

  // --- Boolean ---
  if (type === "boolean") {
    const v = str.toLowerCase();
    if (v === "true" || v === "yes" || v === "1") {
      return <span className={className}>Yes</span>;
    }
    if (v === "false" || v === "no" || v === "0") {
      return <span className={className}>No</span>;
    }
    return <span className={className}>{str}</span>;
  }

  // --- Fallback ---
  return <span className={className}>{str}</span>;
}