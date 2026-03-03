"use client";

import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import type { StartupStage } from "@ummati/db/types";
import { FiltersPanel } from "../../../src/features/investor/FiltersPanel";
import { VisionaryList, type HalalCategoryFilter } from "../../../src/features/investor/VisionaryList";
import { trpc } from "../../../src/lib/trpc";

interface Filters {
  sector: string | null;
  location: string | null;
  halalCategory: HalalCategoryFilter;
  minBarakah: number;
  stage: StartupStage | null;
  search: string | null;
}

export default function InvestorDashboardTab() {
  const router = useRouter();
  const { data: userData } = trpc.user.me.useQuery(undefined, { retry: false });

  // Redirect to setup when onboarding incomplete - from within tabs so REPLACE is handled
  useEffect(() => {
    if (!userData) return;
    const needsSetup = userData.role === "INVESTOR" && !(userData.onboardingComplete ?? false);
    if (needsSetup) {
      const t = setTimeout(() => router.replace("/(tabs)/investor/setup"), 0);
      return () => clearTimeout(t);
    }
  }, [userData, router]);

  const [filters, setFilters] = useState<Filters>({
    sector: null,
    location: null,
    halalCategory: null,
    minBarakah: 1,
    stage: null,
    search: null
  });

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[Investor] Screen rendered");
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-emerald-600 px-4 py-3">
        <Text className="text-2xl font-bold text-white mb-1">✅ INVESTOR HOME LOADED</Text>
        <Text className="text-emerald-100 text-sm">
          Discover visionary founders aligned with your values
        </Text>
      </View>

      {/* Filters */}
      <FiltersPanel filters={filters} onFiltersChange={setFilters} />

      {/* Visionary List */}
      <View className="flex-1">
        <VisionaryList filters={filters} />
      </View>
    </View>
  );
}

