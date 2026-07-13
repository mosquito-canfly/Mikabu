import Image from "next/image";

export default function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-ink">
      <Image
        src="/logo.png"
        alt=""
        width={500}
        height={500}
        priority
        className="h-[0.8em] w-[0.8em] shrink-0 object-contain"
      />
      Mikabu
    </span>
  );
}
