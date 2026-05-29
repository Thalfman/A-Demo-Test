import type { ReactNode } from 'react';

import { formatDate } from '@/lib/format';
import type { AppDocument } from '@/lib/types';
import { AIBadge } from './AIBadge';

/** Render inline `**bold**` and `` `code` `` spans within a line of text. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold">
          {match[1]}
        </strong>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <code
          key={`${keyBase}-c${i}`}
          className="rounded bg-surface px-1 py-0.5 text-[0.85em]"
        >
          {match[2]}
        </code>,
      );
    }
    last = match.index + match[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const isHeading = (l: string) => /^#{1,6}\s+/.test(l);
const isUl = (l: string) => /^\s*[-*]\s+/.test(l);
const isOl = (l: string) => /^\s*\d+\.\s+/.test(l);

/** Minimal markdown renderer: ## headings, - / 1. lists, paragraphs, and inline
 *  bold/code. Sufficient for the precomputed status reports and SOPs; no heavy
 *  dependency required. */
function renderMarkdown(body: string): ReactNode[] {
  const lines = body.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const cls =
        level <= 2
          ? 'mt-5 first:mt-0 text-xs font-semibold uppercase tracking-wide text-ink-muted'
          : 'mt-4 text-base font-semibold';
      blocks.push(
        <p key={key} className={cls}>
          {renderInline(heading[2], `h${key}`)}
        </p>,
      );
      key += 1;
      i += 1;
      continue;
    }

    if (isUl(line)) {
      const items: string[] = [];
      while (i < lines.length && isUl(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={key} className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      key += 1;
      continue;
    }

    if (isOl(line)) {
      const items: string[] = [];
      while (i < lines.length && isOl(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={key} className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      key += 1;
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isHeading(lines[i]) &&
      !isUl(lines[i]) &&
      !isOl(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={key} className="mt-2 text-sm leading-relaxed">
        {renderInline(para.join(' '), `p${key}`)}
      </p>,
    );
    key += 1;
  }

  return blocks;
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="inline font-medium text-ink">{label}: </dt>
      <dd className="inline">{value}</dd>
    </div>
  );
}

/** Render an AppDocument: header (title, summary, AIBadge), metadata, markdown
 *  body, and tags. */
export function DocumentViewer({ doc }: { doc: AppDocument }) {
  const { meta } = doc;
  return (
    <article>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-semibold">{doc.title}</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">{doc.summary}</p>
        </div>
        <AIBadge generatedAt={doc.generatedAt} />
      </header>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
        <MetaItem label="Author" value={meta.author} />
        {meta.audience ? <MetaItem label="Audience" value={meta.audience} /> : null}
        {meta.version ? <MetaItem label="Version" value={meta.version} /> : null}
        {meta.effectiveDate ? (
          <MetaItem label="Effective" value={formatDate(meta.effectiveDate)} />
        ) : null}
        {meta.relatedProjectId ? (
          <MetaItem label="Project" value={meta.relatedProjectId} />
        ) : null}
      </dl>

      <div className="mt-4">{renderMarkdown(doc.body)}</div>

      {doc.tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
