"use client";

import * as React from "react";
import { ToastActionElement, type ToastProps } from "@/components/ui/toast";

// ---------------------------
// 🔧 Constants
// ---------------------------
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

// ---------------------------
// 🔧 Types
// ---------------------------
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type State = {
  toasts: ToasterToast[];
};

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

// ---------------------------
// 🔧 Context setup
// ---------------------------
const ToastContext = React.createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// ---------------------------
// 🔧 Reducer logic
// ---------------------------
function toastReducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

// ---------------------------
// 🔧 Provider
// ---------------------------
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });
  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
}

// ---------------------------
// 🔧 Hook chính
// ---------------------------
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context)
    throw new Error("useToast must be used within a <ToastProvider>");

  const { state, dispatch } = context;

  const genId = React.useCallback(() => {
    return Math.random().toString(36).substring(2, 9);
  }, []);

  const toast = React.useCallback(
    (props: ToastProps) => {
      const id = genId();
      dispatch({ type: "ADD_TOAST", toast: { ...props, id } });
      return id;
    },
    [dispatch, genId]
  );

  const dismiss = React.useCallback(
    (toastId?: string) => {
      dispatch({ type: "DISMISS_TOAST", toastId });
    },
    [dispatch]
  );

  return { toast, dismiss, toasts: state.toasts };
}

export type { ToasterToast };
