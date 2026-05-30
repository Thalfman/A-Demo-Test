import type { AiArtifact } from '@/lib/types';
import { AIBadge } from './AIBadge';

/** The "analyst layer" band. Renders an AiArtifact (title, prose, optional
 *  bullets) with the signature accent left rail that draws itself in on mount, an
 *  --ai-tint fill, the dotted authorship rule under the header, and an AIBadge —
 *  so AI content is spatially recognizable before a word is read, and labeled. */
export function AICallout({ artifact }: { artifact: AiArtifact }) {
  return (
    <section
      aria-label="AI-generated analysis"
      className="relative overflow-hidden rounded-md border border-hairline bg-ai-tint px-5 py-4"
    >
      <span
        aria-hidden
        className="motion-rail absolute inset-y-0 left-0 w-[3px] bg-ai"
        style={{ boxShadow: '0 0 8px var(--ai-glow)' }}
      />
      <div className="ai-rule flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
          {artifact.title}
        </h2>
        <AIBadge generatedAt={artifact.generatedAt} />
      </div>
      <p className="mt-3 max-w-prose text-[13px] leading-relaxed text-ink">
        {artifact.body}
      </p>
      {artifact.bullets && artifact.bullets.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {artifact.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-ink">
              <span aria-hidden className="text-ai">
                ▸
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
