interface ScreenshotPlaceholderProps {
  title: string;
  description: string;
}

export function ScreenshotPlaceholder({
  title,
  description
}: ScreenshotPlaceholderProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-8 aspect-[9/16] flex flex-col items-center justify-center border-2 border-emerald-200 shadow-lg">
      <div className="w-full h-full bg-white/50 rounded-2xl flex flex-col items-center justify-center gap-4">
        <div className="w-24 h-24 rounded-full bg-emerald-200 flex items-center justify-center">
          <span className="text-4xl">📱</span>
        </div>
        <h4 className="text-lg font-semibold text-charcoal">{title}</h4>
        <p className="text-sm text-charcoal/60 text-center px-4">{description}</p>
      </div>
    </div>
  );
}

