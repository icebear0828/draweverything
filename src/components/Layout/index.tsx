/**
 * Layout Component
 * 主布局容器
 */

import type { FC, ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative h-screen w-full bg-[#050505] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-hidden">
      {children}
    </div>
  );
};

export default Layout;

// Re-export sub-components
export { default as TopBar } from './TopBar';
export { default as BottomBar } from './BottomBar';
export { default as Overlays } from './Overlays';
