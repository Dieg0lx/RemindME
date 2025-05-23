
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/logo";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const APP_USERS_STORAGE_KEY = "remindme_users";
const APP_LOGGED_IN_USER_KEY = "remindme_logged_in_user";

interface User {
  email: string;
  password_REPLACEME: string; // In a real app, this would be a hashed password
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (typeof window === 'undefined') return;

    const storedUsersRaw = localStorage.getItem(APP_USERS_STORAGE_KEY);
    let users: User[] = [];
    if (storedUsersRaw) {
      try {
        users = JSON.parse(storedUsersRaw);
      } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        setError("Ocurrió un error. Inténtalo de nuevo.");
        return;
      }
    }

    const user = users.find(u => u.email === email);

    if (user && user.password_REPLACEME === password) {
      localStorage.setItem(APP_LOGGED_IN_USER_KEY, JSON.stringify({ email: user.email, name: user.email.split('@')[0] })); // Store minimal user info
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "¡Bienvenido de nuevo!",
      });
      router.push("/dashboard");
    } else {
      setError("Correo electrónico o contraseña incorrectos.");
      toast({
        title: "Error de Inicio de Sesión",
        description: "Correo electrónico o contraseña incorrectos.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo className="mb-4 h-12 w-auto" />
          <CardTitle className="text-2xl">¡Bienvenido de Nuevo!</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder a tu presupuesto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@ejemplo.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full shadow-md">
              Iniciar Sesión
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
