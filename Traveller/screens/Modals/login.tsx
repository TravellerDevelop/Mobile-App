import React from "react";
import { Modal } from "react-native";
import AuthScreen from "../../components/auth/AuthScreen";
import type { AuthUser } from "../../components/auth/types";
import { useAuth } from "../../global/authContext";

/**
 * Wrapper "modale" attorno alla schermata di autenticazione unica
 * (components/auth/AuthScreen). Da quando l'accesso è gestito a livello
 * di App.tsx (vedi AuthProvider/useAuth), l'app non apre più questo modale
 * automaticamente: resta disponibile per essere invocato puntualmente,
 * ad es. per chiedere di rifare login su un'azione che lo richiede.
 */
interface LoginModalProps {
  navigation?: { navigate?: (route: string) => void };
  visibility: boolean;
  setVisibility: (visible: boolean) => void;
  /** @deprecated tenuto per compatibilità con i chiamanti esistenti. */
  setHomeContent?: (loggedIn: boolean) => void;
}

export default function LoginModal({
  navigation,
  visibility,
  setVisibility,
  setHomeContent,
}: LoginModalProps) {
  const { login } = useAuth();

  const handleAuthenticated = async (user: AuthUser) => {
    await login(user);
    setVisibility(false);
    setHomeContent?.(true);
    navigation?.navigate?.("Home");
  };

  return (
    <Modal visible={!!visibility} animationType="slide" presentationStyle="fullScreen">
      <AuthScreen initialMode="login" onAuthenticated={handleAuthenticated} />
    </Modal>
  );
}
