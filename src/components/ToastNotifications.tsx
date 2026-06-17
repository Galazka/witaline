"use client";
import { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
}

interface ToastContextValue {
  toast: (props: {
    title: string;
    message?: string;
    type?: "success" | "error" | "info" | "warning";
    duration?: number;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<string, string> = {
  success: "\u2705",
  error: "\u274C",
  info: "\u2139\uFE0F",
  warning: "\u26A0\uFE0F",
};

const barColors: Record<string, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
};

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), 200);
  }, [toast.id, onClose]);

  return (
    <div
      className={`${
        exiting ? "animate-slide-out-right" : "animate-slide-in-right"
      } pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-brand-700/50 bg-brand-950/90 p-4 shadow-2xl backdrop-blur-xl transition-all`}
      role="alert"
    >
      <span className="mt-0.5 shrink-0 text-lg">{icons[toast.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-100">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-zinc-400">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="-mr-1 -mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-brand-950 hover:text-zinc-300"
        aria-label="Close"
      >
        <svg
          className="size-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div
        className={`absolute bottom-0 left-0 h-0.5 rounded-full ${barColors[toast.type]}`}
        style={{
          animation: `shrink ${toast.duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    ({
      title,
      message,
      type = "info",
      duration = 5000,
    }: {
      title: string;
      message?: string;
      type?: "success" | "error" | "info" | "warning";
      duration?: number;
    }) => {
      const id = crypto.randomUUID();
      const toast: Toast = { id, title, message, type, duration };
      setToasts((prev) => [...prev.slice(-4), toast]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration + 200);
      }
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export { ToastProvider, useToast };
