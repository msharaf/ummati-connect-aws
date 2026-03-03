import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../../../src/lib/trpc";
import { BackButton } from "../../../src/components/BackButton";

export default function HalalFocusScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: questionnaire, isLoading: isLoadingQuestionnaire } =
    trpc.investorProfile.getHalalFocusQuestionnaire.useQuery();

  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [additionalNotes, setAdditionalNotes] = useState("");

  const submitHalalFocus = trpc.investorProfile.submitHalalFocus.useMutation({
    onSuccess: async (result) => {
      if (result.rejected) {
        return; // Handled below
      }
      await utils.user.me.invalidate();
      await utils.investorProfile.getMyInvestorProfile.invalidate();
      router.replace("/(tabs)/investor/setup");
    },
    onError: (error) => {
      // Error shown by mutation state
    }
  });

  const handleSubmit = () => {
    const res: Record<string, boolean | string | undefined> = {};
    for (const [k, v] of Object.entries(responses)) {
      res[k] = v;
    }
    if (additionalNotes.trim()) res.additionalNotes = additionalNotes.trim();
    submitHalalFocus.mutate({ responses: res });
  };

  const toggleResponse = (id: string, value: boolean) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  };

  if (isLoadingQuestionnaire) {
    return (
      <View className="flex-1 bg-emerald-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-4">Loading questionnaire...</Text>
      </View>
    );
  }

  const questions = questionnaire?.questions ?? [];
  const rejected = submitHalalFocus.data?.rejected === true;

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      <View className="absolute top-0 left-0 z-10 p-4">
        <BackButton fallbackRoute="/(auth)/choose-role" alwaysUseFallback />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: 60 }}
      >
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            HalalFocus Verification
          </Text>
          <Text className="text-gray-600">
            Complete this questionnaire to verify your investment preferences align
            with halal principles. You must complete this before saving your profile.
          </Text>
        </View>

        {rejected && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <Text className="text-red-800 font-medium">
              Unfortunately, based on your responses, we cannot proceed. Some
              activities are not permitted under halal investment guidelines.
            </Text>
            {submitHalalFocus.data?.rejectionReason && (
              <Text className="text-red-600 mt-2 text-sm">
                {submitHalalFocus.data.rejectionReason}
              </Text>
            )}
          </View>
        )}

        <View className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-emerald-200">
            Industry & Business Verification
          </Text>
          {questions.map((q) => (
            <View
              key={q.id}
              className="py-3 border-b border-gray-100 last:border-b-0"
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-gray-800 mr-4">{q.label}</Text>
                <Switch
                  value={responses[q.id] ?? false}
                  onValueChange={(v) => toggleResponse(q.id, v)}
                  trackColor={{ false: "#d1d5db", true: "#10b981" }}
                  thumbColor="#fff"
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                {responses[q.id] === true ? "Yes" : "No"}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitHalalFocus.isPending}
          className="bg-emerald-600 rounded-lg py-4 px-6 mb-8"
        >
          {submitHalalFocus.isPending ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">
                Verifying...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-center text-lg">
              Submit & Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
