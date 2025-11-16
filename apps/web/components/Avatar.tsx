import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 72
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizePx = sizeMap[size];
  const initials = getInitials(name);

  if (src) {
    return (
      <div className={`relative flex-shrink-0 ${className}`}>
        <Image
          src={src}
          alt={name || "User avatar"}
          width={sizePx}
          height={sizePx}
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-emerald-600 text-white font-semibold flex-shrink-0 ${className}`}
      style={{ width: sizePx, height: sizePx }}
    >
      <span style={{ fontSize: sizePx * 0.4 }}>{initials}</span>
    </div>
  );
}

