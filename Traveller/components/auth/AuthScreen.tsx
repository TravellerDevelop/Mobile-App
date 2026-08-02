import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { ds } from "../../global/designSystem";
import { SegmentedControl } from "../newPost/fields";
import { AuthCheckbox, AuthField, SocialButton } from "./AuthFields";
import { useLoginForm } from "./useLoginForm";
import { useRegisterForm } from "./useRegisterForm";
import type { AuthMode, AuthUser } from "./types";

interface AuthScreenProps {
  initialMode?: AuthMode;
  /** Chiamata subito dopo un login/una registrazione riusciti. */
  onAuthenticated: (user: AuthUser) => void;
}

const modeCopy: Record<AuthMode, { title: string; subtitle: string }> = {
  login: { title: "Traveller", subtitle: "Bentornato. Accedi per continuare il viaggio." },
  register: { title: "Traveller", subtitle: "Crea un account e inizia a organizzare." },
};

/* Schermata unica di accesso/registrazione: la scheda attiva è gestita
   internamente (tab "Accedi" / "Registrati"), come nel mockup di design. */
export default function AuthScreen({ initialMode = "login", onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const isLogin = mode === "login";

  const loginPasswordRef = useRef<TextInput>(null);
  const registerEmailRef = useRef<TextInput>(null);
  const registerPasswordRef = useRef<TextInput>(null);
  const registerConfirmRef = useRef<TextInput>(null);

  const loginForm = useLoginForm({ onSuccess: onAuthenticated });
  const registerForm = useRegisterForm({ onSuccess: onAuthenticated });

  const isSubmitting = isLogin ? loginForm.isSubmitting : registerForm.isSubmitting;
  const formError = isLogin ? loginForm.errors.form : registerForm.errors.form;
  const submit = isLogin ? loginForm.submit : registerForm.submit;

  const handleForgotPassword = () => {
    Alert.alert(
      "Password dimenticata?",
      "Il recupero password non è ancora disponibile in app. Contatta il supporto per reimpostarla."
    );
  };

  const handleSocialPress = (provider: string) => {
    Alert.alert(
      "Non ancora disponibile",
      `L'accesso con ${provider} arriverà in un prossimo aggiornamento.`
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.badge}>
            <Svg width={26} height={26} viewBox="0 0 24 24">
              <Path
                d="M2.5 12.3L21.3 3.2L13.6 21.6L11.1 13.9L2.5 12.3Z"
                fill={ds.colors.white}
              />
              <Path
                d="M11.1 13.9L17.6 7.4"
                stroke={ds.colors.brand}
                strokeWidth={1.4}
                strokeLinecap="round"
                opacity={0.35}
              />
            </Svg>
          </View>
          <Text style={styles.brandTitle}>{modeCopy[mode].title}</Text>
          <Text style={styles.brandSubtitle}>{modeCopy[mode].subtitle}</Text>
        </View>

        <View style={styles.sheet}>
          <SegmentedControl
            options={[
              { value: "login", label: "Accedi" },
              { value: "register", label: "Registrati" },
            ]}
            value={mode}
            onChange={setMode}
          />

          {isLogin ? (
            <>
              <AuthField
                label="Email"
                icon="email-outline"
                placeholder="tua@email.com"
                value={loginForm.identifier}
                onChangeText={loginForm.updateIdentifier}
                error={loginForm.errors.identifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                autoComplete="username"
                returnKeyType="next"
                accessibilityLabel="Email o username"
                onSubmitEditing={() => loginPasswordRef.current?.focus()}
              />
              <AuthField
                ref={loginPasswordRef}
                label="Password"
                icon="lock-outline"
                placeholder="La tua password"
                value={loginForm.password}
                onChangeText={loginForm.updatePassword}
                error={loginForm.errors.password}
                secureTextEntry={!loginForm.showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                accessibilityLabel="Password"
                rightIcon={loginForm.showPassword ? "eye-off-outline" : "eye-outline"}
                rightIconAccessibilityLabel={
                  loginForm.showPassword ? "Nascondi password" : "Mostra password"
                }
                onRightIconPress={loginForm.toggleShowPassword}
                onSubmitEditing={loginForm.submit}
              />

              <TouchableOpacity
                style={styles.forgotWrap}
                activeOpacity={0.7}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotText}>Password dimenticata?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <AuthField
                label="Nome completo"
                icon="account-outline"
                placeholder="Marco Rossi"
                value={registerForm.fullName}
                onChangeText={registerForm.updateFullName}
                error={registerForm.errors.fullName}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                returnKeyType="next"
                accessibilityLabel="Nome completo"
                onSubmitEditing={() => registerEmailRef.current?.focus()}
              />
              <AuthField
                ref={registerEmailRef}
                label="Email"
                icon="email-outline"
                placeholder="tua@email.com"
                value={registerForm.email}
                onChangeText={registerForm.updateEmail}
                error={registerForm.errors.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                accessibilityLabel="Email"
                onSubmitEditing={() => registerPasswordRef.current?.focus()}
              />
              <AuthField
                ref={registerPasswordRef}
                label="Password"
                icon="lock-outline"
                placeholder="Minimo 8 caratteri"
                value={registerForm.password}
                onChangeText={registerForm.updatePassword}
                error={registerForm.errors.password}
                secureTextEntry={!registerForm.showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="next"
                accessibilityLabel="Password"
                rightIcon={registerForm.showPassword ? "eye-off-outline" : "eye-outline"}
                rightIconAccessibilityLabel={
                  registerForm.showPassword ? "Nascondi password" : "Mostra password"
                }
                onRightIconPress={registerForm.toggleShowPassword}
                onSubmitEditing={() => registerConfirmRef.current?.focus()}
              />
              <AuthField
                ref={registerConfirmRef}
                label="Conferma password"
                icon="lock-outline"
                placeholder="Ripeti la password"
                value={registerForm.confirmPassword}
                onChangeText={registerForm.updateConfirmPassword}
                error={registerForm.errors.confirmPassword}
                secureTextEntry={!registerForm.showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="done"
                accessibilityLabel="Conferma password"
                onSubmitEditing={registerForm.submit}
              />

              <AuthCheckbox
                checked={registerForm.acceptedTerms}
                onToggle={registerForm.toggleAcceptedTerms}
                error={registerForm.errors.terms}
              >
                Accetto i <Text style={styles.checkboxStrong}>Termini di servizio</Text> e
                l'<Text style={styles.checkboxStrong}>Informativa privacy</Text>
              </AuthCheckbox>
            </>
          )}

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={submit}
            disabled={isSubmitting}
            style={styles.submitWrap}
          >
            <View style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}>
              {isSubmitting ? (
                <ActivityIndicator color={ds.colors.white} />
              ) : (
                <Text style={styles.submitText}>{isLogin ? "Accedi" : "Crea account"}</Text>
              )}
            </View>
          </TouchableOpacity>

          {isLogin && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OPPURE</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton icon="google" label="Google" onPress={() => handleSocialPress("Google")} />
                <SocialButton icon="apple" label="Apple" onPress={() => handleSocialPress("Apple")} />
              </View>
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isLogin ? "Non hai un account? " : "Hai già un account? "}
            </Text>
            <TouchableOpacity onPress={() => setMode(isLogin ? "register" : "login")}>
              <Text style={styles.switchLink}>{isLogin ? "Registrati" : "Accedi"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ds.colors.brand,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: ds.colors.brand,
    paddingTop: 84,
    paddingHorizontal: ds.layout.headerPaddingH,
    paddingBottom: ds.space[8] + 4,
    alignItems: "center",
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: ds.radius.m,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ds.space[4] - 2,
  },
  brandTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 20,
    letterSpacing: 0.2,
    color: ds.colors.white,
    marginBottom: ds.space[2],
  },
  brandSubtitle: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.onBrandMuted,
    textAlign: "center",
  },
  sheet: {
    flex: 1,
    backgroundColor: ds.colors.surface,
    borderTopLeftRadius: ds.layout.sheetRadius,
    borderTopRightRadius: ds.layout.sheetRadius,
    marginTop: -20,
    paddingHorizontal: ds.layout.screenPadding + 4,
    paddingTop: ds.space[6],
    paddingBottom: ds.space[8],
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: ds.space[6] + 2,
  },
  forgotText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
  },
  checkboxStrong: {
    fontFamily: ds.fontFamily.semibold,
    color: ds.colors.action,
  },
  formError: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    color: ds.colors.errorText,
    textAlign: "center",
    marginBottom: ds.space[4],
  },
  submitWrap: {
    marginBottom: ds.space[5],
  },
  submitButton: {
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.action,
    alignItems: "center",
    justifyContent: "center",
    ...ds.shadow.md,
  },
  submitButtonDisabled: {
    backgroundColor: ds.colors.disabledBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.white,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3] - 1,
    marginBottom: ds.space[5],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
  },
  dividerText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.textSecondary,
  },
  socialRow: {
    flexDirection: "row",
    gap: ds.space[3] - 1,
    marginBottom: ds.space[6] + 2,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  switchText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.textSecondary,
  },
  switchLink: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.action,
  },
});
