"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  BookOpen,
  Calendar,
  Focus,
  MessageCircle,
  Mic,
  Home,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { getAvatarUrl, getUserInitials } from "@/lib/avatar-utils";

interface UserProfile {
  avatar?: {
    url: string;
    publicId: string;
  };
}

const Navbar = () => {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  // Fetch user profile data to get avatar
  useEffect(() => {
    if (session) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUserProfile(data.user);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  // Listen for avatar updates via custom event
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (session) {
        fetch('/api/profile')
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setUserProfile(data.user);
            }
          })
          .catch(console.error);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [session]);
  const getAvatarUrlForUser = () => {
    return getAvatarUrl(userProfile?.avatar, session?.user?.image || "");
  };

  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);
  return (
    <nav className="sticky px-2 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-7 w-7 text-purple-700 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
            <span className="font-bold text-sm bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent">
              Study Helper
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {session && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavigationMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground  focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                        <IconComponent className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        {item.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        )}

        {/* Mobile Menu & Actions */}
        <div className="flex items-center space-x-2">
          {/* Mobile Menu Button */}
          {session && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:hidden transition-all duration-200 hover:scale-110"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-6 w-6 text-purple-700" />
                      <span className="font-bold text-sm bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent">
                        Study Helper
                      </span>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex-1 p-6">
                    <div className="space-y-2">
                      {navigationItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMobileMenu}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-accent  group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 transition-colors duration-200 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40">
                              <IconComponent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Menu Footer */}
                  <div className="p-6 border-t">
                    <div className="flex items-center gap-3">                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarImage
                          src={getAvatarUrlForUser()}
                          alt={session.user?.name || ""}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold text-sm">
                          {session.user?.name
                            ? getUserInitials(session.user.name)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        {session.user?.name && (
                          <p className="font-medium text-sm truncate">
                            {session.user.name}
                          </p>
                        )}
                        {session.user?.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 transition-all duration-200 "
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>{" "}
          {/* Profile Dropdown / Auth Buttons */}
          {status === "loading" ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full ring-offset-background transition-all duration-300 hover:ring-2 hover:ring-ring hover:ring-offset-2 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >                  <Avatar className="h-9 w-9 border-2 border-background shadow-md transition-all duration-300 hover:shadow-lg">
                    <AvatarImage
                      src={getAvatarUrlForUser()}
                      alt={session.user?.name || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold text-sm">
                      {session.user?.name
                        ? getUserInitials(session.user.name)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 p-2 bg-card/95 backdrop-blur-md border shadow-lg animate-in slide-in-from-top-2 duration-300"
                align="end"
                forceMount
                sideOffset={8}
              >
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-100 dark:border-purple-800/30 transition-all duration-300 hover:shadow-sm">                  <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-sm">
                    <AvatarImage
                      src={getAvatarUrlForUser()}
                      alt={session.user?.name || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold">
                      {session.user?.name
                        ? getUserInitials(session.user.name)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 min-w-0 flex-1">
                    {session.user?.name && (
                      <p className="font-semibold text-foreground text-sm leading-tight">
                        {session.user.name}
                      </p>
                    )}
                    {session.user?.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenuSeparator className="my-2" />

                <div className="space-y-1">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 focus:bg-accent/50  cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 transition-all duration-200 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">Profile</span>
                        <span className="text-xs text-muted-foreground">
                          Manage your account
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-accent/50 focus:bg-accent/50  cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 transition-all duration-200 group-hover:bg-gray-200 dark:group-hover:bg-gray-700">
                        <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 group-hover:rotate-45" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">Settings</span>
                        <span className="text-xs text-muted-foreground">
                          Preferences & privacy
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-2" />

                {/* Sign Out */}
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/20 dark:focus:bg-red-950/20 cursor-pointer transition-all duration-200  group"
                  onClick={() => signOut()}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 transition-all duration-200 group-hover:bg-red-200 dark:group-hover:bg-red-800/40">
                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400 transition-transform duration-200 group-hover:scale-110" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Sign out</span>
                    <span className="text-xs text-red-500/70">
                      End your session
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => signIn()}
                className="transition-all duration-200  hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button
                onClick={() => signIn()}
                className="transition-all duration-200  bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Sign In</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
