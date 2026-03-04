"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StartupStage } from "@ummati/db";
import { trpc } from "../../src/lib/trpc";

interface FormData {
  startupName: string;
  description: string;
  pitch: string;
  sector: string;
  startupStage: StartupStage;
  location: string;
  fundingNeeded: string;
  websiteUrl: string;
  barakahScore: number;
}

const STARTUP_STAGES: StartupStage[] = ["IDEA", "MVP", "TRACTION", "SCALING"];

const COMMON_SECTORS = [
  "FinTech",
  "EdTech",
  "HealthTech",
  "Food & Beverage",
  "E-commerce",
  "SaaS",
  "Real Estate",
  "Travel & Tourism",
  "Media & Entertainment",
  "Other"
];

export function SetupForm() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Fetch existing profile
  const { data: existingProfile, isLoading: isLoadingProfile } =
    trpc.visionary.getMyProfile.useQuery();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    startupName: "",
    description: "",
    pitch: "",
    sector: "",
    startupStage: "IDEA",
    location: "",
    fundingNeeded: "",
    websiteUrl: "",
    barakahScore: 5
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Pre-fill form if profile exists
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        startupName: existingProfile.startupName || "",
        description: existingProfile.description || "",
        pitch: existingProfile.pitch || "",
        sector: existingProfile.sector || "",
        startupStage: existingProfile.startupStage ?? "IDEA",
        location: existingProfile.location || "",
        fundingNeeded: existingProfile.fundingNeeded?.toString() || "",
        websiteUrl: existingProfile.websiteUrl || "",
        barakahScore: existingProfile.barakahScore || 5
      });
    }
  }, [existingProfile]);

  // Mutation
  const mutation = trpc.visionary.createOrUpdateProfile.useMutation({
    onSuccess: () => {
      utils.visionary.getMyProfile.invalidate();
      utils.visionaryDashboard.getOverviewStats.invalidate();
      utils.visionaryDashboard.getProfileCompleteness.invalidate();
      // Redirect to visionary dashboard
      router.push("/visionary/dashboard");
    },
    onError: (error) => {
      setErrors({ startupName: error.message });
    }
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.startupName.trim() || formData.startupName.length < 2) {
      newErrors.startupName = "Startup name must be at least 2 characters";
    }
    if (formData.startupName.length > 50) {
      newErrors.startupName = "Startup name must be less than 50 characters";
    }
    if (!formData.sector.trim()) {
      newErrors.sector = "Sector is required";
    }
    if (formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }
    if (formData.pitch.length > 2000) {
      newErrors.pitch = "Pitch must be less than 2000 characters";
    }
    if (formData.fundingNeeded && (isNaN(Number(formData.fundingNeeded)) || Number(formData.fundingNeeded) < 0)) {
      newErrors.fundingNeeded = "Funding ask must be a positive number";
    }
    if (formData.websiteUrl && formData.websiteUrl.trim() !== "") {
      try {
        new URL(formData.websiteUrl);
      } catch {
        newErrors.websiteUrl = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    mutation.mutate({
      startupName: formData.startupName.trim(),
      description: formData.description.trim() || undefined,
      pitch: formData.pitch.trim() || undefined,
      sector: formData.sector.trim(),
      startupStage: formData.startupStage,
      location: formData.location.trim() || undefined,
      fundingNeeded: formData.fundingNeeded ? Number(formData.fundingNeeded) : undefined,
      websiteUrl: formData.websiteUrl.trim() || undefined
    });
  };

  const handleChange = (
    field: keyof FormData,
    value: string | number | StartupStage
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-charcoal/70">Loading your profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section A: Basic Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-charcoal mb-4 pb-2 border-b border-emerald-200">
          Basic Information
        </h2>

        <div className="space-y-4">
          {/* Startup Name */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Startup Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.startupName}
              onChange={(e) => handleChange("startupName", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.startupName ? "border-red-300" : "border-emerald-200"
              }`}
              placeholder="e.g., HalalPay"
              required
              minLength={2}
              maxLength={50}
            />
            {errors.startupName && (
              <p className="mt-1 text-sm text-red-600">{errors.startupName}</p>
            )}
            <p className="mt-1 text-xs text-charcoal/60">
              {formData.startupName.length}/50 characters
            </p>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Sector <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sector}
              onChange={(e) => handleChange("sector", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.sector ? "border-red-300" : "border-emerald-200"
              }`}
              required
            >
              <option value="">Select a sector</option>
              {COMMON_SECTORS.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
            {errors.sector && (
              <p className="mt-1 text-sm text-red-600">{errors.sector}</p>
            )}
          </div>

          {/* Startup Stage */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Startup Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.startupStage}
              onChange={(e) => handleChange("startupStage", e.target.value as StartupStage)}
              className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              {STARTUP_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section B: Story & Pitch */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-charcoal mb-4 pb-2 border-b border-emerald-200">
          Story & Pitch
        </h2>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.description ? "border-red-300" : "border-emerald-200"
              }`}
              placeholder="A short description of your startup (max 500 characters)"
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-charcoal/60">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Pitch
            </label>
            <textarea
              value={formData.pitch}
              onChange={(e) => handleChange("pitch", e.target.value)}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.pitch ? "border-red-300" : "border-emerald-200"
              }`}
              placeholder="Your full pitch to investors (max 2000 characters)"
              maxLength={2000}
            />
            {errors.pitch && (
              <p className="mt-1 text-sm text-red-600">{errors.pitch}</p>
            )}
            <p className="mt-1 text-xs text-charcoal/60">
              {formData.pitch.length}/2000 characters
            </p>
          </div>
        </div>
      </div>

      {/* Section C: Business Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-charcoal mb-4 pb-2 border-b border-emerald-200">
          Business Details
        </h2>

        <div className="space-y-4">
          {/* Funding Ask */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Funding Ask (USD)
            </label>
            <input
              type="number"
              value={formData.fundingNeeded}
              onChange={(e) => handleChange("fundingNeeded", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.fundingNeeded ? "border-red-300" : "border-emerald-200"
              }`}
              placeholder="e.g., 100000"
              min={0}
              max={100000000}
            />
            {errors.fundingNeeded && (
              <p className="mt-1 text-sm text-red-600">{errors.fundingNeeded}</p>
            )}
            {formData.fundingNeeded && (
              <p className="mt-1 text-xs text-charcoal/60">
                ${Number(formData.fundingNeeded).toLocaleString()}
              </p>
            )}
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleChange("websiteUrl", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.websiteUrl ? "border-red-300" : "border-emerald-200"
              }`}
              placeholder="https://yourstartup.com"
            />
            {errors.websiteUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section D: Location & Values */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-charcoal mb-4 pb-2 border-b border-emerald-200">
          Location & Values
        </h2>

        <div className="space-y-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., San Francisco, CA or Dubai, UAE"
            />
          </div>

          {/* Barakah Score */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Barakah Score: {formData.barakahScore}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.barakahScore}
              onChange={(e) => handleChange("barakahScore", parseInt(e.target.value))}
              className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-charcoal/60 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
            <p className="mt-2 text-sm text-charcoal/70">
              This score reflects how aligned your startup is with Islamic values and
              principles.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending
            ? "Saving..."
            : existingProfile
            ? "Update Profile"
            : "Create Profile"}
        </button>
        {existingProfile && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

