"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

interface SessionSidebarItem {
  id: string;
  title: string;
}

export interface SessionSidebarProps {
  items: SessionSidebarItem[];
  activeId: string;
  newLabel: string;
  emptyLabel: string;
  newDisabled?: boolean;
  accent: "sky" | "star";
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function SessionSidebar({
  items,
  activeId,
  newLabel,
  emptyLabel,
  newDisabled = false,
  accent,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: SessionSidebarProps) {
  const { t } = useTranslation();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const accentBg = accent === "star" ? "bg-star" : "bg-sky";
  const accentRing = accent === "star" ? "focus-visible:ring-star" : "focus-visible:ring-sky";

  return (
    <div className="flex h-full min-h-0 w-full max-w-[80vw] flex-col border-r border-line bg-paper">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          disabled={newDisabled}
          className={`w-full rounded-full px-3 py-2 text-base font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:opacity-100 ${accentBg} ${accentRing}`}
        >
          + {newLabel}
        </button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted">{emptyLabel}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <SessionRow
                key={item.id}
                item={item}
                isActive={item.id === activeId}
                isMenuOpen={openMenuId === item.id}
                isEditing={editingId === item.id}
                containerRef={listRef}
                accentBg={accentBg}
                accentRing={accentRing}
                onSelect={() => onSelect(item.id)}
                onOpenMenu={() => setOpenMenuId(item.id)}
                onCloseMenu={() =>
                  setOpenMenuId((current) => (current === item.id ? null : current))
                }
                onStartRename={() => {
                  setEditingId(item.id);
                  setOpenMenuId(null);
                }}
                onCancelRename={() => setEditingId(null)}
                onSaveRename={(newTitle) => {
                  setEditingId(null);
                  const trimmed = newTitle.trim();
                  if (trimmed.length > 0) {
                    onRename(item.id, trimmed);
                  }
                }}
                onDelete={() => {
                  setOpenMenuId(null);
                  if (window.confirm(t("session.deleteConfirm", { title: item.title }))) {
                    onDelete(item.id);
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
  item: SessionSidebarItem;
  isActive: boolean;
  isMenuOpen: boolean;
  isEditing: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  accentBg: string;
  accentRing: string;
  onSelect: () => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSaveRename: (newTitle: string) => void;
  onDelete: () => void;
}

const ESTIMATED_MENU_HEIGHT = 84;

function SessionRow({
  item,
  isActive,
  isMenuOpen,
  isEditing,
  containerRef,
  accentBg,
  accentRing,
  onSelect,
  onOpenMenu,
  onCloseMenu,
  onStartRename,
  onCancelRename,
  onSaveRename,
  onDelete,
}: SessionRowProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(item.title);
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEditValue(item.title);
    }
  }, [isEditing, item.title]);

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
      return;
    }

    const buttonRect = menuButtonRef.current?.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const spaceBelow = buttonRect && containerRect ? containerRect.bottom - buttonRect.bottom : 0;
    setOpenUpward(spaceBelow < ESTIMATED_MENU_HEIGHT);
    onOpenMenu();
  }

  return (
    <li className={`group relative ${isMenuOpen ? "z-20" : "z-0"}`}>
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
          className={`w-full rounded-xl border-2 border-line bg-paper px-2.5 py-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 ${accentRing}`}
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className={`flex w-full items-center rounded-xl px-2.5 py-2 pr-8 text-left text-base transition-colors ${
            isActive
              ? `font-medium text-ink ${accentBg}`
              : "text-ink hover:bg-line/40"
          }`}
        >
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
        </button>
      )}

      {!isEditing && (
        <div ref={menuRef} className="absolute right-1 top-1/2 -translate-y-1/2">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={handleMenuToggle}
            aria-label={t("session.sessionOptions")}
            className={`rounded-full px-1.5 py-1 text-base leading-none transition-opacity text-ink/70 hover:bg-ink/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
              isMenuOpen ? "sm:opacity-100" : ""
            }`}
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute right-0 z-30 w-36 overflow-hidden rounded-2xl border-2 border-line bg-paper py-1 shadow-lg ${
                openUpward ? "bottom-full mb-1" : "top-full mt-1"
              }`}
            >
              <button
                type="button"
                onClick={onStartRename}
                className="block w-full px-3 py-1.5 text-left text-sm font-medium text-ink hover:bg-line/40"
              >
                {t("session.rename")}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="block w-full px-3 py-1.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                {t("session.delete")}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
