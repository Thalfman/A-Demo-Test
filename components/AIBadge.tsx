import { formatDate } from '@/lib/format';
import { tint } from './tint';

/** Unmistakable "this is AI-generated" label, keyed to the single --ai accent.
 *  Every AI artifact in the app surfaces through this badge (directly or via
 *  AICallout). Mono "AI · <date>" — the explicit textual marker of the layer. */
export function AIBadge({ generatedAt }: { generatedAt?: string }) {
  return (
    <span
      className="tint-chip inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium"
      style={tint('var(--ai)')}
    >
      <svg aria-hidden viewBox="0 0 16 16" width="11" height="11" fill="currentColor">
        <path d="M8 0l1.6 4.9L14.5 6.5 9.6 8.1 8 13 6.4 8.1 1.5 6.5 6.4 4.9 8 0z" />
      </svg>
      AI
      {generatedAt ? <span className="opacity-80">· {formatDate(generatedAt)}</span> : null}
    </span>
  );
}
