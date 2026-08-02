import { useCallback, useState } from "react";
import { registerRequest } from "./api";
import type { AuthFieldErrors, AuthUser } from "./types";
import { PASSWORD_MIN_LENGTH, isValidEmail, isValidPassword, splitFullName } from "./validation";

interface UseRegisterFormOptions {
  onSuccess: (user: AuthUser) => void;
}

export function useRegisterForm({ onSuccess }: UseRegisterFormOptions) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = useCallback((field: keyof AuthFieldErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }, []);

  const updateFullName = useCallback(
    (value: string) => {
      setFullName(value);
      clearError("fullName");
    },
    [clearError]
  );

  const updateEmail = useCallback(
    (value: string) => {
      setEmail(value);
      clearError("email");
    },
    [clearError]
  );

  const updatePassword = useCallback(
    (value: string) => {
      setPassword(value);
      clearError("password");
    },
    [clearError]
  );

  const updateConfirmPassword = useCallback(
    (value: string) => {
      setConfirmPassword(value);
      clearError("confirmPassword");
    },
    [clearError]
  );

  const toggleShowPassword = useCallback(() => setShowPassword((prev) => !prev), []);

  const toggleAcceptedTerms = useCallback(() => {
    setAcceptedTerms((prev) => !prev);
    clearError("terms");
  }, [clearError]);

  const validate = useCallback((): boolean => {
    const nextErrors: AuthFieldErrors = {};

    if (!splitFullName(fullName)) {
      nextErrors.fullName = "Inserisci nome e cognome (es. Marco Rossi).";
    }
    if (!isValidEmail(email)) {
      nextErrors.email = "Inserisci un indirizzo email valido.";
    }
    if (!isValidPassword(password)) {
      nextErrors.password = `La password deve avere almeno ${PASSWORD_MIN_LENGTH} caratteri.`;
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Le password non coincidono.";
    }
    if (!acceptedTerms) {
      nextErrors.terms = "Devi accettare i termini per continuare.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [fullName, email, password, confirmPassword, acceptedTerms]);

  const submit = useCallback(async () => {
    if (isSubmitting) return;
    if (!validate()) return;

    const names = splitFullName(fullName);
    if (!names) return; // già coperto da validate(), guardia per i tipi

    setIsSubmitting(true);
    try {
      const user = await registerRequest({
        name: names.name,
        surname: names.surname,
        email: email.trim().toLowerCase(),
        password,
      });
      onSuccess(user);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Registrazione non riuscita." });
    } finally {
      setIsSubmitting(false);
    }
  }, [fullName, email, password, isSubmitting, validate, onSuccess]);

  return {
    fullName,
    email,
    password,
    confirmPassword,
    acceptedTerms,
    showPassword,
    errors,
    isSubmitting,
    updateFullName,
    updateEmail,
    updatePassword,
    updateConfirmPassword,
    toggleShowPassword,
    toggleAcceptedTerms,
    submit,
  };
}

export type RegisterForm = ReturnType<typeof useRegisterForm>;
