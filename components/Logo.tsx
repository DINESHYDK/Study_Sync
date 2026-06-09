
import Image from "next/image";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 36, showText = true, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/logo.png"
        alt="StudySync"
        width={size}
        height={size}
        className="rounded-xl"
        priority
      />
      {showText && (
        <span className="font-bold text-lg tracking-tight text-white font-heading">
          StudySync
        </span>
      )}
    </div>
  );
}
