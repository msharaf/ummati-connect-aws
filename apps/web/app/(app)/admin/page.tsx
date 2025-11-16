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
  const { data: currentUser, isLoading: isLoadingUser } = trpc.user.getMe.useQuery();

  // Redirect if not admin
  if (!isLoadingUser && (!currentUser || !currentUser.isAdmin)) {
    router.push("/");
    return null;
  }

  // Fetch flagged visionaries
  const {
    data: flaggedVisionaries,
    isLoading: isLoadingFlagged,
    refetch: refetchFlagged
  } = trpc.admin.listFlaggedVisionaries.useQuery(undefined, {
    enabled: currentUser?.isAdmin === true
  });

  // Fetch users
  const {
    data: users,
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: currentUser?.isAdmin === true
  });

  // Approve mutation
  const approveMutation = trpc.admin.approveVisionaryProfile.useMutation({
    onSuccess: () => {
      refetchFlagged();
    }
  });

  // Reject mutation
  const rejectMutation = trpc.admin.rejectVisionaryProfile.useMutation({
    onSuccess: () => {
      refetchFlagged();
      setRejectModal({ open: false, profileId: null, reason: "" });
    }
  });

  // Toggle ban mutation
  const toggleBanMutation = trpc.admin.toggleBanUser.useMutation({
    onSuccess: () => {
      refetchUsers();
    }
  });

  const handleApprove = (id: string) => {
    if (confirm("Are you sure you want to approve this startup?")) {
      approveMutation.mutate({ id });
    }
  };

  const handleReject = () => {
    if (!rejectModal.profileId || !rejectModal.reason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    if (confirm("Are you sure you want to reject this startup?")) {
      rejectMutation.mutate({
        id: rejectModal.profileId,
        reason: rejectModal.reason
      });
    }
  };

  const handleToggleBan = (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? "unban" : "ban";
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      toggleBanMutation.mutate({
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

  if (!currentUser?.isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-8">
      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage flagged startups and users</p>
        </div>

        {/* Flagged Startups Section */}
        <div className="bg-white border border-emerald-200 rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Flagged Startups</h2>

          {isLoadingFlagged ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading flagged startups...</p>
            </div>
          ) : flaggedVisionaries && flaggedVisionaries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Startup</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Founder</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Sector</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedVisionaries.map((profile) => (
                    <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{profile.startupName}</div>
                        {profile.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {profile.description.substring(0, 100)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900">{profile.user.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{profile.user.email}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{profile.sector}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.riskCategory === "HARAM"
                              ? "bg-red-100 text-red-800"
                              : profile.riskCategory === "GREY"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {profile.riskCategory || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(profile.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(profile.id)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {approveMutation.isPending ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({ open: true, profileId: profile.id, reason: "" })
                            }
                            disabled={rejectMutation.isPending}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No flagged startups at this time.
            </div>
          )}
        </div>

        {/* Users Management Section */}
        <div className="bg-white border border-emerald-200 rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Users Management</h2>

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
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{user.name || "N/A"}</td>
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
                        <div className="flex gap-2">
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
                          {!user.isAdmin && !user.isBanned && (
                            <span className="text-gray-400 text-sm">Active</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleBan(user.id, user.isBanned)}
                          disabled={toggleBanMutation.isPending}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                            user.isBanned
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {toggleBanMutation.isPending
                            ? "Updating..."
                            : user.isBanned
                            ? "Unban"
                            : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))}
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Startup</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this startup:
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
                disabled={rejectMutation.isPending || !rejectModal.reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

