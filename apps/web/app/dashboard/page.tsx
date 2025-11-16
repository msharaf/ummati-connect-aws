"use client";

import { useEffect } from "react";
import { trpc } from "../../lib/trpcClient";
import { ProfileCard } from "../../components/profile-card";
import { useAuthStore } from "../../store/useAuthStore";

const demoUser = {
  id: "ckdemo-investor",
  fullName: "Demo Investor",
  role: "INVESTOR" as const
};

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setUser(demoUser);
    }
  }, [setUser, user]);

  const { data: recommendations } = trpc.matchmaking.getRecommendations.useQuery(
    { userId: user?.id ?? demoUser.id, limit: 6 },
    {
      enabled: Boolean(user?.id),
      staleTime: 1000 * 60
    }
  );

  const { data: matches } = trpc.matchmaking.getMatches.useQuery(
    { userId: user?.id ?? demoUser.id },
    { enabled: Boolean(user?.id), refetchInterval: 1000 * 30 }
  );

  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase text-emerald-700">
            Dashboard
          </span>
          <h1 className="text-3xl font-semibold text-charcoal">
            As-salaam, {user?.fullName ?? demoUser.fullName}
          </h1>
          <p className="text-sm text-charcoal/70">
            Discover visionaries aligned with your halal mandates. Swipe to
            connect, monitor matches, and nurture relationships.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-charcoal">Recommended</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Tailored by geography, industry thesis, and barakah resonance.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations?.map((profile) => (
              <ProfileCard
                key={profile.id}
                type={profile.type === "INVESTOR" ? "INVESTOR" : "VISIONARY"}
                name={profile.fullName}
                location={[profile.city, profile.country].filter(Boolean).join(", ")}
                industries={profile.industries}
                barakahScore={
                  profile.visionaryProfile?.barakahScore ??
                  profile.investorProfile?.barakahScore ??
                  undefined
                }
              />
            ))}
            {!recommendations?.length && (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-6 text-sm text-charcoal/60">
                No recommendations yet. Complete your profile and check again soon.
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-charcoal">Matches</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Mutual right swipes appear here with quick access to diligence tools.
          </p>
          <div className="mt-6 space-y-4">
            {matches?.map((match) => {
              const counterpart =
                match.investorId === (user?.id ?? demoUser.id)
                  ? match.visionary
                  : match.investor;
              return (
                <div
                  key={match.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      {match.status === "ACTIVE" ? "Active Match" : match.status}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-charcoal">
                      {counterpart.fullName}
                    </h3>
                    <p className="text-sm text-charcoal/70">
                      {counterpart.industries.join(" • ")}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900">
                      View Workspace
                    </button>
                    <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-emerald-600/30 transition hover:bg-emerald-700">
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
            {!matches?.length && (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-6 text-sm text-charcoal/60">
                Start swiping to create your first match infused with barakah.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

