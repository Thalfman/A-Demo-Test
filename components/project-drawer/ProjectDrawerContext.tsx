'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ProjectDrawer } from './ProjectDrawer';

interface ProjectDrawerContextValue {
  /** Id of the Project whose drawer is open, or `null` when closed. */
  openProjectId: string | null;
  /** Open the drawer on a Project. */
  open: (projectId: string) => void;
  /** Close the drawer. */
  close: () => void;
}

const ProjectDrawerContext = createContext<ProjectDrawerContextValue | null>(null);

/**
 * Owns the single cross-module Project drawer. Mounted once in the app shell so
 * any descendant — a Portfolio row, an EVM action, a Discrepancy — can open the
 * same overlay through `useProjectDrawer()`.
 */
export function ProjectDrawerProvider({ children }: { children: ReactNode }) {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  const open = useCallback((projectId: string) => setOpenProjectId(projectId), []);
  const close = useCallback(() => setOpenProjectId(null), []);

  const value = useMemo(
    () => ({ openProjectId, open, close }),
    [openProjectId, open, close],
  );

  return (
    <ProjectDrawerContext.Provider value={value}>
      {children}
      <ProjectDrawer projectId={openProjectId} onClose={close} />
    </ProjectDrawerContext.Provider>
  );
}

export function useProjectDrawer(): ProjectDrawerContextValue {
  const ctx = useContext(ProjectDrawerContext);
  if (!ctx)
    throw new Error('useProjectDrawer must be used within ProjectDrawerProvider');
  return ctx;
}
