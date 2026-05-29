import type { ReactNode } from 'react';

/** Titled container. Universal (no client state) so server pages and client
 *  children can both render it. Pass `bodyClassName="p-0"` for flush tables. */
export function Card({
  title,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = title != null || action != null;
  return (
    <section
      className={`rounded-token border border-border bg-surface-raised ${className}`}
    >
      {hasHeader ? (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          {title != null ? (
            <h3 className="text-sm font-semibold">{title}</h3>
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
