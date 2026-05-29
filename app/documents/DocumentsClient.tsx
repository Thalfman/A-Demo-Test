'use client';

import { useMemo, useState } from 'react';

import { AIBadge } from '@/components/AIBadge';
import { Card } from '@/components/Card';
import { DocumentViewer } from '@/components/DocumentViewer';
import { FilterBar, type FilterDef } from '@/components/FilterBar';
import type { AppDocument, DocumentType } from '@/lib/types';

const GROUPS: { type: DocumentType; label: string }[] = [
  { type: 'status-report', label: 'Status Reports' },
  { type: 'sop', label: 'SOPs' },
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
      className={`w-full rounded-token border p-4 text-left transition-colors ${
        active
          ? 'border-brand bg-surface-raised'
          : 'border-border bg-surface-raised hover:border-brand'
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
              className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted"
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
}: {
  statusReports: AppDocument[];
  sops: AppDocument[];
}) {
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    statusReports[0]?.id ?? sops[0]?.id ?? '',
  );

  const docsByType: Record<DocumentType, AppDocument[]> = {
    'status-report': statusReports,
    sop: sops,
  };

  const visibleGroups = GROUPS.filter(
    (g) => !typeFilter || g.type === typeFilter,
  );
  const visibleDocs = useMemo(
    () => visibleGroups.flatMap((g) => docsByType[g.type]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typeFilter, statusReports, sops],
  );

  const selected =
    visibleDocs.find((d) => d.id === selectedId) ?? visibleDocs[0] ?? null;

  const filterDefs: FilterDef[] = [
    {
      key: 'type',
      label: 'Document type',
      allLabel: 'All types',
      options: GROUPS.map((g) => ({ value: g.type, label: g.label })),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <FilterBar
          filters={filterDefs}
          values={{ type: typeFilter }}
          onChange={(_, value) => setTypeFilter(value)}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="space-y-5">
          {visibleGroups.map((group) => {
            const docs = docsByType[group.type];
            return (
              <section key={group.type} className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {group.label} ({docs.length})
                </h2>
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

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            {selected ? (
              <DocumentViewer doc={selected} />
            ) : (
              <p className="text-sm text-ink-muted">No documents to show.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
