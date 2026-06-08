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
        src="/logo.png"           // public/logo.png (the 512x512 version)
        alt="StudySync"
        width={size}
        height={size}
        className="rounded-xl"   // matches the rounded rect of the original
        priority                 // preload on every page (it's in the nav)
      />
      {showText && (
        <span className="font-bold text-lg tracking-tight text-white font-heading">
          StudySync
        </span>
      )}
    </div>
  );
}
