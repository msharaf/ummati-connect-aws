"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../../src/lib/trpc";
import { BackButtonWeb } from "../../../../components/BackButtonWeb";

interface FormData {
  minTicketSize: string;
  maxTicketSize: string;
  preferredSectors: string[];
  geoFocus: string;
  investmentThesis: string;
}

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

export default function InvestorSetupPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Fetch existing profile
  const { data: existingProfile, isLoading: isLoadingProfile } =
    trpc.investorProfile.getMyInvestorProfile.useQuery();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    minTicketSize: "",
    maxTicketSize: "",
    preferredSectors: [],
    geoFocus: "",
    investmentThesis: ""
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Pre-fill form if profile exists
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        minTicketSize: existingProfile.minTicketSize?.toString() || "",
        maxTicketSize: existingProfile.maxTicketSize?.toString() || "",
        preferredSectors: existingProfile.preferredSectors || [],
        geoFocus: existingProfile.geoFocus || "",
        investmentThesis: existingProfile.investmentThesis || ""
      });
    }
  }, [existingProfile]);

  // Mutation
  const mutation = trpc.investorProfile.saveProfileDetails.useMutation({
    onSuccess: () => {
      utils.investorProfile.getMyInvestorProfile.invalidate();
      // Redirect to investor dashboard
      router.push("/investor/dashboard");
    },
    onError: (error) => {
      setErrors({ minTicketSize: error.message });
    }
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (formData.minTicketSize && isNaN(Number(formData.minTicketSize))) {
      newErrors.minTicketSize = "Minimum ticket size must be a number";
    }
    if (formData.minTicketSize && Number(formData.minTicketSize) < 0) {
      newErrors.minTicketSize = "Minimum ticket size must be positive";
    }
    if (formData.maxTicketSize && isNaN(Number(formData.maxTicketSize))) {
      newErrors.maxTicketSize = "Maximum ticket size must be a number";
    }
    if (formData.maxTicketSize && Number(formData.maxTicketSize) < 0) {
      newErrors.maxTicketSize = "Maximum ticket size must be positive";
    }
    if (
      formData.minTicketSize &&
      formData.maxTicketSize &&
      Number(formData.minTicketSize) > Number(formData.maxTicketSize)
    ) {
      newErrors.minTicketSize = "Minimum cannot be greater than maximum";
    }
    if (formData.investmentThesis.length > 2000) {
      newErrors.investmentThesis = "Investment thesis must be less than 2000 characters";
    }
    if (formData.geoFocus.length > 200) {
      newErrors.geoFocus = "Geographic focus must be less than 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    mutation.mutate({
      minTicketSize: formData.minTicketSize ? Number(formData.minTicketSize) : undefined,
      maxTicketSize: formData.maxTicketSize ? Number(formData.maxTicketSize) : undefined,
      preferredSectors: formData.preferredSectors,
      geoFocus: formData.geoFocus.trim() || undefined,
      investmentThesis: formData.investmentThesis.trim() || undefined
    });
  };

  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleSector = (sector: string) => {
    const current = formData.preferredSectors;
    const updated = current.includes(sector)
      ? current.filter((s) => s !== sector)
      : [...current, sector];
    handleChange("preferredSectors", updated);
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-8 relative">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <BackButtonWeb fallbackRoute="/investor/dashboard" />
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {existingProfile ? "Update Your Investor Profile" : "Complete Your Investor Profile"}
          </h1>
          <p className="text-gray-600">
            Tell us about your investment preferences and criteria
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Investment Criteria */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
              Investment Criteria
            </h2>

            <div className="space-y-4">
              {/* Ticket Size Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Ticket Size (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.minTicketSize}
                    onChange={(e) => handleChange("minTicketSize", e.target.value)}
                    placeholder="e.g., 10000"
                    min="0"
                    max="100000000"
                    className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.minTicketSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.minTicketSize}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Ticket Size (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.maxTicketSize}
                    onChange={(e) => handleChange("maxTicketSize", e.target.value)}
                    placeholder="e.g., 1000000"
                    min="0"
                    max="100000000"
                    className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.maxTicketSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxTicketSize}</p>
                  )}
                </div>
              </div>

              {/* Preferred Sectors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Sectors
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COMMON_SECTORS.map((sector) => (
                    <label
                      key={sector}
                      className="flex items-center cursor-pointer p-3 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredSectors.includes(sector)}
                        onChange={() => toggleSector(sector)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">{sector}</span>
                    </label>
                  ))}
                </div>
                {formData.preferredSectors.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected: {formData.preferredSectors.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Geographic & Investment Focus */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
              Geographic & Investment Focus
            </h2>

            <div className="space-y-4">
              {/* Geographic Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geographic Focus
                </label>
                <input
                  type="text"
                  value={formData.geoFocus}
                  onChange={(e) => handleChange("geoFocus", e.target.value)}
                  placeholder="e.g., MENA region, Southeast Asia, Global"
                  maxLength={200}
                  className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.geoFocus && (
                  <p className="mt-1 text-sm text-red-600">{errors.geoFocus}</p>
                )}
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formData.geoFocus.length}/200
                </p>
              </div>

              {/* Investment Thesis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Thesis
                </label>
                <textarea
                  value={formData.investmentThesis}
                  onChange={(e) => handleChange("investmentThesis", e.target.value)}
                  placeholder="Describe your investment philosophy, what you look for in startups, and your approach to supporting founders..."
                  rows={6}
                  maxLength={2000}
                  className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.investmentThesis && (
                  <p className="mt-1 text-sm text-red-600">{errors.investmentThesis}</p>
                )}
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formData.investmentThesis.length}/2000
                </p>
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
              {mutation.isPending ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

