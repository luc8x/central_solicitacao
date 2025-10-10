"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema } from "@/schemas/authSchema"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

// Componentes
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ParticulasDotsBackground from "@/components/TSparticulasBackground"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Icons
import { LoaderCircle, UserPlus, DoorOpen } from "lucide-react"

type FormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [error, setError] = useState("")

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(registerSchema) })

    const onSubmit = async (data: FormData) => {
        setError("")

        const res = await fetch("/api/registra", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
            router.push("/login")
        } else {
            const err = await res.json()
            setError(err.message || "Erro ao registrar")
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <ParticulasDotsBackground />
            <section className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 text-white w-full max-w-md">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Criar Conta</h1>
                    <Link
                        href="/login"
                        className="text-sm flex gap-1 items-center text-blue-300 hover:underline"
                    >
                        <DoorOpen size={16} /> Login
                    </Link>
                </div>

                <p className="mb-6 text-sm text-white/80">
                    Preencha os campos abaixo para se registrar na plataforma.
                </p>

                {/* Social login */}
                <div className="flex gap-3 mb-6">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center text-black"
                    >
                        Google
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center text-black"
                    >
                        Github
                    </Button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center mb-6">
                    <span className="w-full border-t border-white/20"></span>
                    <span className="absolute bg-white px-4 text-xs uppercase rounded-2xl text-black">
                        ou
                    </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col gap-3">
                    <fieldset className="flex flex-col gap-2">
                        <Label>Nome Completo</Label>
                        <Input
                            type="text"
                            {...register("name")}
                            placeholder="Nome completo"
                        />
                        {errors.name && (
                            <p className="text-red-400 text-xs">{errors.name.message}</p>
                        )}
                    </fieldset>

                    <fieldset className="flex flex-col gap-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            {...register("email")}
                            placeholder="exemplo@empresa.com"
                        />
                        {errors.email && (
                            <p className="text-red-400 text-xs">{errors.email.message}</p>
                        )}
                    </fieldset>

                    <fieldset className="flex flex-col gap-2">
                        <Label>Permissões</Label>
                        <Controller
                            name="permissao"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione uma permissão" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SOLICITANTE">Solicitante</SelectItem>
                                        <SelectItem value="ATENDENTE">Atendente</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.permissao && (
                            <p className="text-red-400 text-xs">{errors.permissao.message}</p>
                        )}
                    </fieldset>

                    <fieldset className="flex flex-col gap-2">
                        <Label>Senha</Label>
                        <Input
                            type="password"
                            {...register("password")}
                            placeholder="Digite sua senha"
                        />
                        {errors.password && (
                            <p className="text-red-400 text-xs">{errors.password.message}</p>
                        )}
                    </fieldset>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <Button
                        type="submit"
                        variant="outline"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center gap-2 text-black font-medium rounded-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <LoaderCircle className="animate-spin" /> Registrando...
                            </>
                        ) : (
                            <>
                                <UserPlus /> Criar Conta
                            </>
                        )}
                    </Button>
                </form>
            </section>
        </div>
    )
}
