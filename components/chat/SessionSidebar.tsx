"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatSession } from "@/lib/types";

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onRename: (sessionId: string, newTitle: string) => void;
  onDelete: (sessionId: string) => void;
}

export default function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: SessionSidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 w-full flex-col border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No chats yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                isMenuOpen={openMenuId === session.id}
                isEditing={editingId === session.id}
                onSelect={() => onSelect(session.id)}
                onOpenMenu={() => setOpenMenuId(session.id)}
                onCloseMenu={() =>
                  setOpenMenuId((current) => (current === session.id ? null : current))
                }
                onStartRename={() => {
                  setEditingId(session.id);
                  setOpenMenuId(null);
                }}
                onCancelRename={() => setEditingId(null)}
                onSaveRename={(newTitle) => {
                  setEditingId(null);
                  const trimmed = newTitle.trim();
                  if (trimmed.length > 0) {
                    onRename(session.id, trimmed);
                  }
                }}
                onDelete={() => {
                  setOpenMenuId(null);
                  if (window.confirm(`Delete "${session.title}"? This cannot be undone.`)) {
                    onDelete(session.id);
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface SessionRowProps {
  session: ChatSession;
  isActive: boolean;
  isMenuOpen: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSaveRename: (newTitle: string) => void;
  onDelete: () => void;
}

function SessionRow({
  session,
  isActive,
  isMenuOpen,
  isEditing,
  onSelect,
  onOpenMenu,
  onCloseMenu,
  onStartRename,
  onCancelRename,
  onSaveRename,
  onDelete,
}: SessionRowProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(session.title);

  useEffect(() => {
    if (isEditing) {
      setEditValue(session.title);
    }
  }, [isEditing, session.title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseMenu();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMenuOpen, onCloseMenu]);

  function handleMenuToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (isMenuOpen) {
      onCloseMenu();
    } else {
      onOpenMenu();
    }
  }

  return (
    <li className="group relative">
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onSaveRename(editValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSaveRename(editValue);
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancelRename();
            }
          }}
          className="w-full rounded-md border border-zinc-400 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className={`flex w-full items-center rounded-md px-2.5 py-2 pr-8 text-left text-sm transition-colors ${
            isActive
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <span className="min-w-0 flex-1 truncate">{session.title}</span>
        </button>
      )}

      {!isEditing && (
        <div ref={menuRef} className="absolute right-1 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={handleMenuToggle}
            aria-label="Session options"
            className={`rounded-md px-1.5 py-1 text-sm leading-none transition-opacity ${
              isActive
                ? "text-white/80 hover:bg-white/10"
                : "text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
            } opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
              isMenuOpen ? "sm:opacity-100" : ""
            }`}
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            >
              <button
                type="button"
                onClick={onStartRename}
                className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Rename chat
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete chat
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
