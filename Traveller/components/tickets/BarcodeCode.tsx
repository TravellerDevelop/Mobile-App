import React, { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { encodeBarcodeMatrix } from "./barcodeEncode";

interface BarcodeCodeProps {
  /** Testo grezzo del barcode (ApiTicket.qrdata). */
  value?: string | null;
  /** Simbologia rilevata dalla fotocamera al momento della scansione (ApiTicket.qrtype: "qr" | "aztec" | "pdf417" | "datamatrix" | ...). */
  format?: string | number | null;
  size: number;
}

/**
 * Ridisegna il barcode del biglietto nella stessa simbologia con cui è stato
 * scansionato, quando sappiamo farlo (vedi barcodeEncode.ts): Aztec e Data
 * Matrix vengono rigenerati fedelmente, altrimenti (QR, PDF417 — che non ha
 * un encoder disponibile in repo — o un `format` mancante/sconosciuto, es. i
 * biglietti creati prima dell'introduzione di `qrtype`) si ricade sul QR code
 * "storico" con lo stesso contenuto testuale.
 */
export default function BarcodeCode({ value, format, size }: BarcodeCodeProps) {
  const encoded = useMemo(() => {
    if (!value) return null;
    return encodeBarcodeMatrix(value, format == null ? null : String(format));
  }, [value, format]);

  if (!value) return null;

  if (encoded) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${encoded.width} ${encoded.height}`}>
        <Rect x={0} y={0} width={encoded.width} height={encoded.height} fill="#FFFFFF" />
        <Path d={encoded.path} fill="#000000" />
      </Svg>
    );
  }

  return <QRCode value={value} size={size} />;
}
