"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  panelClassName?: string;
  backdropClassName?: string;
}

const ANIMATION_DURATION = 200;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeLabel = "Close",
  panelClassName,
  backdropClassName,
}: ModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    const element = document.createElement("div");
    element.setAttribute("data-modal-root", "true");
    document.body.appendChild(element);
    setPortalElement(element);
    return () => {
      document.body.removeChild(element);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      requestAnimationFrame(() => setIsVisible(true));
      return;
    }

    setIsVisible(false);
    const timer = window.setTimeout(
      () => setIsMounted(false),
      ANIMATION_DURATION
    );
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isMounted || !portalElement) {
    return null;
  }

  const backdropClasses = [
    "fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4",
    "transition-opacity duration-200",
    isVisible ? "opacity-100" : "opacity-0",
    backdropClassName,
  ].join(" ");

  const panelClasses = [
    "fixed inset-0 sm:relative sm:inset-auto",
    "w-full h-full sm:h-auto sm:max-w-lg",
    "rounded-none sm:rounded-lg bg-white p-6 shadow-lg",
    "transition-all duration-200",
    "dark:bg-zinc-900",
    isVisible ? "translate-y-0 scale-100" : "translate-y-4 scale-95",
    panelClassName,
  ].join(" ");

  return createPortal(
    <div className={backdropClasses} onClick={onClose} role="presentation">
      <div
        className={`flex flex-col ${panelClasses}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          {title ? (
            <h2
              id={titleId}
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {title}
            </h2>
          ) : (
            <span className="sr-only">Dialog</span>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-50/20"
            aria-label={closeLabel}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="M6 6 18 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto text-sm text-zinc-700 dark:text-zinc-200">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 flex items-center justify-end gap-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    portalElement
  );
}
