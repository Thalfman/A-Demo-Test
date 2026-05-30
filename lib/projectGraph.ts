/**
 * The Project Spine derived read-model.
 *
 * One pure selector that joins the five frozen data sources by `projectId` into a
 * single Project dossier — the cross-module story the slide-over drawer renders.
 * Pure read-model over the frozen data (ADR-0001): it reads only links that
 * already exist in the committed data and never enriches or mutates them.
 *
 * Lifted out of the React render so the join logic has a direct test surface.
 */

import type {
  AppDocument,
  Discrepancy,
  EvmProjectEntry,
  Project,
  RecommendedAction,
} from './types';

/** The five frozen sources the Spine joins, already normalized for display. */
export interface ProjectGraphSources {
  projects: Project[];
  evmProjects: EvmProjectEntry[];
  discrepancies: Discrepancy[];
  actions: RecommendedAction[];
  documents: AppDocument[];
}

/** Everything one Project carries across the four modules. Data-quality flags
 *  are read from `project.flags` — they are a Project field, not a join. */
export interface ProjectDossier {
  project: Project;
  evm: EvmProjectEntry | null;
  discrepancies: Discrepancy[];
  actions: RecommendedAction[];
  documents: AppDocument[];
}

/**
 * Compose the dossier for one Project id, or `null` when no Project carries it.
 */
export function selectProjectDossier(
  projectId: string,
  sources: ProjectGraphSources,
): ProjectDossier | null {
  const project = sources.projects.find((p) => p.id === projectId);
  if (!project) return null;

  return {
    project,
    evm: sources.evmProjects.find((e) => e.projectId === projectId) ?? null,
    discrepancies: sources.discrepancies.filter((d) => d.projectId === projectId),
    actions: sources.actions.filter((a) => a.projectId === projectId),
    documents: sources.documents.filter(
      (doc) => doc.meta.relatedProjectId === projectId,
    ),
  };
}

/** Enumerate the Project ids the Spine can open, in portfolio order. */
export function listProjectIds(sources: ProjectGraphSources): string[] {
  return sources.projects.map((p) => p.id);
}
