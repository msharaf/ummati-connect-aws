import { ReactNode } from "react";

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: ReactNode;
}

export function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold">
          {number}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
      <h3 className="text-2xl font-bold text-charcoal mb-3">{title}</h3>
      <p className="text-charcoal/70 leading-relaxed">{description}</p>
    </div>
  );
}

