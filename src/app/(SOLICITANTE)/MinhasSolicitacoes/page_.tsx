"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";

// Components
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { EditSolicitacaoForm } from "@/components/solicitacao/editForm";
import { Solicitacao } from "@/components/solicitacao/types";
import { DeletarDialog } from "@/components/solicitacao/deleteForm";

import {
  LoaderCircle,
  SquarePen,
  BadgePlus,
  Mail,
  MessageCircle,
  X,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
} from "lucide-react";
import ChatRecentes from "@/components/chat/chatRecentes";
import { CompartilharPopover } from "@/components/shareSolicitacao/popover";

type FormValues = {
  assunto: string;
  descricao: string;
  arquivo: FileList;
};

const statusColors = {
  ABERTO: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  EM_ATENDIMENTO: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  CONCLUIDO: "bg-green-500/10 text-green-500 border-green-500/20",
  CANCELADO: "bg-red-500/10 text-red-500 border-red-500/20",
};

const prioridadeColors = {
  BAIXA: "bg-green-500/10 text-green-500 border-green-500/20",
  MEDIA: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ALTA: "bg-red-500/10 text-red-500 border-red-500/20",
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ABERTO":
      return <Clock className="h-4 w-4" />;
    case "EM_ATENDIMENTO":
      return <AlertCircle className="h-4 w-4" />;
    case "CONCLUIDO":
      return <CheckCircle2 className="h-4 w-4" />;
    case "CANCELADO":
      return <X className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function SolicitacaoPage() {
  const [dataSolicitacao, setData] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [solicitacaoEdit, setSolicitacaoEdit] = useState<Solicitacao | null>(null);
  const [open, setOpen] = useState(false);
  const [openCadastrar, setOpenCadastrar] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [openSolicitacaoConfirmacaoDialog, setOpenSolicitacaoConfirmacaoDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onSubmit",
  });

  const fetchSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        fields: ['id', 'assunto', 'prioridade', 'status', 'descricao', 'token'].join(',')
      });

      const res = await fetch(`/api/solicitacao/solicitacoes/solicitacoes_solicitante?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error();

      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erro ao buscar solicitações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  const onSubmit = async (data: FormValues) => {
    setError("");
    try {
      const formData = new FormData();
      formData.append("assunto", data.assunto);
      formData.append("descricao", data.descricao);
      
      if (data.arquivo?.length) {
        Array.from(data.arquivo).forEach(arquivo => {
          formData.append("arquivo", arquivo);
        });
      }

      const res = await fetch("/api/solicitacao/solicitacoes/solicitacoes_solicitante/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao cadastrar solicitação.");
        return;
      }

      const novaSolicitacao = await res.json();

      setQrCodeUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/qrcode/${novaSolicitacao.token}}`);
      setOpenSolicitacaoConfirmacaoDialog(true);

      reset();
      fetchSolicitacoes();
      toast.success("Solicitação cadastrada!");
    } catch (e) {
      console.error(e)
      toast.error("Erro na comunicação com o servidor.");
    }
  };

  const handleCloseEdit = () => {
    setSolicitacaoEdit(null);
    setOpen(false);
    fetchSolicitacoes();
  };

  const filteredSolicitacoes = dataSolicitacao.filter(
    (solicitacao) =>
      solicitacao.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitacao.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-[2fr_1fr]">
      {/* Solicitações e Formulário */}
      <section className="flex flex-col gap-4 col-span-1">
        <Card variant="lifted" className="bg-background border-border shadow-lg">
          <CardContent className="p-5">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-xl text-foreground">
                  Minhas Solicitações
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Gerencie e acompanhe suas solicitações
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar solicitação..."
                    className="pl-9 w-full sm:w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
                
                <Dialog open={openCadastrar} onOpenChange={setOpenCadastrar}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 w-full sm:w-auto">
                      <BadgePlus className="w-4 h-4" /> Nova Solicitação
                    </Button>
                  </DialogTrigger>
              <DialogContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSubmit(onSubmit)(e);
                  setOpenCadastrar(false);
                }} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="text-blue-500">Cadastrar Solicitação</DialogTitle>
                  </DialogHeader>

                  <fieldset className="flex flex-col gap-2">
                    <Label htmlFor="assunto">Assunto</Label>
                    <Input
                      id="assunto"
                      {...register("assunto", { required: "Assunto é obrigatório" })}
                      placeholder="Assunto da solicitação"
                    />
                    {errors.assunto && (
                      <p className="text-red-500 text-sm">{errors.assunto.message}</p>
                    )}
                  </fieldset>

                  <fieldset className="flex flex-col gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      {...register("descricao", { required: "Descrição é obrigatória" })}
                      placeholder="Descreva a solicitação"
                    />
                    {errors.descricao && (
                      <p className="text-red-500 text-sm">{errors.descricao.message}</p>
                    )}
                  </fieldset>

                  <fieldset className="flex flex-col gap-2">
                    <Label htmlFor="arquivos">Anexos (máx. 5 imagens)</Label>
                    <Input
                      id="arquivos"
                      type="file"
                      accept="image/*"
                      multiple
                      {...register("arquivo", {
                        validate: (fileList: FileList) => {
                          if (!fileList?.length) return "Pelo menos uma imagem é obrigatória";
                          if (fileList.length > 5) return "Máximo de 5 imagens permitidas";
                          for (let i = 0; i < fileList.length; i++) {
                            if (!fileList[i].type.startsWith("image/")) {
                              return "Apenas imagens são permitidas";
                            }
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.arquivo && (
                      <p className="text-red-500 text-sm">{errors.arquivo.message}</p>
                    )}
                  </fieldset>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">
                        <X />
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="animate-spin w-4 h-4 mr-1" /> Registrando...
                        </>
                      ) : (
                        <>
                          <BadgePlus className="w-4 h-4 mr-1" /> Cadastrar
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={openSolicitacaoConfirmacaoDialog}
              onOpenChange={setOpenSolicitacaoConfirmacaoDialog}
            >
              {qrCodeUrl && (
                <DialogContent className="space-y-1 p-6 rounded-xl shadow-lg">
                  <DialogHeader className="text-center space-y-1">
                    <DialogTitle className="text-blue-600 text-lg font-semibold">
                      Solicitação Registrada!
                    </DialogTitle>
                    <h6 className="text-sm text-gray-700 dark:text-gray-200">
                      Compartilhar via:
                    </h6>
                  </DialogHeader>
                  <div className="flex flex-row items-start justify-between">
                    {/* Botões de compartilhamento */}
                    <div className="flex flex-col gap-5">
                      <div className="flex justify-start gap-2 flex-wrap">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            "Acompanhe sua solicitação: " + qrCodeUrl
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MessageCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm">WhatsApp</span>
                        </a>

                        <a
                          href={`mailto:?subject=Acompanhe sua solicitação&body=${encodeURIComponent(
                            qrCodeUrl
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Mail className="h-5 w-5 text-blue-500" />
                          <span className="text-sm">E-mail</span>
                        </a>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200">Acompanhe e fique por dentro do andamento</p>
                    </div>



                    {/* QR Code */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="flex justify-center"
                    >
                      <QRCode
                        value={qrCodeUrl}
                        size={180}
                        className="bg-white p-3 rounded-lg shadow"
                      />
                    </motion.div>
                  </div>

                </DialogContent>
              )}
            </Dialog>
          </header>

          {/* Lista de Solicitações */}
          {loading ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {[...Array(3)].map((i) => (
                <div key={i} className="p-4 bg-card rounded-lg border border-border animate-pulse">
                  <div className="space-y-3">
                    <div className="h-5 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded-full w-16" />
                      <div className="h-6 bg-muted rounded-full w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredSolicitacoes.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "Nenhuma solicitação encontrada." : "Você ainda não possui solicitações."}
                    </p>
                    {!searchTerm && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Clique em "Nova Solicitação" para começar.
                      </p>
                    )}
                  </motion.div>
                ) : (
                  filteredSolicitacoes.map((solicitacao, index) => (
                    <motion.div
                      key={solicitacao.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {solicitacao.assunto}
                          </h4>
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {solicitacao.descricao}
                          </p>
                        </div>
                        
                        {solicitacao.status !== 'EM_ATENDIMENTO' && (
                          <div className="flex gap-1 ml-4">
                            <DeletarDialog 
                              solicitacao={solicitacao} 
                              onDelete={(id) => setData((prev) => prev.filter((item) => item.id !== id))} 
                            />
                            
                            <Dialog open={open && solicitacaoEdit?.id === solicitacao.id} onOpenChange={setOpen}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DialogTrigger
                                    onClick={() => {
                                      setSolicitacaoEdit(solicitacao);
                                      setOpen(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-muted"
                                    aria-label="Editar solicitação"
                                  >
                                    <SquarePen className="h-4 w-4" />
                                  </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-sm">
                                  Editar
                                </TooltipContent>
                              </Tooltip>
                              <DialogContent>
                                {solicitacaoEdit && (
                                  <EditSolicitacaoForm solicitacao={solicitacaoEdit} onClose={handleCloseEdit} />
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <CompartilharPopover solicitacao={solicitacao} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${statusColors[solicitacao.status as keyof typeof statusColors] || statusColors.ABERTO}`}>
                          {getStatusIcon(solicitacao.status)}
                          {solicitacao.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full border ${prioridadeColors[solicitacao.prioridade as keyof typeof prioridadeColors] || prioridadeColors.MEDIA}`}>
                          {solicitacao.prioridade}
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          {new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </AnimatePresence>
           )}
          </CardContent>
        </Card>
      </section>

      {/* Chats */}
      <ChatRecentes />
    </div>

  );
}
