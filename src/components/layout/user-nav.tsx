
"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, UserCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const APP_LOGGED_IN_USER_KEY = "remindme_logged_in_user";

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(APP_LOGGED_IN_USER_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.name || "Usuario",
            email: parsedUser.email || "usuario@remindme.app",
            avatar: parsedUser.avatar || `https://picsum.photos/seed/${parsedUser.email}/100/100`
          });
        } catch (e) {
          console.error("Failed to parse logged in user from localStorage", e);
          // Fallback or redirect if user data is corrupted
          localStorage.removeItem(APP_LOGGED_IN_USER_KEY);
          router.push("/login");
        }
      } else {
        // No logged-in user found, redirect to login
        // router.push("/login"); // Potentially causes redirect loops if on login page
      }
    }
  }, [router]);

  const getInitials = (name: string = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(APP_LOGGED_IN_USER_KEY);
    }
    router.push("/login");
  };

  if (!user) {
    // Potentially show a loading state or a redirect button if user is null
    // For now, we render nothing until user data is loaded or determined to be absent
    return null; 
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border">
            {user.avatar && (
              <AvatarImage asChild src={user.avatar} alt={user.name}>
                <Image src={user.avatar} alt={user.name} width={40} height={40} data-ai-hint="user profile" />
              </AvatarImage>
            )}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
