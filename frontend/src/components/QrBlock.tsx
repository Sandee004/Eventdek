import { QRCodeSVG } from "qrcode.react";

export function QrBlock({
  value,
  size = 132,
}: {
  value: string;
  size?: number;
}) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      bgColor="transparent"
      fgColor="currentColor"
      className="rounded bg-background text-foreground"
    />
  );
}
