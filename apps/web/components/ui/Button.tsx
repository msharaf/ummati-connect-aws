import Link from "next/link";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
}

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  onClick
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl";
  
  const variantClasses = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-gold text-charcoal hover:bg-yellow-500",
    outline: "bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

