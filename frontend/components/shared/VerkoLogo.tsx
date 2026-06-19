"use client";
import Image from "next/image";


export function VerkoWordMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Verko"
      height={size * 2}
      width={size * 6}
      style={{ objectFit: "contain", height: size, width: "auto" }}
      priority
    />
  );
}


export function VerkoLoader() {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="vk-loader-pulse">
        <Image
          src="/onlyLogo.png"
          alt="Verko"
          height={64}
          width={64}
          style={{ objectFit: "contain", height: 64, width: 64 }}
          priority
        />
      </div>

      <style>{`
        @keyframes vk-pulse {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%      { transform: scale(0.88); opacity: 0.55; }
        }
        .vk-loader-pulse {
          animation: vk-pulse 1.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}