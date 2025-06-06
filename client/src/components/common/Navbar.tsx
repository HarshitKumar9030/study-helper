"use client"

import React from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
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
  BarChart3
} from 'lucide-react'

const Navbar = () => {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky px-2 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-7 w-7 text-purple-700" />
            <span className="font-bold text-sm">Study Helper</span>
          </div>
        </Link>

        {session && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/dashboard" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="/calendar" legacyBehavior passHref>
                    <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                        <Calendar className="mr-2 h-4 w-4" />
                        Calendar
                    </NavigationMenuLink>
                    </Link> 
                </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/analytics" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>          {status === 'loading' ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full ring-offset-background transition-all duration-200 hover:ring-2 hover:ring-ring hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                    <AvatarImage 
                      src={session.user?.image || ''} 
                      alt={session.user?.name || ''} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold text-sm">
                      {session.user?.name ? getUserInitials(session.user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 p-2 bg-card/95 backdrop-blur-md border shadow-lg" 
                align="end" 
                forceMount
                sideOffset={8}
              >
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-100 dark:border-purple-800/30">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-sm">
                    <AvatarImage 
                      src={session.user?.image || ''} 
                      alt={session.user?.name || ''} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold">
                      {session.user?.name ? getUserInitials(session.user.name) : 'U'}
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
                
                {/* Menu Items */}
                <div className="space-y-1">
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-accent/50 focus:bg-accent/50 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">Profile</span>
                        <span className="text-xs text-muted-foreground">Manage your account</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-accent/50 focus:bg-accent/50 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">Settings</span>
                        <span className="text-xs text-muted-foreground">Preferences & privacy</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>
                
                <DropdownMenuSeparator className="my-2" />
                
                {/* Sign Out */}
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/20 dark:focus:bg-red-950/20 cursor-pointer transition-colors"
                  onClick={() => signOut()}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Sign out</span>
                    <span className="text-xs text-red-500/70">End your session</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => signIn()}>
                Sign In
              </Button>
              <Button onClick={() => signIn()}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar