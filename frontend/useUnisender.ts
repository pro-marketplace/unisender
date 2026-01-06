/**
 * Unisender Extension - React Hook
 *
 * Hook for subscribing/unsubscribing to newsletter via Unisender.
 */

import { useState, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface UseUnisenderConfig {
  apiUrl: string;
}

interface SubscribeParams {
  email: string;
  name?: string;
  tags?: string;
}

interface UnisenderResult {
  success: boolean;
  person_id?: number;
  message?: string;
  error?: string;
}

interface UseUnisenderReturn {
  subscribe: (params: SubscribeParams) => Promise<UnisenderResult>;
  unsubscribe: (email: string) => Promise<UnisenderResult>;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// HOOK
// =============================================================================

export function useUnisender({ apiUrl }: UseUnisenderConfig): UseUnisenderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(
    async ({ email, name, tags }: SubscribeParams): Promise<UnisenderResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}?action=subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, tags }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Subscribe failed");
          return { success: false, error: data.error };
        }

        return { success: true, person_id: data.person_id };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  const unsubscribe = useCallback(
    async (email: string): Promise<UnisenderResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}?action=unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unsubscribe failed");
          return { success: false, error: data.error };
        }

        return { success: true, message: data.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  return { subscribe, unsubscribe, isLoading, error };
}

export default useUnisender;
