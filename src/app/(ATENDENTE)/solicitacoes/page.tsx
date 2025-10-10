"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Solicitacao } from "@/components/solicitacao/types";
import { MessageSquareShare } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatRecentes from "@/components/chat/chatRecentes";
export default function SolicitacaoPage() {
  const [dataSolicitacaoAberto, setSolicitacaoAberto] = useState<Solicitacao[]>([]);
  const [dataSolicitacaoAtribuidas, setSolicitacaoAtribuidasa] = useState<Solicitacao[]>([]);
  const [dataSolicitacaoConcluidas, setSolicitacaoConcluidas] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchSolicitacoesAberto = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        fields: ['id', 'assunto', 'prioridade', 'status', 'descricao', 'createdAt'].join(',')
      });

      const res = await fetch(`/api/solicitacao/solicitacoes/solicitacoes_atendente?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error();

      const json = await res.json();
      setSolicitacaoAberto(json);
    } catch {
      toast.error("Erro ao buscar solicitações.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSolicitacaoAtribuidas = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        fields: ['id', 'assunto', 'prioridade', 'status', 'createdAt'].join(',')
      });

      const res = await fetch(`/api/solicitacao/solicitacoes/solicitacoes_atendente/atribuidas/?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error();

      const json = await res.json();
      setSolicitacaoAtribuidasa(json);
    } catch {
      toast.error("Erro ao buscar solicitações.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSolicitacaoConcluidas = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        fields: ['id', 'assunto', 'prioridade', 'status', 'descricao', 'createdAt'].join(',')
      });

      const res = await fetch(`/api/solicitacao/solicitacoes/solicitacoes_atendente/concluidas/?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error();

      const json = await res.json();
      setSolicitacaoConcluidas(json);
    } catch {
      toast.error("Erro ao buscar solicitações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      path: "/api/socket_io",
    });

    socketRef.current = socket;

    socket.emit("solicitacoes");

    socket.on("nova_solicitacao", (solicitacao) => {
      setSolicitacaoAberto((prev) => {
        if (prev.some(s => s.id === solicitacao.id)) {
          return prev;
        }
        return [...prev, solicitacao];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchSolicitacoesAberto();
    fetchSolicitacaoAtribuidas();
    fetchSolicitacaoConcluidas();
  }, [fetchSolicitacoesAberto, fetchSolicitacaoAtribuidas, fetchSolicitacaoConcluidas]);

  const router = useRouter();

  const atenderSolicitacao = async (solicitacaoId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/solicitacao/${solicitacaoId}/atender`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Erro ao assumir a solicitação.");
      }

      toast.success("Solicitação atribuída com sucesso!");
      await router.push(`/chat/${solicitacaoId}`);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao assumir a solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`grid gap-6 grid-cols-1 md:grid-cols-[2fr_1fr] text-gray-100`}>

      {/* Solicitações e Formulário */}
      <section className='flex flex-col gap-4 col-span-1'>
        {/* Lista de Solicitações em aberto */}
        <div className="rounded-xl p-5 bg-gray-800 border border-gray-700 shadow-lg">
          <header className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-blue-400">Solicitações em Aberto</h3>
          </header>

          {loading ? (
            <div className="max-h-80 overflow-auto flex flex-col gap-4 pr-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl p-4 bg-gray-700 animate-pulse flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-gray-500 rounded w-1/3" />
                    <div className="h-3 bg-gray-600 rounded w-1/2" />
                    <div className="h-3 bg-gray-600 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : dataSolicitacaoAberto.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma solicitação encontrada.</p>
          ) : (
            <ScrollArea className="max-h-80 rounded-md flex flex-col">
              {dataSolicitacaoAberto.map((solicitacao) => (
                <Dialog key={solicitacao.id}>
                  <DialogTrigger asChild>
                    <div
                      key={solicitacao.id}
                      className="rounded-xl p-4 bg-gray-700 hover:bg-gray-600 transition-colors flex justify-between items-start cursor-pointer mb-4"
                    >
                      <div>
                        <h4 className="text-base font-semibold text-white">{solicitacao.assunto}</h4>
                        <p className="text-sm text-gray-400">
                          Prioridade: <span className="font-medium">{solicitacao.prioridade}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Status: <span className="font-medium">{solicitacao.status}</span>
                        </p>
                      </div>

                    </div>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-blue-400">Detalhes da Solicitação</DialogTitle>
                      <DialogDescription>
                        Aqui estão as informações completas da solicitação.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-sm text-gray-900">
                      <p><strong>Assunto:</strong> {solicitacao.assunto}</p>
                      <p><strong>Descrição:</strong> {solicitacao.descricao}</p>
                      <p><strong>Prioridade:</strong> {solicitacao.prioridade}</p>
                      <p><strong>Status:</strong> {solicitacao.status}</p>
                      <p>
                        <strong>Data de abertura:</strong>{" "}
                        {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(solicitacao.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => atenderSolicitacao(solicitacao.id)} disabled={loading}>
                        <MessageSquareShare className="h-4 w-4" /> {loading ? "Atualizando..." : "Atender"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              ))}
            </ScrollArea>
          )}
        </div>

        {/* Lista de Solicitações Atribuidas */}
        <div className="rounded-xl p-5 bg-gray-800 border border-gray-700 shadow-lg">
          <header className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-blue-400">Solicitações Atribuidas a Você</h3>
          </header>

          {loading ? (
            <div className="max-h-80 overflow-auto flex flex-col gap-4 pr-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl p-4 bg-gray-700 animate-pulse flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-gray-500 rounded w-1/3" />
                    <div className="h-3 bg-gray-600 rounded w-1/2" />
                    <div className="h-3 bg-gray-600 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : dataSolicitacaoAtribuidas.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma solicitação encontrada.</p>
          ) : (
            <ScrollArea className="max-h-80 rounded-md flex flex-col">
              {dataSolicitacaoAtribuidas.map((solicitacao) => (
                <Dialog key={solicitacao.id}>
                  <DialogTrigger asChild>
                    <div
                      key={solicitacao.id}
                      className="rounded-xl p-4 bg-gray-700 hover:bg-gray-600 transition-colors flex justify-between items-start cursor-pointer mb-4"
                    >
                      <div>
                        <h4 className="text-base font-semibold text-white">{solicitacao.assunto}</h4>
                        <p className="text-sm text-gray-400">
                          Prioridade: <span className="font-medium">{solicitacao.prioridade}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Status: <span className="font-medium">{solicitacao.status}</span>
                        </p>
                      </div>

                    </div>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-blue-400">Detalhes da Solicitação</DialogTitle>
                      <DialogDescription>
                        Aqui estão as informações completas da solicitação.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-sm text-gray-900">
                      <p><strong>Assunto:</strong> {solicitacao.assunto}</p>
                      <p><strong>Descrição:</strong> {solicitacao.descricao}</p>
                      <p><strong>Prioridade:</strong> {solicitacao.prioridade}</p>
                      <p><strong>Status:</strong> {solicitacao.status}</p>
                      <p>
                        <strong>Data de abertura:</strong>{" "}
                        {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(solicitacao.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </ScrollArea>
          )}
        </div>

        {/* Lista de Solicitações concluidas */}
        <div className="rounded-xl p-5 bg-gray-800 border border-gray-700 shadow-lg">
          <header className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-blue-400">Solicitações Concluidas</h3>
          </header>

          {loading ? (
            <div className="max-h-80 overflow-auto flex flex-col gap-4 pr-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl p-4 bg-gray-700 animate-pulse flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-gray-500 rounded w-1/3" />
                    <div className="h-3 bg-gray-600 rounded w-1/2" />
                    <div className="h-3 bg-gray-600 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : dataSolicitacaoConcluidas.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma solicitação encontrada.</p>
          ) : (
            <ScrollArea className="max-h-80 rounded-md flex flex-col">
              {dataSolicitacaoConcluidas.map((solicitacao) => (
                <Dialog key={solicitacao.id}>
                  <DialogTrigger asChild>
                    <div
                      key={solicitacao.id}
                      className="rounded-xl p-4 bg-gray-700 hover:bg-gray-600 transition-colors flex justify-between items-start cursor-pointer mb-4"
                    >
                      <div>
                        <h4 className="text-base font-semibold text-white">{solicitacao.assunto}</h4>
                        <p className="text-sm text-gray-400">
                          Prioridade: <span className="font-medium">{solicitacao.prioridade}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Status: <span className="font-medium">{solicitacao.status}</span>
                        </p>
                      </div>

                    </div>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-blue-400">Detalhes da Solicitação</DialogTitle>
                      <DialogDescription>
                        Aqui estão as informações completas da solicitação.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-sm text-gray-900">
                      <p><strong>Assunto:</strong> {solicitacao.assunto}</p>
                      <p><strong>Descrição:</strong> {solicitacao.descricao}</p>
                      <p><strong>Prioridade:</strong> {solicitacao.prioridade}</p>
                      <p><strong>Status:</strong> {solicitacao.status}</p>
                      <p>
                        <strong>Data de abertura:</strong>{" "}
                        {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(solicitacao.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {solicitacao.closingAt && (
                        <p>
                          <strong>Data de fechamento:</strong>{" "}
                          {new Date(solicitacao.closingAt).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(solicitacao.closingAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

              ))}
            </ScrollArea>
          )}
        </div>
      </section>

      {/* Chats */}
      <ChatRecentes />
    </div>

  );
}
