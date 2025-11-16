import { ReactNode } from "react";

interface ValueCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export function ValueCard({ title, description, icon }: ValueCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100">
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-bold text-charcoal mb-2">{title}</h4>
      <p className="text-charcoal/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

