import ResourceListing from "./_components/ressources-list";

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Resources</h1>
      <ResourceListing pageSize={6} />
    </div>
  );
}
