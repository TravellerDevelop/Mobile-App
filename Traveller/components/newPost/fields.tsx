import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ds } from "../../global/designSystem";

/* ---- Card con etichetta, contenitore standard dei campi ----- */
interface FieldCardProps {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FieldCard({ label, children, style }: FieldCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Un'etichetta vuota occuperebbe comunque una riga di spazio
          (usata per allineare campi senza label, es. importo pagamento) */}
      {label ? <Text style={styles.cardLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

/* ---- Campo di testo dentro una card ------------------------- */
interface FieldInputProps extends TextInputProps {
  label: string;
  cardStyle?: ViewStyle;
}

export function FieldInput({ label, cardStyle, style, ...props }: FieldInputProps) {
  return (
    <FieldCard label={label} style={cardStyle}>
      <TextInput
        placeholderTextColor={ds.colors.textPlaceholder}
        style={[styles.input, style]}
        {...props}
      />
    </FieldCard>
  );
}

/* ---- Etichetta di sezione maiuscola ------------------------- */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

/* ---- Controllo segmentato a pillola ------------------------- */
interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.8}
            style={styles.segmentSlot}
            onPress={() => onChange(option.value)}
          >
            <View style={[styles.segment, isActive && styles.segmentActive]}>
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ---- Riga con interruttore ---------------------------------- */
interface ToggleRowProps {
  icon: string;
  label: string;
  value: boolean;
  onToggle: () => void;
}

export function ToggleRow({ icon, label, value, onToggle }: ToggleRowProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelRow}>
          <MaterialCommunityIcons
            name={icon as never}
            size={15}
            color={ds.colors.textSecondary}
          />
          <Text style={styles.toggleLabel}>{label}</Text>
        </View>

        <View style={[styles.track, value && styles.trackOn]}>
          <View style={[styles.knob, value && styles.knobOn]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ---- Bottone tratteggiato "aggiungi" ------------------------ */
export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={styles.addButton}>
        <MaterialCommunityIcons name="plus" size={14} color={ds.colors.action} />
        <Text style={styles.addButtonText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    padding: ds.space[5],
    marginBottom: ds.space[4] + 2,
  },
  cardLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[3],
  },
  input: {
    padding: 0,
    fontFamily: ds.fontFamily.regular,
    fontSize: 13,
    color: ds.colors.text,
  },
  sectionLabel: {
    ...ds.type.sectionLabel,
    marginBottom: ds.space[3] + 2,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: ds.colors.scale.neutral[3],
    borderRadius: 22,
    padding: 3,
    marginBottom: ds.space[4],
    overflow: "hidden",
  },
  segmentSlot: {
    flex: 1,
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ds.space[3],
    // Raggio fisso (non ds.radius.full/999): su Android con la New
    // Architecture un borderRadius molto più grande della view genera
    // un artefatto di clipping che taglia l'angolo (sembra triangolare),
    // visibile solo sul segmento attivo perché è l'unico con un riempimento.
    borderRadius: 18,
    overflow: "hidden",
  },
  segmentActive: {
    backgroundColor: ds.colors.action,
  },
  segmentText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  segmentTextActive: {
    color: ds.colors.white,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    borderRadius: ds.radius.l,
    paddingVertical: ds.space[4] + 2,
    paddingHorizontal: ds.space[5],
  },
  toggleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 13,
    color: ds.colors.text,
    marginLeft: ds.space[3],
  },
  track: {
    width: 40,
    height: 24,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.scale.neutral[5],
    justifyContent: "center",
  },
  trackOn: {
    backgroundColor: ds.colors.action,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.white,
    marginLeft: 2,
    ...ds.shadow.md,
  },
  knobOn: {
    marginLeft: 18,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: ds.control.md,
    borderRadius: ds.radius.m,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: ds.colors.action,
  },
  addButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 12,
    color: ds.colors.action,
    marginLeft: ds.space[2],
  },
});
