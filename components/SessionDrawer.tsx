"use client";

import SessionSidebar, { type SessionSidebarProps } from "@/components/SessionSidebar";

interface SessionDrawerProps extends SessionSidebarProps {
  open: boolean;
  onClose: () => void;
}

export const MOBILE_QUERY = "(max-width: 639px)";

// Below the sm breakpoint there isn't room for the sidebar to sit alongside
// the chat/study column without squeezing it off-screen, so it renders as a
// fixed overlay with a backdrop instead — same component, same props, just a
// different container. From sm up it's the same static column it always was.
export default function SessionDrawer({ open, onClose, onSelect, ...sidebarProps }: SessionDrawerProps) {
  if (!open) return null;

  function handleSelect(id: string) {
    onSelect(id);
    if (typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches) {
      onClose();
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-ink/40 sm:hidden" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:static sm:z-auto sm:w-64 sm:max-w-none sm:shrink-0 sm:pt-0 sm:pb-0">
        <SessionSidebar {...sidebarProps} onSelect={handleSelect} />
      </div>
    </>
  );
}
