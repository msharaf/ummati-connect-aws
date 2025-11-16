import clsx from "clsx";

type ProfileType = "INVESTOR" | "VISIONARY";

type Props = {
  type: ProfileType;
  name: string;
  location: string;
  industries: string[];
  barakahScore?: number | null;
  highlight?: boolean;
};

const badgeColors: Record<ProfileType, string> = {
  INVESTOR: "bg-emerald-100 text-emerald-800",
  VISIONARY: "bg-gold-100 text-gold-800"
};

export function ProfileCard({
  type,
  name,
  location,
  industries,
  barakahScore,
  highlight
}: Props) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg",
        highlight && "border-emerald-300"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            badgeColors[type]
          )}
        >
          {type.toLowerCase()}
        </span>
        {barakahScore !== undefined && barakahScore !== null && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Barakah {barakahScore}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-charcoal">{name}</h3>
      <p className="text-sm text-emerald-800/80">{location}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {industries.map((industry) => (
          <span
            key={industry}
            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
          >
            {industry}
          </span>
        ))}
      </div>
    </div>
  );
}

