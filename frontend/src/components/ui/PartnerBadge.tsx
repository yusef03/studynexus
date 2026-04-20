import Image from "next/image";

export function PartnerBadge() {
  return (
    <div className="flex items-center justify-center gap-3 mt-8 opacity-50">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        In Kooperation mit
      </span>
      <Image
        src="/images/hsh-logo.svg"
        alt="Hochschule Hannover"
        width={140}
        height={48}
        className="h-12 w-auto grayscale"
        unoptimized
      />
    </div>
  );
}
