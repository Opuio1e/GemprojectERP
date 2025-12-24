import type { ReactNode } from 'react';
import TopNav from './TopNav';

const PageLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-panel">
    <TopNav />
    <main className="px-6 py-6">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  </div>
);

export default PageLayout;
