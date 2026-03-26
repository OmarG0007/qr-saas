import React from "react";
import { Link, useLocation } from "react-router-dom";
import { routes } from "wasp/client/router";
import { useAuth, logout } from "wasp/client/auth";
import { useQuery } from "wasp/client/operations";
import { getMyRestaurant } from "wasp/client/operations";
import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  BarChart3,
  Settings,
  LogOut,
  User,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useAuth();
  const { data: restaurant } = useQuery(getMyRestaurant, { enabled: !!user });
  const location = useLocation();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/dashboard/orders", icon: ClipboardList },
    { name: "Menu", href: "/dashboard/menu", icon: Utensils },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-yellow-600">OpenSaaS Dine</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-yellow-50 text-yellow-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? "text-yellow-600" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {restaurant?.name || "Restaurant Dashboard"}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <User className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
