
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

interface User {
  email: string;
  password_REPLACEME: string; // In a real app, this would be a hashed password
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSignup = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      toast({
        title: "Error de Registro",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

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

    if (users.find(u => u.email === email)) {
      setError("Este correo electrónico ya está registrado.");
      toast({
        title: "Error de Registro",
        description: "Este correo electrónico ya está registrado.",
        variant: "destructive",
      });
      return;
    }

    // IMPORTANT: In a real application, hash the password before storing it.
    // Storing plain text passwords is a major security risk.
    const newUser: User = { email, password_REPLACEME: password };
    users.push(newUser);
    localStorage.setItem(APP_USERS_STORAGE_KEY, JSON.stringify(users));

    toast({
      title: "¡Registro Exitoso!",
      description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
    });
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo className="mb-4 h-12 w-auto" />
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>Ingresa tus datos para registrarte.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
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
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full shadow-md">
              Registrarse
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline">
              Iniciar Sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
