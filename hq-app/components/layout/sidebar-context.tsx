"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SidebarContextValue = {
  collapsed: boolean;
  effectiveCollapsed: boolean;
  isMobile: boolean;
  hydrated: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "paintballhq:sidebar-collapsed";
const MOBILE_BREAKPOINT = 1024;

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const updateMobile = () => {
      setIsMobile(media.matches);
    };

    updateMobile();

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsedState(true);
    if (stored === "false") setCollapsedState(false);

    setHydrated(true);

    media.addEventListener("change", updateMobile);
    return () => media.removeEventListener("change", updateMobile);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const toggle = useCallback(() => {
    if (isMobile) return;

    setCollapsedState((prev: boolean) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, [isMobile]);

  const effectiveCollapsed = isMobile ? true : collapsed;

  const value = useMemo(
    () => ({
      collapsed,
      effectiveCollapsed,
      isMobile,
      hydrated,
      toggle,
      setCollapsed,
    }),
    [collapsed, effectiveCollapsed, isMobile, hydrated, toggle, setCollapsed]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}