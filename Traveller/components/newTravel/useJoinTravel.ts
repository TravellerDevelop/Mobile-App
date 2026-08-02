import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { serverLink } from "../../global/globalVariable";
import { getData } from "../../shared/data/localdata";
import { INVITE_CODE_LENGTH } from "./useCreateTravelForm";

interface UseJoinTravelOptions {
  /** invocato dopo l'adesione, per aggiornare la home */
  onJoined: (username: string, userid: string) => void;
}

export function useJoinTravel({ onJoined }: UseJoinTravelOptions) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);

  /* Il codice è alfanumerico e case sensitive: ripulisco solo i caratteri
     non ammessi e taglio alla lunghezza prevista. */
  const updateCode = useCallback((value: string) => {
    setError("");
    setCode(value.replace(/[^A-Za-z0-9]/g, "").slice(0, INVITE_CODE_LENGTH));
  }, []);

  const digits = useMemo(
    () =>
      Array.from({ length: INVITE_CODE_LENGTH }, (_, index) => ({
        index,
        value: code[index] ?? "",
        filled: index < code.length,
      })),
    [code]
  );

  const canSubmit = code.length === INVITE_CODE_LENGTH;

  const openScanner = useCallback(() => setScannerOpen(true), []);
  const closeScanner = useCallback(() => setScannerOpen(false), []);

  /* Il QR contiene il solo codice invito del viaggio */
  const handleScan = useCallback(
    (value: string) => {
      setScannerOpen(false);
      updateCode(value.trim());
    },
    [updateCode]
  );

  const submit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const user = await getData("user");
      const response = await axios.post<{ message?: string }>(`${serverLink}api/travel/join`, {
        userid: user._id,
        username: user.username,
        code,
      });

      if (response.status === 200) {
        onJoined(user.username, user._id);
        return;
      }

      setError(response.data?.message ?? "Codice non valido");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Non è stato possibile entrare nel viaggio";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, code, onJoined]);

  return {
    code,
    digits,
    updateCode,
    error,
    canSubmit,
    isSubmitting,
    submit,
    isScannerOpen,
    openScanner,
    closeScanner,
    handleScan,
  };
}

export type JoinTravelForm = ReturnType<typeof useJoinTravel>;
