import React, { useState } from "react";
import { useQuery, useAction } from "wasp/client/operations";
import { getRestaurantsByStatus, updateRestaurantStatus } from "wasp/client/operations";

export default function AdminRestaurantDashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("PENDING");
  const { data: restaurants, isLoading, error } = useQuery(getRestaurantsByStatus, { status: selectedStatus });
  const updateStatusAction = useAction(updateRestaurantStatus);

  const [rejectionReason, setRejectionReason] = useState("");
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED" | "SUSPENDED") => {
    try {
      await updateStatusAction({
        id,
        status,
        statusDetails: status === "REJECTED" ? rejectionReason : undefined,
      });
      setActingOnId(null);
      setRejectionReason("");
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading restaurants...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">Error: {error.message}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Restaurant Management</h1>
        <div className="flex space-x-2">
          {["PENDING", "APPROVED", "REJECTED", "SUSPENDED", undefined].map((status) => (
            <button
              key={status ?? "all"}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors ${
                selectedStatus === status
                  ? "bg-yellow-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Restaurant</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">No restaurants found in this category.</td>
              </tr>
            ) : (
              restaurants?.map((restaurant: any) => (
                <tr key={restaurant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{restaurant.name}</div>
                    <div className="text-xs text-gray-500">Slug: {restaurant.slug}</div>
                    <div className="text-xs text-gray-400 mt-1">{restaurant.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{restaurant.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      restaurant.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      restaurant.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      restaurant.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {restaurant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    {actingOnId === restaurant.id ? (
                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-inner">
                        <textarea
                          placeholder="Reason for rejection..."
                          className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(restaurant.id, "REJECTED")}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-700 shadow-sm"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setActingOnId(null)}
                            className="bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gray-100 shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {restaurant.status !== "APPROVED" && (
                          <button
                            onClick={() => handleUpdateStatus(restaurant.id, "APPROVED")}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 shadow-sm transition-transform active:scale-95"
                          >
                            Approve
                          </button>
                        )}
                        {restaurant.status !== "REJECTED" && (
                          <button
                            onClick={() => setActingOnId(restaurant.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-700 shadow-sm transition-transform active:scale-95"
                          >
                            Reject
                          </button>
                        )}
                        {restaurant.status !== "SUSPENDED" && (
                          <button
                            onClick={() => handleUpdateStatus(restaurant.id, "SUSPENDED")}
                            className="bg-gray-800 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-black shadow-sm transition-transform active:scale-95"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
