import React, { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/* ---- Campo con icona (email, password, nome...) -------------- */
interface AuthFieldProps extends TextInputProps {
  label: string;
  icon: IconName;
  error?: string;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  {
    label,
    icon,
    error,
    rightIcon,
    onRightIconPress,
    rightIconAccessibilityLabel,
    containerStyle,
    style,
    ...inputProps
  },
  ref
) {
  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, !!error && styles.boxError]}>
        <MaterialCommunityIcons name={icon} size={16} color={ds.colors.textSecondary} />
        <TextInput
          ref={ref}
          placeholderTextColor={ds.colors.textPlaceholder}
          style={[styles.input, style]}
          {...inputProps}
        />
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={rightIconAccessibilityLabel}
          >
            <MaterialCommunityIcons name={rightIcon} size={16} color={ds.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

/* ---- Checkbox per l'accettazione dei termini ------------------ */
interface AuthCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  error?: string;
}

export function AuthCheckbox({ checked, onToggle, children, error }: AuthCheckboxProps) {
  return (
    <View style={styles.checkboxGroup}>
      <TouchableOpacity
        style={styles.checkboxRow}
        activeOpacity={0.8}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
          {checked ? (
            <MaterialCommunityIcons name="check" size={12} color={ds.colors.white} />
          ) : null}
        </View>
        <Text style={styles.checkboxLabel}>{children}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* ---- Bottone di accesso social (Google / Apple) ---------------
   Non essendoci integrazione OAuth lato backend, il tasto è presente
   per fedeltà al mockup ma segnala onPress che la funzione non è
   ancora disponibile, invece di simulare un login che non esiste. */
interface SocialButtonProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
}

export function SocialButton({ icon, label, onPress }: SocialButtonProps) {
  return (
    <TouchableOpacity style={styles.socialButton} activeOpacity={0.85} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={16} color={ds.colors.text} />
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: ds.space[4] + 2,
  },
  label: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[3] - 1,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.space[3] - 1,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4] - 1,
    paddingHorizontal: ds.space[4] + 2,
  },
  boxError: {
    borderColor: ds.colors.error,
  },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: ds.fontFamily.regular,
    fontSize: 14,
    color: ds.colors.text,
  },
  errorText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 11,
    color: ds.colors.errorText,
    marginTop: ds.space[2],
  },
  checkboxGroup: {
    marginBottom: ds.space[6] - 2,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ds.space[3] - 1,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: ds.radius.s,
    borderWidth: 1,
    borderColor: ds.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxBoxChecked: {
    backgroundColor: ds.colors.action,
    borderColor: ds.colors.action,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: ds.colors.textSecondary,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ds.space[3] - 1,
    height: ds.control.lg,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
  },
  socialLabel: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.text,
  },
});
