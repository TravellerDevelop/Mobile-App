import React from "react";
import { Modal } from "react-native";
import AuthScreen from "../../components/auth/AuthScreen";
import type { AuthUser } from "../../components/auth/types";
import { useAuth } from "../../global/authContext";

/**
 * Wrapper "modale" attorno alla schermata di autenticazione unica
 * (components/auth/AuthScreen), sul tab "Registrati". Vedi login.tsx per
 * il motivo per cui non è più aperto automaticamente dall'app.
 */
interface SignupProps {
  navigation?: { navigate?: (route: string) => void };
  visibility: boolean;
  setVisibility: (visible: boolean) => void;
  setLoginVisibility?: (visible: boolean) => void;
}

export default function Signup({
  navigation,
  visibility,
  setVisibility,
  setLoginVisibility,
}: SignupProps) {
  const { login } = useAuth();

  const handleAuthenticated = async (user: AuthUser) => {
    await login(user);
    setVisibility(false);
    setLoginVisibility?.(false);
    navigation?.navigate?.("Home");
  };

  return (
    <Modal visible={!!visibility} animationType="slide" presentationStyle="fullScreen">
      <AuthScreen initialMode="register" onAuthenticated={handleAuthenticated} />
    </Modal>
  );
}
