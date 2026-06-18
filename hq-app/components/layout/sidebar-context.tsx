// components/layout/sidebar-context.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = { collapsed: boolean; toggle: () => void; isMobile: boolean };

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  isMobile: false,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    }

    check(); // run on mount
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function toggle() {
    if (isMobile) return; // ← locked on mobile, do nothing
    setCollapsed((c) => !c);
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);