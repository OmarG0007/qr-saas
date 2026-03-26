import { Link } from "wasp/client/router";
import { routes } from "wasp/client/router";
import { useQuery } from "wasp/client/operations";
import { getMyRestaurant } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { logout } from "wasp/client/auth";

export default function RestaurantStatusPage() {
  const { data: _user } = useAuth();
  const { data: restaurant, isLoading, error } = useQuery(getMyRestaurant);

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-red-500">Error loading status: {error.message}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Restaurant Found</h2>
        <p className="text-gray-600 mb-8 text-center">
          You haven't set up your restaurant profile yet.
        </p>
        <Link
          to={routes.RestaurantSetupRoute.to}
          className="rounded-md bg-yellow-600 py-2 px-4 text-sm font-medium text-white hover:bg-yellow-700"
        >
          Set Up Restaurant
        </Link>
      </div>
    );
  }

  const statusContent = {
    PENDING: {
      title: "Application Received",
      description:
        "Your restaurant application is under review. We'll email you once it's approved.",
      iconColor: "text-yellow-500",
    },
    REJECTED: {
      title: "Application Rejected",
      description: restaurant.statusDetails || "Unfortunately, your restaurant application was not approved. Please contact support for more details.",
      iconColor: "text-red-500",
    },
    SUSPENDED: {
      title: "Account Suspended",
      description: "Your restaurant account has been suspended. Please contact support.",
      iconColor: "text-gray-500",
    },
    APPROVED: {
      title: "Account Approved",
      description: "Your restaurant account is active. You can now access your dashboard.",
      iconColor: "text-green-500",
    },
  };

  const content = statusContent[restaurant.status as keyof typeof statusContent];

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-6 shadow sm:rounded-lg sm:px-12 text-center">
          <div className={`mb-6 flex justify-center text-6xl ${content.iconColor}`}>
             {restaurant.status === "PENDING" && "⏳"}
             {restaurant.status === "REJECTED" && "❌"}
             {restaurant.status === "SUSPENDED" && "🚫"}
             {restaurant.status === "APPROVED" && "✅"}
          </div>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
            {content.title}
          </h2>
          <div className="mb-8 text-gray-600 whitespace-pre-wrap">{content.description}</div>
          <div className="space-y-4">
            {restaurant.status === "APPROVED" && (
              <Link
                to={routes.DemoAppRoute.to}
                className="block w-full rounded-md bg-yellow-600 py-2 px-4 text-sm font-medium text-white hover:bg-yellow-700"
              >
                Go to Dashboard
              </Link>
            )}
            <button
              onClick={logout}
              className="block w-full rounded-md border border-gray-300 py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
