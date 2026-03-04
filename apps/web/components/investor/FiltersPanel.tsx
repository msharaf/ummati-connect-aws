"use client";

import { useState } from "react";
import { StartupStage } from "@ummati/db";
import { trpc } from "../../src/lib/trpc";

export type HalalCategoryFilter = "halal" | "grey" | "forbidden" | null;

export interface Filters {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-charcoal/70">Loading filters...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-charcoal">Filters</h2>
        <button
          onClick={handleReset}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Reset
        </button>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Search</label>
        <input
          type="text"
          value={filters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value || null)}
          placeholder="Search startups, founders..."
          className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Sector */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Sector</label>
        <select
          value={filters.sector || ""}
          onChange={(e) => handleFilterChange("sector", e.target.value || null)}
          className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Sectors</option>
          {filterOptions?.sectors.map((sector) => (
            <option key={sector ?? ""} value={sector ?? ""}>
              {sector ?? "Unknown"}
            </option>
          ))}
        </select>
      </div>

      {/* Startup Stage */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Stage</label>
        <select
          value={filters.stage || ""}
          onChange={(e) =>
            handleFilterChange("stage", (e.target.value as StartupStage) || null)
          }
          className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Stages</option>
          {filterOptions?.stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">Location</label>
        <select
          value={filters.location || ""}
          onChange={(e) => handleFilterChange("location", e.target.value || null)}
          className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Locations</option>
          {filterOptions?.locations.map((location) => (
            <option key={location ?? ""} value={location ?? ""}>
              {location ?? "Unknown"}
            </option>
          ))}
        </select>
      </div>

      {/* Halal Category */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">
          Halal Category
        </label>
        <select
          value={filters.halalCategory || ""}
          onChange={(e) => {
            const v = e.target.value || null;
            handleFilterChange("halalCategory", v as HalalCategoryFilter);
          }}
          className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {filterOptions?.halalCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Barakah Score Slider */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">
          Min Barakah Score: {filters.minBarakah}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={filters.minBarakah}
          onChange={(e) => handleFilterChange("minBarakah", parseInt(e.target.value))}
          className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-charcoal/60 mt-1">
          <span>1</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}

