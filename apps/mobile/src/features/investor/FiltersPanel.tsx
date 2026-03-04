"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView
} from "react-native";
import type { StartupStage } from "@ummati/db/types";
import { trpc } from "../../lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import type { HalalCategoryFilter } from "./VisionaryList";

interface Filters {
  sector: string | null;
  location: string | null;
  halalCategory: HalalCategoryFilter;
  minBarakah: number;
  stage: StartupStage | null;
  search: string | null;
}

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function FiltersPanel({ filters, onFiltersChange }: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: filterOptions, isLoading } = trpc.investor.getFilterOptions.useQuery();

  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      sector: null,
      location: null,
      halalCategory: null,
      minBarakah: 1,
      stage: null,
      search: null
    });
  };

  const activeFiltersCount =
    (filters.sector ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.halalCategory ? 1 : 0) +
    (filters.stage ? 1 : 0) +
    (filters.minBarakah > 1 ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <>
      {/* Collapsed Header */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        className="bg-white border-b border-gray-200 p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="filter" size={20} color="#047857" />
          <Text className="font-semibold text-gray-900">Filters</Text>
          {activeFiltersCount > 0 && (
            <View className="bg-emerald-600 rounded-full px-2 py-0.5">
              <Text className="text-white text-xs font-bold">{activeFiltersCount}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6b7280"
        />
      </TouchableOpacity>

      {/* Expanded Filters */}
      {isExpanded && (
        <View className="bg-white border-b border-gray-200 p-4">
          <ScrollView showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <Text className="text-gray-500 text-center py-4">Loading filters...</Text>
            ) : (
              <View className="space-y-4">
                {/* Search */}
                <View>
                  <Text className="text-sm font-medium text-gray-900 mb-2">Search</Text>
                  <TextInput
                    value={filters.search || ""}
                    onChangeText={(text) => handleFilterChange("search", text || null)}
                    placeholder="Search startups, founders..."
                    className="bg-gray-50 border border-emerald-200 rounded-lg px-3 py-2 text-gray-900"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Sector */}
                <View>
                  <Text className="text-sm font-medium text-gray-900 mb-2">Sector</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleFilterChange("sector", null)}
                        className={`px-4 py-2 rounded-full ${
                          !filters.sector
                            ? "bg-emerald-600"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            !filters.sector ? "text-white" : "text-gray-700"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {filterOptions?.sectors.map((sector) => sector == null ? null : (
                        <TouchableOpacity
                          key={sector}
                          onPress={() => handleFilterChange("sector", sector)}
                          className={`px-4 py-2 rounded-full ${
                            filters.sector === sector
                              ? "bg-emerald-600"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              filters.sector === sector ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {sector}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Stage */}
                <View>
                  <Text className="text-sm font-medium text-gray-900 mb-2">Stage</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleFilterChange("stage", null)}
                        className={`px-4 py-2 rounded-full ${
                          !filters.stage ? "bg-emerald-600" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            !filters.stage ? "text-white" : "text-gray-700"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {filterOptions?.stages.map((stage: string) => (
                        <TouchableOpacity
                          key={stage}
                          onPress={() => handleFilterChange("stage", stage as StartupStage)}
                          className={`px-4 py-2 rounded-full ${
                            filters.stage === stage ? "bg-emerald-600" : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              filters.stage === stage ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {stage}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Location */}
                <View>
                  <Text className="text-sm font-medium text-gray-900 mb-2">Location</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleFilterChange("location", null)}
                        className={`px-4 py-2 rounded-full ${
                          !filters.location ? "bg-emerald-600" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            !filters.location ? "text-white" : "text-gray-700"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {filterOptions?.locations.map((location) => location == null ? null : (
                        <TouchableOpacity
                          key={location}
                          onPress={() => handleFilterChange("location", location)}
                          className={`px-4 py-2 rounded-full ${
                            filters.location === location
                              ? "bg-emerald-600"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              filters.location === location ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {location}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Halal Category */}
                <View>
                  <Text className="text-sm font-medium text-gray-900 mb-2">
                    Halal Category
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleFilterChange("halalCategory", null)}
                        className={`px-4 py-2 rounded-full ${
                          !filters.halalCategory ? "bg-emerald-600" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            !filters.halalCategory ? "text-white" : "text-gray-700"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {filterOptions?.halalCategories.map((category: string) => (
                        <TouchableOpacity
                          key={category}
                          onPress={() =>
                            handleFilterChange(
                              "halalCategory",
                              category as HalalCategoryFilter
                            )
                          }
                          className={`px-4 py-2 rounded-full ${
                            filters.halalCategory === category
                              ? "bg-emerald-600"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              filters.halalCategory === category
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Barakah Score */}
                <View>
                  <Text className="text-sm font-medium text-gray-900 mb-2">
                    Min Barakah Score: {filters.minBarakah}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-xs text-gray-500">1</Text>
                    <View className="flex-1 h-2 bg-gray-200 rounded-full">
                      <View
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${((filters.minBarakah - 1) / 9) * 100}%` }}
                      />
                    </View>
                    <Text className="text-xs text-gray-500">10</Text>
                  </View>
                  <View className="flex-row justify-between mt-2">
                    {[1, 3, 5, 7, 10].map((value) => (
                      <TouchableOpacity
                        key={value}
                        onPress={() => handleFilterChange("minBarakah", value)}
                        className={`px-3 py-1 rounded-full ${
                          filters.minBarakah === value
                            ? "bg-emerald-600"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            filters.minBarakah === value ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Reset Button */}
                {activeFiltersCount > 0 && (
                  <TouchableOpacity
                    onPress={handleReset}
                    className="mt-4 bg-gray-100 py-3 rounded-lg"
                  >
                    <Text className="text-center text-gray-700 font-semibold">
                      Reset Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </>
  );
}

