import { toast as sonnerToast } from 'sonner';

/**
 * Toast notification hook using Sonner
 * Provides a simple interface for showing toast notifications
 */
export function useToast() {
  return {
    /**
     * Show a success toast
     */
    success: (message: string, description?: string) => {
      sonnerToast.success(message, { description });
    },

    /**
     * Show an error toast
     */
    error: (message: string, description?: string) => {
      sonnerToast.error(message, { description });
    },

    /**
     * Show an info toast
     */
    info: (message: string, description?: string) => {
      sonnerToast.info(message, { description });
    },

    /**
     * Show a warning toast
     */
    warning: (message: string, description?: string) => {
      sonnerToast.warning(message, { description });
    },

    /**
     * Show a loading toast that can be updated
     */
    loading: (message: string) => {
      return sonnerToast.loading(message);
    },

    /**
     * Dismiss a specific toast or all toasts
     */
    dismiss: (toastId?: string | number) => {
      sonnerToast.dismiss(toastId);
    },

    /**
     * Show a promise-based toast
     */
    promise: <T>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string;
        error: string;
      }
    ) => {
      return sonnerToast.promise(promise, options);
    },
  };
}

/**
 * Direct toast export for use outside React components
 */
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description });
  },
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },
};
