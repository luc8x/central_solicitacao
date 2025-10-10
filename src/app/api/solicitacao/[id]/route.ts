import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma/prisma";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: paramId } = await params;
  const id = Number(paramId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const solicitacaoAtual = await prisma.solicitacao.findUnique({ where: { id } });
  if (!solicitacaoAtual) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const userId = session.user.id;

  if (solicitacaoAtual.userId !== userId) {
    return NextResponse.json({ error: "Sem permissão para deletar" }, { status: 403 });
  }

  try {
    await prisma.solicitacao.delete({ where: { id } });
    return NextResponse.json({ message: "Solicitação deletada com sucesso" });
  } catch {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: paramId } = await params;
  const id = Number(paramId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const solicitacao = await prisma.solicitacao.findUnique({
    where: { id },
    include: {
      user: true,
      atendente: true,
      arquivos: true,

    },
  });

  if (!solicitacao) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const userId = session.user.id;
  const permissao = session.user.permissao;

  if (solicitacao.userId !== userId && solicitacao.atendenteId !== userId && permissao !== "ATENDENTE") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  return NextResponse.json(solicitacao);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: paramId } = await params;
  const id = Number(paramId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  
  const contentType = req.headers.get("content-type");
  let data;
  
  if (contentType?.startsWith("multipart/form-data")) {
    // Processar formulário com arquivos
    const formData = await req.formData();
    data = {
      assunto: formData.get("assunto") as string,
      descricao: formData.get("descricao") as string,
      prioridade: formData.get("prioridade") as string,
      status: formData.get("status") as string,
      atendenteId: formData.get("atendenteId") as string,
      arquivos: formData.getAll("arquivo")
    };
  } else {
    // Processar JSON normal
    data = await req.json();
  }
  
  const { assunto, descricao, prioridade, status, atendenteId, arquivos } = data;

  const prioridadesValidas = ["BAIXA", "MEDIA", "ALTA", "CRITICA", "NAO_INFORMADA"];
  const statusValidos = ["ABERTA", "EM_ATENDIMENTO", "FINALIZADA", "CANCELADA"];

  if (
    prioridade && !prioridadesValidas.includes(prioridade) ||
    status && !statusValidos.includes(status)
  ) {
    return NextResponse.json({ error: "Dados inválidos para prioridade ou status" }, { status: 400 });
  }

  const solicitacaoAtual = await prisma.solicitacao.findUnique({ where: { id } });
  if (!solicitacaoAtual) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const userId = session.user.id;
  const permissao = session.user.permissao;

  if (
    (assunto || descricao) && solicitacaoAtual.userId !== userId
  ) {
    return NextResponse.json({ error: "Somente o solicitante pode alterar esses campos" }, { status: 403 });
  }

  if (
    (status || atendenteId || prioridade) && permissao !== "ATENDENTE"
  ) {
    return NextResponse.json({ error: "Somente atendente pode alterar status, prioridade ou assumir solicitação" }, { status: 403 });
  }

  try {
    // Processar arquivos se existirem
    let arquivosProcessados: any[] = [];
    if (arquivos && Array.isArray(arquivos) && arquivos.length > 0) {
      // Verificar limite de 5 arquivos
      if (arquivos.length > 5) {
        return NextResponse.json({ error: "Máximo de 5 imagens permitidas." }, { status: 400 });
      }
      
      // Verificar se todos são imagens
      for (const arquivo of arquivos) {
        if (arquivo instanceof File && arquivo.size > 0 && !arquivo.type?.startsWith("image/")) {
          return NextResponse.json({ error: "Apenas imagens são permitidas." }, { status: 400 });
        }
      }
      
      // Processar os arquivos
      const arquivosFiles = arquivos.filter(arquivo => arquivo instanceof File && arquivo.size > 0) as File[];
      if (arquivosFiles.length > 0) {
        const { processarMultiplosArquivos } = await import("@/lib/solicitacao/arquivo/apiGemini");
        arquivosProcessados = await processarMultiplosArquivos(arquivosFiles);
      }
    }
    
    // Atualizar a solicitação
    const atualizado = await prisma.solicitacao.update({
      where: { id },
      data: {
        ...(assunto && { assunto }),
        ...(descricao && { descricao }),
        ...(prioridade && { prioridade }),
        ...(status && { status }),
        ...(atendenteId && { atendenteId }),
        ...(arquivosProcessados.length > 0 && {
          arquivoUrl: arquivosProcessados[0].urlArquivo,
          arquivoNome: arquivosProcessados[0].nomeArquivo,
          analiseIA: arquivosProcessados[0].resultado,
          arquivos: {
            create: arquivosProcessados.map(arquivo => ({
              arquivoUrl: arquivo.urlArquivo,
              arquivoNome: arquivo.nomeArquivo,
              analiseIA: arquivo.resultado
            }))
          }
        })
      },
      include: {
        arquivos: true
      }
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
