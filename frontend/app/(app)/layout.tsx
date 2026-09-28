import { Nav } from "@/components/nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Nav />
      <main className="mx-auto max-w-7xl animate-in fade-in duration-300 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
