import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../../src/lib/trpc";
import { BackButton } from "../../src/components/BackButton";

const HALAL_FOCUS_ERROR = "Complete HalalFocus verification first";

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

export default function InvestorSetupScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: userData } = trpc.user.me.useQuery(undefined, { retry: false });
  const halalFocusVerified = userData?.halalFocusVerified ?? false;
  const onboardingComplete = userData?.onboardingComplete ?? false;

  // Guard: if onboarding already complete, redirect to swipe (prevents bouncing)
  useEffect(() => {
    if (userData && onboardingComplete) {
      router.replace("/(tabs)/swipe");
    }
  }, [userData, onboardingComplete, router]);

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

  const mutation = trpc.investorProfile.saveProfileDetails.useMutation({
    onSuccess: async () => {
      await utils.investorProfile.getMyInvestorProfile.invalidate();
      await utils.user.me.invalidate();
      router.replace("/(tabs)/swipe");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message?.includes(HALAL_FOCUS_ERROR)) {
        setErrors({
          minTicketSize: HALAL_FOCUS_ERROR
        });
        router.replace("/(onboarding)/investor-halalfocus");
      } else {
        setErrors({ minTicketSize: message });
      }
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

  const handleSubmit = () => {
    if (!validate() || !halalFocusVerified) return;

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

  // Guard: redirect if onboarding already complete (prevents bouncing)
  if (userData && onboardingComplete) {
    return (
      <View className="flex-1 bg-emerald-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-4">Redirecting...</Text>
      </View>
    );
  }

  if (isLoadingProfile) {
    return (
      <View className="flex-1 bg-emerald-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-4">Loading your profile...</Text>
      </View>
    );
  }

  if (!halalFocusVerified) {
    return (
      <View className="flex-1 bg-emerald-50 items-center justify-center p-6">
        <Text className="text-6xl mb-4">📋</Text>
        <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
          Complete HalalFocus First
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          You must complete the HalalFocus verification before saving your
          investment profile.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(onboarding)/investor-halalfocus")}
          className="bg-emerald-600 rounded-lg py-4 px-6"
        >
          <Text className="text-white font-semibold text-center text-lg">
            Go to HalalFocus Verification
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      {/* Back Button */}
      <View className="absolute top-0 left-0 z-10 p-4">
        <BackButton
          fallbackRoute={onboardingComplete ? "/(tabs)/investor" : "/(auth)/choose-role"}
          alwaysUseFallback={!onboardingComplete}
        />
      </View>
      
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {existingProfile ? "Update Profile" : "Complete Profile"}
          </Text>
          <Text className="text-gray-600">
            Tell us about your investment preferences
          </Text>
        </View>

        {/* Section 1: Investment Criteria */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
            Investment Criteria
          </Text>

          {/* Ticket Size Range */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Minimum Ticket Size (USD)
            </Text>
            <TextInput
              value={formData.minTicketSize}
              onChangeText={(text) => handleChange("minTicketSize", text)}
              placeholder="e.g., 10000"
              keyboardType="number-pad"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
            {errors.minTicketSize && (
              <Text className="text-sm text-red-600 mt-1">{errors.minTicketSize}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Maximum Ticket Size (USD)
            </Text>
            <TextInput
              value={formData.maxTicketSize}
              onChangeText={(text) => handleChange("maxTicketSize", text)}
              placeholder="e.g., 1000000"
              keyboardType="number-pad"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
            {errors.maxTicketSize && (
              <Text className="text-sm text-red-600 mt-1">{errors.maxTicketSize}</Text>
            )}
          </View>

          {/* Preferred Sectors */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Preferred Sectors
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_SECTORS.map((sector) => (
                <TouchableOpacity
                  key={sector}
                  onPress={() => toggleSector(sector)}
                  className={`px-4 py-2 rounded-lg border ${
                    formData.preferredSectors.includes(sector)
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-gray-50 border-emerald-200"
                  }`}
                >
                  <Text
                    className={
                      formData.preferredSectors.includes(sector)
                        ? "text-white font-medium"
                        : "text-gray-700"
                    }
                  >
                    {sector}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {formData.preferredSectors.length > 0 && (
              <Text className="mt-2 text-sm text-gray-500">
                Selected: {formData.preferredSectors.join(", ")}
              </Text>
            )}
          </View>
        </View>

        {/* Section 2: Geographic & Investment Focus */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
            Geographic & Investment Focus
          </Text>

          {/* Geographic Focus */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Geographic Focus
            </Text>
            <TextInput
              value={formData.geoFocus}
              onChangeText={(text) => handleChange("geoFocus", text)}
              placeholder="e.g., MENA region, Southeast Asia, Global"
              maxLength={200}
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
            {errors.geoFocus && (
              <Text className="text-sm text-red-600 mt-1">{errors.geoFocus}</Text>
            )}
            <Text className="text-xs text-gray-500 mt-1 text-right">
              {formData.geoFocus.length}/200
            </Text>
          </View>

          {/* Investment Thesis */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Investment Thesis
            </Text>
            <TextInput
              value={formData.investmentThesis}
              onChangeText={(text) => handleChange("investmentThesis", text)}
              placeholder="Describe your investment philosophy, what you look for in startups, and your approach to supporting founders..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
            {errors.investmentThesis && (
              <Text className="text-sm text-red-600 mt-1">{errors.investmentThesis}</Text>
            )}
            <Text className="text-xs text-gray-500 mt-1 text-right">
              {formData.investmentThesis.length}/2000
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending || !halalFocusVerified}
          className={`bg-emerald-600 rounded-lg py-4 px-6 mb-8 ${
            mutation.isPending || !halalFocusVerified ? "opacity-50" : ""
          }`}
        >
          {mutation.isPending ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Saving...</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center text-lg">
              Save & Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
