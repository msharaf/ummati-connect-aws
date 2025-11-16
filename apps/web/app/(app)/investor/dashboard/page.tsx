"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StartupStage } from "@ummati/db";
import { trpc } from "../../../../src/lib/trpc";
import { FiltersPanel } from "../../../../components/investor/FiltersPanel";
import { VisionaryCard } from "../../../../components/investor/VisionaryCard";
import { VisionaryDetails } from "../../../../components/investor/VisionaryDetails";

interface Filters {
  sector: string | null;
  location: string | null;
  halalCategory: string | null;
  minBarakah: number;
  stage: StartupStage | null;
  search: string | null;
}

export default function InvestorDashboardPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({
    sector: null,
    location: null,
    halalCategory: null,
    minBarakah: 1,
    stage: null,
    search: null
  });
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Check if investor has accepted halal terms
  const { data: investorProfile, isLoading: isLoadingProfile } =
    trpc.investor.getMyProfile.useQuery();

  // Redirect if halal terms not accepted
  useEffect(() => {
    if (!isLoadingProfile && investorProfile && !investorProfile.hasAcceptedHalalTerms) {
      router.push("/investor/halal-pledge");
    }
  }, [investorProfile, isLoadingProfile, router]);

  // Browse visionaries with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = trpc.investor.browseVisionaries.useInfiniteQuery(
    {
      sector: filters.sector,
      location: filters.location,
      halalCategory: filters.halalCategory,
      minBarakah: filters.minBarakah,
      stage: filters.stage,
      search: filters.search,
      limit: 20
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
    }
  );

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const profiles = data?.pages.flatMap((page) => page.profiles) ?? [];

  // Show loading while checking profile
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Block access if halal terms not accepted
  if (investorProfile && !investorProfile.hasAcceptedHalalTerms) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to halal compliance pledge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Investor Dashboard</h1>
          <p className="text-charcoal/70">
            Browse and discover visionary founders aligned with your values
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_400px] gap-4">
          {/* Left Column - Filters */}
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <FiltersPanel filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Middle Column - Visionary Cards */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-charcoal/70">Loading visionaries...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-charcoal/70 mb-2">No visionaries found</p>
                <p className="text-sm text-charcoal/50">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profiles.map((profile) => (
                    <VisionaryCard
                      key={profile.id}
                      profile={profile}
                      onSelect={setSelectedProfileId}
                    />
                  ))}
                </div>

                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="h-4" />

                {/* Loading More Indicator */}
                {isFetchingNextPage && (
                  <div className="text-center py-4">
                    <p className="text-charcoal/70">Loading more...</p>
                  </div>
                )}

                {/* End of Results */}
                {!hasNextPage && profiles.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-charcoal/50 text-sm">
                      You've reached the end of results
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Details Drawer */}
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
            <VisionaryDetails
              profileId={selectedProfileId}
              onClose={() => setSelectedProfileId(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

