"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../src/lib/trpc";

interface QuestionnaireData {
  industry: string;
  q1: string; // Primary business activity
  q2: string; // Business model description
  q3: boolean; // Handle user money
  q4: string; // Interest-bearing products
  q5: string; // Interest-based revenue
  q6: string; // Compliance measures
  q7: boolean; // Risk of misuse
  q8: string; // Additional notes
}

const COMMON_INDUSTRIES = [
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

const HARAM_CATEGORIES = [
  "Alcohol",
  "Gambling",
  "Adult Content",
  "Cannabis",
  "Weapons",
  "Interest-based Lending",
  "Pyramid Schemes"
];

export function HalalVerificationForm() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<QuestionnaireData>({
    industry: "",
    q1: "",
    q2: "",
    q3: false,
    q4: "",
    q5: "",
    q6: "",
    q7: false,
    q8: ""
  });

  const [haramCategories, setHaramCategories] = useState<string[]>([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof QuestionnaireData | "haramCategories" | "declaration", string>>>({});

  const mutation = trpc.visionary.verifyHalalCompliance.useMutation({
    onSuccess: (result) => {
      utils.visionary.getMyProfile.invalidate();

      if (result.status === "approved") {
        // Redirect to setup page
        router.push("/visionary/setup");
      } else {
        // For flagged or rejected, reload the page to show status message
        // The page component will handle displaying the appropriate message
        window.location.reload();
      }
    },
    onError: (error) => {
      setErrors({ industry: error.message });
    }
  });

  const handleChange = (
    field: keyof QuestionnaireData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleHaramCategoryToggle = (category: string) => {
    setHaramCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    if (errors.haramCategories) {
      setErrors((prev) => ({ ...prev, haramCategories: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.industry.trim()) {
      newErrors.industry = "Industry is required";
    }
    if (!formData.q1.trim()) {
      newErrors.q1 = "Primary business activity is required";
    }
    if (!formData.q2.trim()) {
      newErrors.q2 = "Business model description is required";
    }
    if (formData.q3 && !formData.q6.trim()) {
      newErrors.q6 = "Please describe your compliance measures if you handle user money";
    }
    if (!declarationAccepted) {
      newErrors.declaration = "You must accept the halal compliance declaration";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Prepare responses object
    const responses = {
      q1: formData.q1.trim(),
      q2: formData.q2.trim(),
      q3: formData.q3,
      q4: formData.q4.trim() || undefined,
      q5: formData.q5.trim() || undefined,
      q6: formData.q6.trim() || undefined,
      q7: formData.q7,
      q8: formData.q8.trim() || undefined,
      haramCategories: haramCategories.length > 0 ? haramCategories : undefined
    };

    mutation.mutate({
      industry: formData.industry.trim(),
      responses
    });
  };

  const isGreyArea = formData.industry.toLowerCase().includes("fintech") ||
    formData.industry.toLowerCase().includes("crypto") ||
    formData.industry.toLowerCase().includes("ai") ||
    formData.industry.toLowerCase().includes("automation") ||
    formData.industry.toLowerCase().includes("marketplace") ||
    formData.industry.toLowerCase().includes("social");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section A: Industry Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
          Section A: Industry Selection
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Industry <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Choose an industry...</option>
              {COMMON_INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Business Activity <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.q1}
              onChange={(e) => handleChange("q1", e.target.value)}
              placeholder="Describe your primary business activity in detail..."
              rows={3}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.q1 && (
              <p className="mt-1 text-sm text-red-600">{errors.q1}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Model Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.q2}
              onChange={(e) => handleChange("q2", e.target.value)}
              placeholder="Explain how your business generates revenue..."
              rows={3}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.q2 && (
              <p className="mt-1 text-sm text-red-600">{errors.q2}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section B: Haram Category Check */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
          Section B: Haram Category Check
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Please confirm that your startup does NOT involve any of the following prohibited categories:
        </p>

        <div className="space-y-2">
          {HARAM_CATEGORIES.map((category) => (
            <label
              key={category}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={haramCategories.includes(category)}
                onChange={() => handleHaramCategoryToggle(category)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>

        {haramCategories.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              ⚠️ You have selected prohibited categories. Your application may be automatically rejected.
            </p>
          </div>
        )}
      </div>

      {/* Section C: Financial & Compliance Questions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
          Section C: Financial & Compliance Questions
        </h2>

        <div className="space-y-6">
          {/* Q3: Handle User Money */}
          <div>
            <label className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={formData.q3}
                onChange={(e) => handleChange("q3", e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Does your startup handle user money or process financial transactions?
              </span>
            </label>
            {formData.q3 && (
              <div className="mt-2">
                <textarea
                  value={formData.q6}
                  onChange={(e) => handleChange("q6", e.target.value)}
                  placeholder="Describe your compliance measures and safeguards..."
                  rows={3}
                  className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.q6 && (
                  <p className="mt-1 text-sm text-red-600">{errors.q6}</p>
                )}
              </div>
            )}
          </div>

          {/* Q4: Interest-bearing products */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you offer any interest-bearing products or services?
            </label>
            <textarea
              value={formData.q4}
              onChange={(e) => handleChange("q4", e.target.value)}
              placeholder="If yes, please explain. If no, please state 'No interest-bearing products'..."
              rows={2}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Q5: Interest-based revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Does your revenue model involve interest (riba) in any form?
            </label>
            <textarea
              value={formData.q5}
              onChange={(e) => handleChange("q5", e.target.value)}
              placeholder="If yes, please explain. If no, please state 'No interest-based revenue'..."
              rows={2}
              className="w-full bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Q7: Misuse risk */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.q7}
                onChange={(e) => handleChange("q7", e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Is there a risk that your product/service could be misused for haram purposes?
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Section D: Grey Area Clarifications (Conditional) */}
      {isGreyArea && (
        <div className="bg-amber-50 rounded-xl shadow-sm p-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-amber-300">
            Section D: Grey Area Clarifications
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <p className="text-sm text-gray-700 mb-3">
                Your selected industry may require additional review. Please provide additional context:
              </p>
              <textarea
                value={formData.q8}
                onChange={(e) => handleChange("q8", e.target.value)}
                placeholder="Explain how your startup ensures halal compliance despite operating in a grey area..."
                rows={4}
                className="w-full bg-gray-50 border border-amber-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Final Declaration */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
          Final Declaration
        </h2>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={declarationAccepted}
            onChange={(e) => {
              setDeclarationAccepted(e.target.checked);
              if (errors.declaration) {
                setErrors((prev) => ({ ...prev, declaration: undefined }));
              }
            }}
            className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">
              I declare that all information provided is accurate and truthful. I understand that
              providing false information may result in immediate rejection and account suspension.
              <span className="text-red-500">*</span>
            </span>
            {errors.declaration && (
              <p className="mt-1 text-sm text-red-600">{errors.declaration}</p>
            )}
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Verifying..." : "Submit for Verification"}
        </button>
      </div>
    </form>
  );
}

