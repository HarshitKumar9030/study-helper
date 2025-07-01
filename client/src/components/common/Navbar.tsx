"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
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
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  MessageCircle,
  Calendar,
  Mic,
  Home,
  Menu,
  Command,
  Zap,
} from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { motion, AnimatePresence } from "framer-motion";

const ModernNavbar = () => {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/chat", label: "AI Chat", icon: MessageCircle },
    { href: "/scheduler", label: "Planner", icon: Calendar },
    { href: "/voice", label: "Voice", icon: Mic },
  ];

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActiveRoute = (href: string) => pathname === href;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="absolute top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <span className="hidden sm:block text-sm font-semibold text-foreground">
                Study Helper
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          {session && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActiveRoute(item.href);
                
                return (
                  <motion.div
                    key={item.href}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={item.href}
                      className={`
                        relative flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'text-foreground bg-accent/50' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                        }
                      `}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute inset-0 rounded-lg bg-accent/20 border border-accent/50"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            {mounted && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-9 w-9 p-0"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </motion.div>
            )}

            {/* Mobile Menu Button */}
            {session && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="md:hidden"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="h-9 w-9 p-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Profile / Auth */}
            {status === "loading" ? (
              <div className="h-8 w-8 rounded-full bg-accent animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative h-8 w-8 rounded-full ring-offset-background transition-all duration-200 hover:ring-2 hover:ring-ring hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Avatar className="h-8 w-8 border border-border/50">
                      <AvatarImage
                        src={
                          session.user?.image
                            ? getOptimizedImageUrl(session.user.image, "w_32,h_32,c_thumb,g_face,f_auto,q_auto")
                            : ""
                        }
                        alt={session.user?.name || "User Avatar"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                        {session.user?.name
                          ? getUserInitials(session.user.name)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 p-1"
                  align="end"
                  forceMount
                  sideOffset={8}
                >
                  <div className="flex items-center gap-2 p-2 text-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          session.user?.image
                            ? getOptimizedImageUrl(session.user.image, "w_32,h_32,c_thumb,g_face,f_auto,q_auto")
                            : ""
                        }
                        alt={session.user?.name || "User Avatar"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {session.user?.name
                          ? getUserInitials(session.user.name)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      {session.user?.name && (
                        <p className="text-sm font-medium leading-none">
                          {session.user.name}
                        </p>
                      )}
                      {session.user?.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => signIn()}
                    className="hidden sm:inline-flex"
                  >
                    Sign In
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => signIn()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Get Started
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && session && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border/40 py-4"
            >
              <nav className="flex flex-col space-y-1">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = isActiveRoute(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`
                        flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                        ${isActive 
                          ? 'text-foreground bg-accent/50' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                        }
                      `}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default ModernNavbar;
