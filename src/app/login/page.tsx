"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schemas/authSchema";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Image from "next/image";

import { signIn } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { UserPlus, DoorOpen, LoaderCircle } from "lucide-react";
import ParticulasDotsBackground from "@/components/TSparticulasBackground";
import Link from "next/link";

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/inicio");
    } else {
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <ParticulasDotsBackground />
      <section className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 text-white w-full max-w-md">
        {/* Branding */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Request Center</h1>
          <p className="text-sm text-white/70">Sua central de solicitações</p>
        </header>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="exemplo@empresa.com"
              required
            />
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              required
            />
          </fieldset>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <Checkbox id="remember" />
              <span>Lembre-se de mim</span>
            </label>
            <a
              href="/esqueci-senha"
              className="text-blue-300 hover:underline"
            >
              Esqueceu a senha?
            </a>
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium">{error}</p>
          )}

          <Button
            type="submit"
            variant="secondary"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" /> Entrando...
              </>
            ) : (
              <>
                <DoorOpen /> Entrar
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-8 flex items-center gap-2">
          <hr className="flex-grow border-t border-white/20" />
          <span className="text-xs uppercase text-white/50">
            ou continue com
          </span>
          <hr className="flex-grow border-t border-white/20" />
        </div>

        {/* Login social */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => signIn("google")}
            className="flex items-center justify-center text-black"
          >
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => signIn("github")}
            className="flex items-center justify-center text-black"
          >
            Github
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-white/70">
          Não possui conta?{" "}
          <Link
            href="/registrar"
            className="text-blue-300 hover:underline inline-flex items-center gap-1"
          >
            <UserPlus size={14} /> Cadastre-se
          </Link>
        </footer>
        <Image src="/logo/teste.png" alt="Request Center" width={80} height={80} className="mb-6 animate-pulse" />
      </section>
    </div>
  );
}
