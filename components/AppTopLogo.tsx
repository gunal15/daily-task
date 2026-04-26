import Image from "next/image";
import appTopLogo from "@/app/assets/app-top-logo-cropped.png";

interface AppTopLogoProps {
  width?: number;
}

export default function AppTopLogo({ width = 96 }: AppTopLogoProps) {
  const height = Math.round(width / 2.65);

  return (
    <Image
      src={appTopLogo}
      alt="Daily Tasks"
      width={width}
      height={height}
      priority
      style={{
        display: "block",
        width: `${width}px`,
        height: "auto",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}
