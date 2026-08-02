import React, { useRef } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ds } from "../../global/designSystem";
import { INVITE_CODE_LENGTH } from "./useCreateTravelForm";
import type { JoinTravelForm as JoinTravelFormState } from "./useJoinTravel";

interface JoinTravelFormProps {
  form: JoinTravelFormState;
}

export default function JoinTravelForm({ form }: JoinTravelFormProps) {
  const inputRef = useRef<TextInput>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    form.openScanner();
  };

  return (
    <>
      {/* Intestazione della sezione codice */}
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <MaterialCommunityIcons name="qrcode" size={28} color={ds.colors.action} />
        </View>
        <Text style={styles.introTitle}>Hai un codice invito?</Text>
        <Text style={styles.introText}>
          Inseriscilo qui sotto oppure scansiona il codice QR condiviso dall'organizzatore
        </Text>
      </View>

      {/* Celle del codice: un unico input nascosto le alimenta tutte */}
      <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
        <View style={styles.cells}>
          {form.digits.map((digit) => (
            <View
              key={digit.index}
              style={[styles.cell, digit.filled && styles.cellFilled]}
            >
              <Text style={styles.cellText}>{digit.value}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={form.code}
        onChangeText={form.updateCode}
        maxLength={INVITE_CODE_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.hiddenInput}
      />

      {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OPPURE</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={openScanner}>
        <View style={styles.scanButton}>
          <MaterialCommunityIcons name="camera-outline" size={16} color={ds.colors.text} />
          <Text style={styles.scanButtonText}>Scansiona codice QR</Text>
        </View>
      </TouchableOpacity>

      {/* Scanner a tutta pagina */}
      <Modal visible={form.isScannerOpen} animationType="slide" onRequestClose={form.closeScanner}>
        <View style={styles.scanner}>
          <Text style={styles.scannerTitle}>Scansiona il codice QR</Text>
          <Text style={styles.scannerText}>
            Inquadra il codice QR del viaggio per inserire automaticamente il codice invito
          </Text>

          <View style={styles.frame}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => form.handleScan(data)}
            />
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          <Pressable onPress={form.closeScanner}>
            <View style={styles.scannerBack}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={14}
                color={ds.colors.scale.accent[8]}
              />
              <Text style={styles.scannerBackText}>Torna indietro</Text>
            </View>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  intro: {
    alignItems: "center",
    marginBottom: ds.space[7] + 2,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: ds.radius.full,
    backgroundColor: ds.colors.actionSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ds.space[4] + 2,
  },
  introTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 16,
    color: ds.colors.text,
    marginBottom: ds.space[2],
  },
  introText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: ds.colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  cells: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: ds.space[6],
  },
  cell: {
    width: 40,
    height: 52,
    borderWidth: 1.5,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.m,
    backgroundColor: ds.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: ds.space[2],
  },
  cellFilled: {
    borderColor: ds.colors.action,
    backgroundColor: ds.colors.actionSubtle,
  },
  cellText: {
    fontFamily: ds.fontFamily.metaBold,
    fontSize: 20,
    color: ds.colors.text,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
  error: {
    fontFamily: ds.fontFamily.medium,
    fontSize: 12,
    color: ds.colors.errorText,
    textAlign: "center",
    marginBottom: ds.space[4],
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: ds.space[6],
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
  },
  dividerText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 11,
    color: ds.colors.textSecondary,
    marginHorizontal: ds.space[3] + 2,
  },
  scanButton: {
    height: ds.control.lg,
    borderRadius: ds.radius.m,
    borderWidth: 1,
    borderColor: ds.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 14,
    color: ds.colors.text,
    marginLeft: ds.space[3],
  },
  scanner: {
    flex: 1,
    backgroundColor: ds.colors.black,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: ds.space[8],
  },
  scannerTitle: {
    fontFamily: ds.fontFamily.bold,
    fontSize: 18,
    color: ds.colors.white,
    textAlign: "center",
    marginBottom: ds.space[2] + 2,
  },
  scannerText: {
    fontFamily: ds.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    maxWidth: 260,
    marginBottom: ds.space[8],
  },
  frame: {
    width: 220,
    height: 220,
    marginBottom: ds.space[9],
  },
  corner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: ds.colors.scale.accent[9],
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scannerBack: {
    flexDirection: "row",
    alignItems: "center",
  },
  scannerBackText: {
    fontFamily: ds.fontFamily.semibold,
    fontSize: 13,
    color: ds.colors.scale.accent[8],
    marginLeft: ds.space[2] + 2,
  },
});
