import { SwipeScreen } from "../../../src/features/swipe/SwipeScreen";
import { InvestorOnboardingGuard } from "../../../src/components/InvestorOnboardingGuard";

export default function SwipeTab() {
  return (
    <InvestorOnboardingGuard>
      <SwipeScreen />
    </InvestorOnboardingGuard>
  );
}

