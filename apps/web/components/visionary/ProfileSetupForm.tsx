"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StartupStage } from "@ummati/db";
import { trpc } from "../../src/lib/trpc";

interface FormData {
  startupName: string;
  tagline: string;
  pitch: string;
  sector: string;
  startupStage: StartupStage;
  location: string;
  fundingAsk: string;
  websiteUrl: string;
  logoUrl: string;
  teamSize: string;
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
  "AI & Automation",
  "Marketplace",
  "Crypto/Blockchain",
  "Social Media",
  "Other"
];

export function ProfileSetupForm() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Fetch existing profile
  const { data: existingProfile, isLoading: isLoadingProfile } =
    trpc.visionary.getMyProfile.useQuery();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    startupName: "",
    tagline: "",
    pitch: "",
    sector: "",
    startupStage: "IDEA",
    location: "",
    fundingAsk: "",
    websiteUrl: "",
    logoUrl: "",
    teamSize: ""
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Pre-fill form if profile exists
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        startupName: existingProfile.startupName || "",
        tagline: existingProfile.tagline || "",
        pitch: existingProfile.pitch || "",
        sector: existingProfile.sector || "",
        startupStage: existingProfile.startupStage,
        location: existingProfile.location || "",
        fundingAsk: existingProfile.fundingAsk?.toString() || "",
        websiteUrl: existingProfile.websiteUrl || "",
        logoUrl: existingProfile.logoUrl || "",
        teamSize: existingProfile.teamSize?.toString() || ""
      });
    }
  }, [existingProfile]);

  // Mutation
  const mutation = trpc.visionary.saveProfileDetails.useMutation({
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
    if (formData.tagline.length > 100) {
      newErrors.tagline = "Tagline must be less than 100 characters";
    }
    if (!formData.sector.trim()) {
      newErrors.sector = "Sector is required";
    }
    if (formData.pitch.length > 2000) {
      newErrors.pitch = "Pitch must be less than 2000 characters";
    }
    if (formData.fundingAsk && (isNaN(Number(formData.fundingAsk)) || Number(formData.fundingAsk) < 0)) {
      newErrors.fundingAsk = "Funding ask must be a positive number";
    }
    if (formData.teamSize && (isNaN(Number(formData.teamSize)) || Number(formData.teamSize) < 1 || Number(formData.teamSize) > 10000)) {
      newErrors.teamSize = "Team size must be between 1 and 10,000";
    }
    if (formData.websiteUrl && formData.websiteUrl.trim() !== "") {
      try {
        new URL(formData.websiteUrl);
      } catch {
        newErrors.websiteUrl = "Please enter a valid URL";
      }
    }
    if (formData.logoUrl && formData.logoUrl.trim() !== "") {
      try {
        new URL(formData.logoUrl);
      } catch {
        newErrors.logoUrl = "Please enter a valid URL";
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
      tagline: formData.tagline.trim() || undefined,
      pitch: formData.pitch.trim() || undefined,
      sector: formData.sector.trim(),
      startupStage: formData.startupStage,
      location: formData.location.trim() || undefined,
      fundingAsk: formData.fundingAsk ? Number(formData.fundingAsk) : undefined,
      websiteUrl: formData.websiteUrl.trim() || undefined,
      logoUrl: formData.logoUrl.trim() || undefined,
      teamSize: formData.teamSize ? Number(formData.teamSize) : undefined
    });
  };

  const handleChange = (
    field: keyof FormData,
    value: string | StartupStage
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section A: Basic Information */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
          Basic Information
        </h2>

        <div className="space-y-4">
          {/* Startup Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startup Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.startupName}
              onChange={(e) => handleChange("startupName", e.target.value)}
              placeholder="Your startup's name"
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={50}
            />
            {errors.startupName && (
              <p className="mt-1 text-sm text-red-600">{errors.startupName}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.startupName.length}/50
            </p>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              placeholder="A short, memorable tagline for your startup"
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={100}
            />
            {errors.tagline && (
              <p className="mt-1 text-sm text-red-600">{errors.tagline}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.tagline.length}/100
            </p>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => handleChange("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.logoUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.logoUrl}</p>
            )}
            {formData.logoUrl && (
              <div className="mt-2">
                <Image
                  src={formData.logoUrl}
                  alt="Logo preview"
                  width={100}
                  height={100}
                  className="rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Sector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sector <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sector}
              onChange={(e) => handleChange("sector", e.target.value)}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select a sector...</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startup Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.startupStage}
              onChange={(e) => handleChange("startupStage", e.target.value as StartupStage)}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

      {/* Section B: Pitch & Description */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
          Pitch & Description
        </h2>

        <div className="space-y-4">
          {/* Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch
            </label>
            <textarea
              value={formData.pitch}
              onChange={(e) => handleChange("pitch", e.target.value)}
              placeholder="Describe your startup, what problem it solves, and why investors should be interested..."
              rows={6}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={2000}
            />
            {errors.pitch && (
              <p className="mt-1 text-sm text-red-600">{errors.pitch}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.pitch.length}/2000
            </p>
          </div>
        </div>
      </div>

      {/* Section C: Business Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
          Business Details
        </h2>

        <div className="space-y-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g., San Francisco, CA or Dubai, UAE"
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Team Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Size
            </label>
            <input
              type="number"
              value={formData.teamSize}
              onChange={(e) => handleChange("teamSize", e.target.value)}
              placeholder="Number of team members"
              min="1"
              max="10000"
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.teamSize && (
              <p className="mt-1 text-sm text-red-600">{errors.teamSize}</p>
            )}
          </div>

          {/* Funding Ask */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funding Ask (USD)
            </label>
            <input
              type="number"
              value={formData.fundingAsk}
              onChange={(e) => handleChange("fundingAsk", e.target.value)}
              placeholder="e.g., 500000"
              min="0"
              max="100000000"
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.fundingAsk && (
              <p className="mt-1 text-sm text-red-600">{errors.fundingAsk}</p>
            )}
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleChange("websiteUrl", e.target.value)}
              placeholder="https://www.yourstartup.com"
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.websiteUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className={`flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors ${
            mutation.isPending
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-emerald-700"
          }`}
        >
          {mutation.isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}

