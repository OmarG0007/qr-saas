import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { useQuery } from "wasp/client/operations";
import { getMyRestaurant } from "wasp/client/operations";

export default function HomeRedirect() {
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery(getMyRestaurant);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && !isRestaurantLoading) {
      if (!user) {
        navigate("/login");
      } else if (user.isAdmin) {
        // Super Admins go to the admin dashboard
        navigate("/admin");
      } else if (!restaurant) {
        navigate("/restaurant-setup");
      } else if (restaurant.status !== "APPROVED") {
        navigate("/restaurant-status");
      } else {
        // If approved, go to the restaurant dashboard
        navigate("/dashboard");
      }
    }
  }, [user, restaurant, isAuthLoading, isRestaurantLoading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
