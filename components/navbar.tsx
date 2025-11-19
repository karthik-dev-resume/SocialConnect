"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, User, Settings, LogOut, Shield } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/feed" className="text-xl font-bold text-blue-600">
              SocialConnect
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              {user.role !== "admin" && (
                <Link href="/feed">
                  <Button variant="ghost" size="sm">
                    <Home className="mr-2 h-4 w-4" />
                    Feed
                  </Button>
                </Link>
              )}
              {user.role !== "admin" && (
                <Link href={`/profile/${user.id}`}>
                  <Button variant="ghost" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role !== "admin" && <NotificationsDropdown />}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
              <DropdownMenuSeparator />
              <Link href={`/profile/${user.id}`}>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              {user.role === "admin" && (
                <Link href="/admin-dashboard">
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
