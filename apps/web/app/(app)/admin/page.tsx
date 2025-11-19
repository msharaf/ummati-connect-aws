"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../src/lib/trpc";
import { format } from "date-fns";

export default function AdminPage() {
  const router = useRouter();
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    profileId: string | null;
    reason: string;
  }>({
    open: false,
    profileId: null,
    reason: ""
  });

  // Check if user is admin
  const { data: userMe, isLoading: isLoadingUser } = trpc.user.me.useQuery();
  const { data: adminCheck } = trpc.admin.checkAdmin.useQuery(undefined, {
    enabled: !isLoadingUser
  });

  // Redirect if not admin
  if (!isLoadingUser && (!adminCheck?.isAdmin)) {
    router.push("/");
    return null;
  }

  // Fetch users
  const {
    data: users,
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: adminCheck?.isAdmin === true
  });

  // Fetch reports
  const { data: reports } = trpc.admin.getReports.useQuery(undefined, {
    enabled: adminCheck?.isAdmin === true
  });

  // Approve/Reject mutation
  const approveRejectMutation = trpc.admin.approveRejectUser.useMutation({
    onSuccess: () => {
      refetchUsers();
      setRejectModal({ open: false, profileId: null, reason: "" });
    }
  });

  // Override halalCategory mutation
  const overrideCategoryMutation = trpc.admin.overrideHalalCategory.useMutation({
    onSuccess: () => {
      refetchUsers();
    }
  });

  // Ban/Unban mutation
  const banMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      refetchUsers();
    }
  });

  const handleApprove = (userId: string) => {
    if (confirm("Are you sure you want to approve this user?")) {
      approveRejectMutation.mutate({
        userId,
        action: "approve"
      });
    }
  };

  const handleReject = () => {
    if (!rejectModal.profileId || !rejectModal.reason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    if (confirm("Are you sure you want to reject this user?")) {
      approveRejectMutation.mutate({
        userId: rejectModal.profileId,
        action: "reject",
        reason: rejectModal.reason
      });
    }
  };

  const handleOverrideCategory = (userId: string, currentCategory: string | null) => {
    const categories = ["halal", "grey", "forbidden"] as const;
    const nextIndex = currentCategory ? (categories.indexOf(currentCategory as any) + 1) % categories.length : 0;
    const newCategory = categories[nextIndex];
    
    if (confirm(`Change halal category to "${newCategory}"?`)) {
      overrideCategoryMutation.mutate({
        userId,
        halalCategory: newCategory,
        reason: `Admin override: changed from ${currentCategory || "null"} to ${newCategory}`
      });
    }
  };

  const handleToggleBan = (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? "unban" : "ban";
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      banMutation.mutate({
        userId,
        banned: !currentlyBanned
      });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-8">
      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, halal verification, and platform reports</p>
        </div>

        {/* Reports Section */}
        {reports && (
          <div className="bg-white border border-emerald-200 rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-emerald-900">{reports.totalUsers}</div>
                <div className="text-sm text-emerald-700">Total Users</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{reports.investors}</div>
                <div className="text-sm text-blue-700">Investors</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{reports.founders}</div>
                <div className="text-sm text-purple-700">Founders</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{reports.totalMatches}</div>
                <div className="text-sm text-green-700">Matches</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-emerald-900">{reports.halalUsers}</div>
                <div className="text-sm text-emerald-700">Halal Users</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-yellow-900">{reports.greyUsers}</div>
                <div className="text-sm text-yellow-700">Grey Area Users</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-red-900">{reports.forbiddenUsers}</div>
                <div className="text-sm text-red-700">Forbidden Users</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management Section */}
        <div className="bg-white border border-emerald-200 rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Users Management</h2>
          <p className="text-gray-600 mb-4">View and manage all platform users, halal verification, and approval status</p>

          {isLoadingUsers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Halal Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const profile = user.role === "INVESTOR" ? user.investorProfile : user.visionaryProfile;
                    const halalScore = profile?.halalScore ?? null;
                    const halalCategory = profile?.halalCategory ?? null;

                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{user.fullName || user.name || "N/A"}</td>
                        <td className="py-3 px-4 text-gray-700">{user.email}</td>
                        <td className="py-3 px-4">
                          {user.role ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {user.role}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">No role</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {halalScore !== null ? (
                            <div className="text-sm font-semibold text-gray-900">{halalScore}/100</div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {halalCategory ? (
                            <button
                              onClick={() => handleOverrideCategory(user.id, halalCategory)}
                              disabled={overrideCategoryMutation.isPending}
                              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                halalCategory === "forbidden"
                                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                                  : halalCategory === "grey"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              }`}
                              title="Click to cycle category"
                            >
                              {halalCategory}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {user.isAdmin && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Admin
                              </span>
                            )}
                            {user.isBanned && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Banned
                              </span>
                            )}
                            {user.role === "VISIONARY" && (profile as any)?.isApproved && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                Approved
                              </span>
                            )}
                            {user.role === "VISIONARY" && (profile as any)?.isFlagged && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Flagged
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-2">
                            {user.role === "VISIONARY" && !(profile as any)?.isApproved && (
                              <button
                                onClick={() => handleApprove(user.id)}
                                disabled={approveRejectMutation.isPending}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {user.role === "VISIONARY" && !(profile as any)?.isFlagged && (
                              <button
                                onClick={() => setRejectModal({ open: true, profileId: user.id, reason: "" })}
                                disabled={approveRejectMutation.isPending}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleBan(user.id, user.isBanned)}
                              disabled={banMutation.isPending}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                user.isBanned
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              {banMutation.isPending ? "Updating..." : user.isBanned ? "Unban" : "Ban"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">No users found.</div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject User</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this user:
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal({ ...rejectModal, reason: e.target.value })
              }
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4 min-h-[120px]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectModal({ open: false, profileId: null, reason: "" })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={approveRejectMutation.isPending || !rejectModal.reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {approveRejectMutation.isPending ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

