import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children: ReactNode;
}

interface CardSubtitleProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children: ReactNode;
}

const base =
  "bg-white rounded-lg border border-gray-100 shadow-[var(--shadow-sm)]";

const padding = "p-6";

const interactiveClass =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] cursor-pointer motion-reduce:transition-none motion-reduce:transform-none";

// Skip the default padding when the caller passes their own p-*, px-*, py-*, etc.
const hasPadding = (className: string) => /(^|\s)p[xytrblse]?-/.test(className);

const CardRoot = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, className = "", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`${base} ${hasPadding(className) ? "" : padding} ${interactive ? interactiveClass : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className = "", children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between mb-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ className = "", children, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={`text-base font-semibold text-gray-900 ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

const CardSubtitle = forwardRef<HTMLParagraphElement, CardSubtitleProps>(
  function CardSubtitle({ className = "", children, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={`text-xs text-gray-500 mt-0.5 ${className}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Subtitle: CardSubtitle,
});

export default Card;