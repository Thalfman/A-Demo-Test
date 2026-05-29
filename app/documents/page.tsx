import { getDocuments } from '@/lib/loaders';
import { DocumentsClient } from './DocumentsClient';

export default function DocumentsPage() {
  const { statusReports, sops } = getDocuments();

  return <DocumentsClient statusReports={statusReports} sops={sops} />;
}
