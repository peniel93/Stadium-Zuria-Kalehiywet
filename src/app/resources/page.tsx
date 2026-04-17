import { LiveDocumentList } from "@/components/live-document-list";
import { PublicPageShell } from "@/components/public-page-shell";

export default function ResourcesPage() {
  return (
    <PublicPageShell
      title="Church Resources"
      description="Live documents and downloadable resources published by church admins."
      activeNavKey="resources"
    >
      <LiveDocumentList />
    </PublicPageShell>
  );
}
