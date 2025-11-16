"use client";

import { OverviewHeader } from "../../../../components/visionary/OverviewHeader";
import { MetricsGrid } from "../../../../components/visionary/MetricsGrid";
import { ActivityFeed } from "../../../../components/visionary/ActivityFeed";
import { CompletenessChecklist } from "../../../../components/visionary/CompletenessChecklist";

export default function VisionaryDashboardPage() {
  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="space-y-8 p-6 max-w-5xl mx-auto">
        {/* Header Banner */}
        <OverviewHeader />

        {/* Key Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-charcoal mb-4">Key Metrics</h2>
          <MetricsGrid />
        </div>

        {/* Two Column Layout for Activity and Completeness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Feed */}
          <div>
            <ActivityFeed />
          </div>

          {/* Profile Completeness */}
          <div>
            <CompletenessChecklist />
          </div>
        </div>
      </div>
    </div>
  );
}

