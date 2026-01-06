/**
 * Unisender Extension - Subscribe Form
 *
 * Ready-to-use newsletter subscription form component.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// =============================================================================
// TYPES
// =============================================================================

interface SubscribeFormProps {
  /** API URL for Unisender function */
  apiUrl: string;
  /** Placeholder for email input */
  emailPlaceholder?: string;
  /** Placeholder for name input (optional field) */
  namePlaceholder?: string;
  /** Show name field */
  showNameField?: boolean;
  /** Button text */
  buttonText?: string;
  /** Success message */
  successMessage?: string;
  /** CSS class */
  className?: string;
  /** Callback on successful subscribe */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

// =============================================================================
// SPINNER
// =============================================================================

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SubscribeForm({
  apiUrl,
  emailPlaceholder = "Ваш email",
  namePlaceholder = "Ваше имя",
  showNameField = false,
  buttonText = "Подписаться",
  successMessage = "Вы успешно подписались на рассылку!",
  className = "",
  onSuccess,
  onError,
}: SubscribeFormProps): React.ReactElement {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}?action=subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: showNameField ? name : undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Subscribe failed");
      }

      setIsSuccess(true);
      setEmail("");
      setName("");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`text-green-600 font-medium ${className}`}>
        {successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${className}`}>
      {showNameField && (
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePlaceholder}
          disabled={isLoading}
        />
      )}
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          required
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !email}>
          {isLoading ? (
            <>
              <Spinner className="!w-4 !h-4 mr-2" />
              Загрузка...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}

export default SubscribeForm;
