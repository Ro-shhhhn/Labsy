import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext({});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "error", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    error: (msg, duration) => addToast(msg, "error", duration),
    success: (msg, duration) => addToast(msg, "success", duration),
    warning: (msg, duration) => addToast(msg, "warning", duration),
    info: (msg, duration) => addToast(msg, "info", duration),
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const styles = {
    error: {
      bg: "bg-red-50 border-red-200",
      icon: "❌",
      text: "text-red-800",
      sub: "text-red-600",
      bar: "bg-red-400",
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200",
      icon: "✅",
      text: "text-emerald-800",
      sub: "text-emerald-600",
      bar: "bg-emerald-400",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: "⚠️",
      text: "text-amber-800",
      sub: "text-amber-600",
      bar: "bg-amber-400",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "ℹ️",
      text: "text-blue-800",
      sub: "text-blue-600",
      bar: "bg-blue-400",
    },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const s = styles[t.type] || styles.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto ${s.bg} border rounded-xl shadow-lg p-4 flex items-start gap-3 animate-[slideIn_0.3s_ease]`}
              style={{
                animation: "slideIn 0.3s ease",
              }}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
              <p className={`text-sm font-medium ${s.text} flex-1 leading-relaxed`}>
                {t.message}
              </p>
              <button
                onClick={() => removeToast(t.id)}
                className={`${s.sub} hover:opacity-70 text-lg flex-shrink-0 leading-none mt-0.5`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* animation keyframe */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}