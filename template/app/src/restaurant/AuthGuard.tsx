import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { useQuery } from "wasp/client/operations";
import { getMyRestaurant } from "wasp/client/operations";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/restaurant-setup",
  "/restaurant-status",
  "/home-redirect",
  "/pricing",
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery(getMyRestaurant, { enabled: !!user });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      location.pathname === route || location.pathname.startsWith("/m/")
    );

    if (!isAuthLoading && !isRestaurantLoading && !isPublicRoute) {
      if (!user) {
        navigate("/login");
      } else if (user.isAdmin) {
        // Admin is fine anywhere (we assume they know what they're doing)
        return;
      } else if (!restaurant) {
        navigate("/restaurant-setup");
      } else if (restaurant.status !== "APPROVED") {
        navigate("/restaurant-status");
      }
    }
  }, [user, restaurant, isAuthLoading, isRestaurantLoading, navigate, location.pathname]);

  return <>{children}</>;
}
