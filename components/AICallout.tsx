import { colors } from '@/lib/tokens';
import type { AiArtifact } from '@/lib/types';
import { AIBadge } from './AIBadge';

const BRAND = colors.brand;

/** Renders an AiArtifact (title, prose body, optional bullets) inside a
 *  brand-tinted callout carrying an AIBadge, so AI content is always labeled. */
export function AICallout({ artifact }: { artifact: AiArtifact }) {
  return (
    <section
      className="rounded-token border p-5"
      style={{ borderColor: `${BRAND}33`, backgroundColor: `${BRAND}0d` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{artifact.title}</h2>
        <AIBadge generatedAt={artifact.generatedAt} />
      </div>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink">
        {artifact.body}
      </p>
      {artifact.bullets && artifact.bullets.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {artifact.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink">
              <span aria-hidden style={{ color: BRAND }}>
                •
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
