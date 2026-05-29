import { colors } from '@/lib/tokens';
import { formatDate } from '@/lib/format';

const BRAND = colors.brand;

/** Unmistakable "this is AI-generated" label. Every AI artifact in the app is
 *  surfaced through this badge (directly or via AICallout). */
export function AIBadge({ generatedAt }: { generatedAt?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        color: BRAND,
        backgroundColor: `${BRAND}14`,
        border: `1px solid ${BRAND}33`,
      }}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        width="11"
        height="11"
        fill="currentColor"
      >
        <path d="M8 0l1.6 4.9L14.5 6.5 9.6 8.1 8 13 6.4 8.1 1.5 6.5 6.4 4.9 8 0z" />
      </svg>
      AI-generated
      {generatedAt ? (
        <span style={{ color: `${BRAND}cc` }} className="font-normal">
          · {formatDate(generatedAt)}
        </span>
      ) : null}
    </span>
  );
}
