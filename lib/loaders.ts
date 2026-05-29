/**
 * Typed loaders for the committed synthetic data. Each function returns the
 * static JSON typed against the shared data model in lib/types.ts. Module pages
 * should import data only through these — never reach into /data directly.
 */

import documentsJson from '@/data/documents.json';
import evmJson from '@/data/evm.json';
import metaJson from '@/data/meta.json';
import portfolioJson from '@/data/portfolio.json';
import reconciliationJson from '@/data/reconciliation.json';
import type {
  DocumentsData,
  EvmData,
  Meta,
  PortfolioData,
  ReconciliationData,
} from './types';

export const getPortfolio = (): PortfolioData =>
  portfolioJson as unknown as PortfolioData;

export const getEvm = (): EvmData => evmJson as unknown as EvmData;

export const getReconciliation = (): ReconciliationData =>
  reconciliationJson as unknown as ReconciliationData;

export const getDocuments = (): DocumentsData =>
  documentsJson as unknown as DocumentsData;

export const getMeta = (): Meta => metaJson as unknown as Meta;
