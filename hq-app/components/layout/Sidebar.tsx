"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSidebar } from "./sidebar-context";

type Props = {
  isAdmin: boolean;
  userEmail?: string | null;
};

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconDivision() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <line x1="17.5" y1="14" x2="17.5" y2="21" />
      <line x1="14" y1="17.5" x2="21" y2="17.5" />
    </svg>
  );
}

function IconTournament() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <path d="M6 3h12v10a6 6 0 0 1-12 0V3z" />
      <path d="M12 19v3" /><path d="M8 22h8" />
    </svg>
  );
}

function IconTeams() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconLeague() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconManageTournaments() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconManageTeams() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconLogin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal-600 dark:text-teal-400">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" /><line x1="12" y1="2" x2="12" y2="6" />
    </svg>
  );
}

function IconChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-200"
      style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/leagues", label: "Leagues", Icon: IconLeague },
  { href: "/tournaments", label: "Tournaments", Icon: IconTournament },
  { href: "/teams", label: "Teams", Icon: IconTeams },
];

const adminLinks = [
  { href: "/manage/leagues", label: "Manage Leagues", Icon: IconLeague },
  { href: "/manage/tournaments", label: "Manage Tournaments", Icon: IconManageTournaments },
  { href: "/manage/teams", label: "Manage Teams", Icon: IconManageTeams },
  { href: "/manage/divisions", label: "Manage Divisions", Icon: IconDivision },
];

export function Sidebar({ isAdmin, userEmail }: Props) {
  const pathname = usePathname();
  const { effectiveCollapsed, toggle, isMobile, hydrated } = useSidebar();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const linkClass = (href: string) =>
    `flex items-center rounded-md text-sm transition-colors
     ${effectiveCollapsed ? "justify-center px-0 py-2.5 gap-0" : "gap-2.5 px-2 py-2"}
     ${
       isActive(href)
         ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium"
         : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
     }`;

  return (
  <aside
    className={`shrink-0 h-dvh sticky top-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden ${
      hydrated && !isMobile
        ? "transition-[width] duration-200 ease-in-out"
        : "transition-none"
    }`}
    style={{ width: effectiveCollapsed ? "56px" : "220px" }}
  >
      <div className="h-14 flex items-center gap-2 px-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <IconTarget />
        {!effectiveCollapsed && (
          <span className="font-bold text-gray-900 dark:text-gray-100 tracking-tight whitespace-nowrap">
            Paintball<span className="text-teal-600 dark:text-teal-400">HQ</span>
          </span>
        )}
      </div>

      <div className={`pt-4 pb-2 ${effectiveCollapsed ? "px-2" : "px-3"}`}>
        {!effectiveCollapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 mb-1">
            Navigation
          </p>
        )}
        {effectiveCollapsed && <div className="h-[18px] mb-1" />}
        <nav className="flex flex-col gap-0.5">
          {navLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              title={effectiveCollapsed ? label : undefined}
              className={linkClass(href)}
            >
              <Icon />
              {!effectiveCollapsed && label}
            </Link>
          ))}
        </nav>
      </div>

      {isAdmin && (
        <div className={`pt-4 pb-2 ${effectiveCollapsed ? "px-2" : "px-3"}`}>
          {!effectiveCollapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 mb-1">
              Admin
            </p>
          )}
          {effectiveCollapsed && <div className="h-[18px] mb-1" />}
          <nav className="flex flex-col gap-0.5">
            {adminLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                title={effectiveCollapsed ? label : undefined}
                className={linkClass(href)}
              >
                <Icon />
                {!effectiveCollapsed && label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <div className="flex-1" />

      {!isMobile && (
        <div className={`pb-2 ${effectiveCollapsed ? "px-2" : "px-3"}`}>
          <button
            onClick={toggle}
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center gap-2 py-1.5 rounded-md text-xs w-full
              text-gray-400 dark:text-gray-500
              hover:bg-gray-100 dark:hover:bg-gray-800
              hover:text-gray-600 dark:hover:text-gray-300
              transition-colors
              ${effectiveCollapsed ? "justify-center px-0" : "px-2"}`}
          >
            <IconChevron collapsed={effectiveCollapsed} />
            {!effectiveCollapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      <div
        className={`py-3 border-t border-gray-200 dark:border-gray-800 shrink-0 ${
          effectiveCollapsed ? "px-2" : "px-3"
        }`}
      >
        {isAdmin && userEmail ? (
          <div className="flex flex-col gap-1.5">
            {effectiveCollapsed ? (
              <div className="flex justify-center mb-1">
                <div
                  className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold"
                  title={userEmail}
                >
                  {userEmail[0].toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {userEmail[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userEmail}
                </span>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title={effectiveCollapsed ? "Sign out" : undefined}
              className={`flex items-center gap-2 py-1.5 rounded-md text-xs
                text-gray-500 dark:text-gray-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                hover:text-red-500 dark:hover:text-red-400
                transition-colors w-full
                ${effectiveCollapsed ? "justify-center px-0" : "px-2 text-left"}`}
            >
              <IconSignOut />
              {!effectiveCollapsed && "Sign out"}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            title={effectiveCollapsed ? "Organizer Login" : undefined}
            className={`flex items-center gap-2 py-2 rounded-md text-sm
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              hover:text-gray-900 dark:hover:text-gray-100
              transition-colors
              ${effectiveCollapsed ? "justify-center px-0" : "px-2"}`}
          >
            <IconLogin />
            {!effectiveCollapsed && "Organizer Login"}
          </Link>
        )}
      </div>
    </aside>
  );
}