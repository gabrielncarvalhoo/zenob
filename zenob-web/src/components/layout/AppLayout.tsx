import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar />
      {/* Conteúdo principal — deslocado pela sidebar (240px) e topbar (56px) */}
      <main className="md:ml-60 pt-14">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
