import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getIO } from "@/lib/socket";
import { writeFile } from "fs/promises";
import { v4 as uuid } from "uuid";
import path from "path";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await context.params;
    const solicitacaoId = Number(id);
    if (isNaN(solicitacaoId))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const mensagens = await prisma.mensagem.findMany({
      where: { solicitacaoId: solicitacaoId },
      orderBy: { createdAt: "asc" },
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(mensagens);

  } catch (err) {
    console.error("Erro no GET /api/solicitacao/chat/:id", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await context.params;
  const solicitacaoId = Number(id);

  if (isNaN(solicitacaoId))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const contentType = request.headers.get("content-type");

  if (!contentType?.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Tipo de conteúdo inválido" }, { status: 400 });
  }

  const formData = await request.formData();
  const conteudo = (formData.get("conteudo") as string)?.trim();
  const arquivo = formData.get("arquivo") as File | null;
  const arquivoNome = arquivo?.name ?? null;

  if (!conteudo && !arquivo) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  let arquivoUrl: string | null = null;

  if (arquivo) {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const ext = path.extname(arquivo.name);
    const nomeArquivo = `${uuid()}${ext}`;
    const caminho = path.join(process.cwd(), "public", "uploads", "mensagens", nomeArquivo);

    await writeFile(caminho, buffer);

    arquivoUrl = `/uploads/mensagens/${nomeArquivo}`;
  }

  const novaMensagem = await prisma.mensagem.create({
    data: {
      conteudo: conteudo ?? "",
      autorId: session.user.id,
      solicitacaoId,
      arquivoUrl: arquivoUrl,
      arquivoNome: arquivoNome,
    },
    include: {
      autor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const io = getIO();
  io.to(String(solicitacaoId)).emit("nova_mensagem", novaMensagem);
  io.to("solicitacoes").emit("nova_mensagem", novaMensagem);

  return NextResponse.json(novaMensagem);
}