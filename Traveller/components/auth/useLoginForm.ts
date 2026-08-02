import { useCallback, useState } from "react";
import { loginRequest } from "./api";
import type { AuthFieldErrors, AuthUser } from "./types";

interface UseLoginFormOptions {
  onSuccess: (user: AuthUser) => void;
}

export function useLoginForm({ onSuccess }: UseLoginFormOptions) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateIdentifier = useCallback((value: string) => {
    setIdentifier(value);
    setErrors((prev) => ({ ...prev, identifier: undefined, form: undefined }));
  }, []);

  const updatePassword = useCallback((value: string) => {
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
  }, []);

  const toggleShowPassword = useCallback(() => setShowPassword((prev) => !prev), []);

  const validate = useCallback((): boolean => {
    const nextErrors: AuthFieldErrors = {};
    if (!identifier.trim()) nextErrors.identifier = "Inserisci email o username.";
    if (!password) nextErrors.password = "Inserisci la password.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [identifier, password]);

  const submit = useCallback(async () => {
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await loginRequest(identifier.trim(), password);
      onSuccess(user);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Accesso non riuscito." });
    } finally {
      setIsSubmitting(false);
    }
  }, [identifier, password, isSubmitting, validate, onSuccess]);

  return {
    identifier,
    password,
    showPassword,
    errors,
    isSubmitting,
    updateIdentifier,
    updatePassword,
    toggleShowPassword,
    submit,
  };
}

export type LoginForm = ReturnType<typeof useLoginForm>;
