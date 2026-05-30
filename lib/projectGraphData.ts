/**
 * Loader-backed accessors for the Project Spine.
 *
 * Thin wrappers that wire the frozen loaders into the pure `projectGraph`
 * selector. Kept separate from `projectGraph.ts` so that module stays pure
 * (types only) and directly testable, mirroring how the other modules wire data
 * at the edge rather than inside the selector.
 *
 * The Portfolio is run through the existing normalization (per ADR-0001) so the
 * drawer shows canonical values and surfaces Data-Quality Flags. Sources are
 * built once and cached — the bundled data never changes at runtime.
 */

import { getDocuments, getEvm, getPortfolio, getReconciliation } from './loaders';
import { normalizePortfolio } from './normalize';
import {
  listProjectIds,
  selectProjectDossier,
  type ProjectDossier,
  type ProjectGraphSources,
} from './projectGraph';

let cachedSources: ProjectGraphSources | null = null;

function loadProjectGraphSources(): ProjectGraphSources {
  if (cachedSources) return cachedSources;

  const { projects } = normalizePortfolio(getPortfolio().projects);
  const evm = getEvm();
  const documents = getDocuments();

  cachedSources = {
    projects,
    evmProjects: evm.projects,
    discrepancies: getReconciliation().discrepancies,
    actions: evm.recommendedActions,
    documents: [
      ...documents.statusReports,
      ...documents.sops,
      ...documents.meetingNotes,
      ...documents.decisionLogs,
    ],
  };
  return cachedSources;
}

/** The dossier for one Project id over the bundled data, or `null` if unknown. */
export const getProjectDossier = (projectId: string): ProjectDossier | null =>
  selectProjectDossier(projectId, loadProjectGraphSources());

/** Project ids the drawer can open, over the bundled data. */
export const getProjectIds = (): string[] =>
  listProjectIds(loadProjectGraphSources());
