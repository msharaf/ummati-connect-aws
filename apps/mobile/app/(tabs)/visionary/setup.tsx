import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StartupStage } from "@ummati/db";
import { trpc } from "../../../src/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { BackButton } from "../../../src/components/BackButton";

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

export default function VisionarySetupScreen() {
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
  const [showSectorPicker, setShowSectorPicker] = useState(false);
  const [showStagePicker, setShowStagePicker] = useState(false);

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
      router.push("/(tabs)/visionary/dashboard");
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

  const handleSubmit = () => {
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

  const handleChange = (field: keyof FormData, value: string | StartupStage) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isLoadingProfile) {
    return (
      <View className="flex-1 bg-emerald-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-4">Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      {/* Back Button */}
      <View className="absolute top-0 left-0 z-10 p-4">
        <BackButton fallbackRoute="/(tabs)/visionary/dashboard" />
      </View>
      
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {existingProfile ? "Update Profile" : "Create Profile"}
          </Text>
          <Text className="text-gray-600">
            Share your startup story and connect with investors
          </Text>
        </View>

        {/* Section 1: Basic Info */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
            Basic Information
          </Text>

          {/* Startup Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Startup Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.startupName}
              onChangeText={(text) => handleChange("startupName", text)}
              placeholder="Your startup's name"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
              maxLength={50}
            />
            {errors.startupName && (
              <Text className="text-sm text-red-600 mt-1">{errors.startupName}</Text>
            )}
            <Text className="text-xs text-gray-500 mt-1 text-right">
              {formData.startupName.length}/50
            </Text>
          </View>

          {/* Tagline */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Tagline</Text>
            <TextInput
              value={formData.tagline}
              onChangeText={(text) => handleChange("tagline", text)}
              placeholder="A short, memorable tagline"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
              maxLength={100}
            />
            {errors.tagline && (
              <Text className="text-sm text-red-600 mt-1">{errors.tagline}</Text>
            )}
            <Text className="text-xs text-gray-500 mt-1 text-right">
              {formData.tagline.length}/100
            </Text>
          </View>

          {/* Logo URL */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Logo URL</Text>
            <TextInput
              value={formData.logoUrl}
              onChangeText={(text) => handleChange("logoUrl", text)}
              placeholder="https://example.com/logo.png"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
              keyboardType="url"
              autoCapitalize="none"
            />
            {errors.logoUrl && (
              <Text className="text-sm text-red-600 mt-1">{errors.logoUrl}</Text>
            )}
            {formData.logoUrl && (
              <View className="mt-2">
                <Image
                  source={{ uri: formData.logoUrl }}
                  className="w-20 h-20 rounded-lg border border-gray-200"
                  resizeMode="cover"
                  onError={() => {}}
                />
              </View>
            )}
          </View>

          {/* Sector */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Sector <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowSectorPicker(true)}
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={formData.sector ? "text-gray-900" : "text-gray-400"}>
                {formData.sector || "Select a sector..."}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            {errors.sector && (
              <Text className="text-sm text-red-600 mt-1">{errors.sector}</Text>
            )}
          </View>

          {/* Startup Stage */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Startup Stage <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowStagePicker(true)}
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className="text-gray-900">{formData.startupStage}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Pitch */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
            Pitch
          </Text>

          <View className="mb-4">
            <TextInput
              value={formData.pitch}
              onChangeText={(text) => handleChange("pitch", text)}
              placeholder="Describe your startup, what problem it solves, and why investors should be interested..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
              maxLength={2000}
            />
            {errors.pitch && (
              <Text className="text-sm text-red-600 mt-1">{errors.pitch}</Text>
            )}
            <Text className="text-xs text-gray-500 mt-1 text-right">
              {formData.pitch.length}/2000
            </Text>
          </View>
        </View>

        {/* Section 3: Business Details */}
        <View className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
            Business Details
          </Text>

          {/* Location */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Location</Text>
            <TextInput
              value={formData.location}
              onChangeText={(text) => handleChange("location", text)}
              placeholder="e.g., San Francisco, CA or Dubai, UAE"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
          </View>

          {/* Team Size */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Team Size</Text>
            <TextInput
              value={formData.teamSize}
              onChangeText={(text) => handleChange("teamSize", text)}
              placeholder="Number of team members"
              keyboardType="number-pad"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
            {errors.teamSize && (
              <Text className="text-sm text-red-600 mt-1">{errors.teamSize}</Text>
            )}
          </View>

          {/* Funding Ask */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Funding Ask (USD)</Text>
            <TextInput
              value={formData.fundingAsk}
              onChangeText={(text) => handleChange("fundingAsk", text)}
              placeholder="e.g., 500000"
              keyboardType="number-pad"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
            {errors.fundingAsk && (
              <Text className="text-sm text-red-600 mt-1">{errors.fundingAsk}</Text>
            )}
          </View>

          {/* Website URL */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Website URL</Text>
            <TextInput
              value={formData.websiteUrl}
              onChangeText={(text) => handleChange("websiteUrl", text)}
              placeholder="https://www.yourstartup.com"
              keyboardType="url"
              autoCapitalize="none"
              className="bg-gray-50 border border-emerald-200 rounded-lg px-4 py-3 text-gray-900"
            />
            {errors.websiteUrl && (
              <Text className="text-sm text-red-600 mt-1">{errors.websiteUrl}</Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={mutation.isPending}
          className={`bg-emerald-600 rounded-lg py-4 px-6 mb-8 ${
            mutation.isPending ? "opacity-50" : ""
          }`}
        >
          {mutation.isPending ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Saving...</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center text-lg">
              Save Profile
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Sector Picker Modal */}
      <Modal
        visible={showSectorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSectorPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">Select Sector</Text>
              <TouchableOpacity onPress={() => setShowSectorPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {COMMON_SECTORS.map((sector) => (
                <TouchableOpacity
                  key={sector}
                  onPress={() => {
                    handleChange("sector", sector);
                    setShowSectorPicker(false);
                  }}
                  className="py-4 border-b border-gray-200"
                >
                  <Text className="text-gray-900 text-lg">{sector}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Stage Picker Modal */}
      <Modal
        visible={showStagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStagePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">Select Stage</Text>
              <TouchableOpacity onPress={() => setShowStagePicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {STARTUP_STAGES.map((stage) => (
                <TouchableOpacity
                  key={stage}
                  onPress={() => {
                    handleChange("startupStage", stage);
                    setShowStagePicker(false);
                  }}
                  className="py-4 border-b border-gray-200"
                >
                  <Text className="text-gray-900 text-lg">{stage}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
