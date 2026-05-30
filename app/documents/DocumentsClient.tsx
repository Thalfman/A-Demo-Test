'use client';

import { useMemo, useState } from 'react';

import { AIBadge } from '@/components/AIBadge';
import { Card } from '@/components/Card';
import { DocumentViewer } from '@/components/DocumentViewer';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { AppDocument, DocumentType } from '@/lib/types';

const GROUPS: { type: DocumentType; label: string; short: string }[] = [
  { type: 'status-report', label: 'Status Reports', short: 'Reports' },
  { type: 'sop', label: 'SOPs', short: 'SOPs' },
  { type: 'meeting-notes', label: 'Meeting Notes', short: 'Meetings' },
  { type: 'decision-log', label: 'Decision Logs', short: 'Decisions' },
];

function DocumentCard({
  doc,
  active,
  onSelect,
}: {
  doc: AppDocument;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`w-full rounded-md border bg-panel p-4 text-left shadow-elev transition-colors duration-state ease-instrument focus:outline-none focus-visible:ring-2 focus-visible:ring-ai ${
        active ? 'border-ai' : 'border-hairline hover:border-ink-faint'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{doc.title}</h3>
        <AIBadge />
      </div>
      <p className="mt-1 text-sm text-ink-muted">{doc.summary}</p>
      {doc.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm bg-panel-2 px-2 py-0.5 font-mono text-xs text-ink-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

export function DocumentsClient({
  statusReports,
  sops,
  meetingNotes,
  decisionLogs,
}: {
  statusReports: AppDocument[];
  sops: AppDocument[];
  meetingNotes: AppDocument[];
  decisionLogs: AppDocument[];
}) {
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    statusReports[0]?.id ?? sops[0]?.id ?? '',
  );

  const docsByType: Record<DocumentType, AppDocument[]> = {
    'status-report': statusReports,
    sop: sops,
    'meeting-notes': meetingNotes,
    'decision-log': decisionLogs,
  };

  const visibleGroups = GROUPS.filter(
    (g) => !typeFilter || g.type === typeFilter,
  );
  const visibleDocs = useMemo(
    () => visibleGroups.flatMap((g) => docsByType[g.type]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typeFilter, statusReports, sops, meetingNotes, decisionLogs],
  );

  const selected =
    visibleDocs.find((d) => d.id === selectedId) ?? visibleDocs[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
            Library
          </h2>
          <SegmentedControl
            ariaLabel="Filter by document type"
            value={typeFilter}
            onChange={setTypeFilter}
            allOption={{ value: '', label: 'All' }}
            options={GROUPS.map((g) => ({ value: g.type, label: g.short }))}
          />
        </div>

        {visibleGroups.map((group) => {
          const docs = docsByType[group.type];
          return (
            <section key={group.type} className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                {group.label} ({docs.length})
              </h3>
              {docs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  active={selected?.id === doc.id}
                  onSelect={() => setSelectedId(doc.id)}
                />
              ))}
            </section>
          );
        })}
      </div>

      <div className="lg:sticky lg:top-16 lg:self-start">
        <Card>
          {selected ? (
            <DocumentViewer doc={selected} />
          ) : (
            <p className="text-sm text-ink-muted">No documents to show.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
