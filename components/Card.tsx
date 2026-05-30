import type { ReactNode } from 'react';

/** Titled container. Universal (no client state) so server pages and client
 *  children can both render it. Pass `bodyClassName="p-0"` for flush tables;
 *  `variant="ai"` swaps the header rule for the dotted AI-authorship rule. */
export function Card({
  title,
  action,
  children,
  className = '',
  bodyClassName = 'p-4',
  variant = 'data',
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: 'data' | 'ai';
}) {
  const hasHeader = title != null || action != null;
  return (
    <section
      className={`rounded-md border border-hairline bg-panel shadow-elev ${className}`}
    >
      {hasHeader ? (
        <div
          className={`flex items-center justify-between gap-4 px-4 py-3 ${
            variant === 'ai' ? 'ai-rule' : 'border-b border-hairline'
          }`}
        >
          {title != null ? (
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
