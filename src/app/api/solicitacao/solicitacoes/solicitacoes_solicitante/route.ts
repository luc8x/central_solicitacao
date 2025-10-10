import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { writeFile } from "fs/promises";
import { imageQueue } from "@/lib/solicitacao/arquivo/imageQueue";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.permissao !== "SOLICITANTE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Tipo de conteúdo inválido" }, { status: 400 });
  }

  const formData = await req.formData();
  const assunto = (formData.get("assunto") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();

  if (!assunto || !descricao) {
    return NextResponse.json({ error: "Assunto e descrição são obrigatórios" }, { status: 400 });
  }

  const arquivos = formData.getAll("arquivo").filter(a => a instanceof File) as File[];
  if (arquivos.length > 5) {
    return NextResponse.json({ error: "Máximo de 5 imagens permitidas." }, { status: 400 });
  }

  const novaSolicitacao = await prisma.solicitacao.create({
    data: {
      assunto,
      descricao,
      userId: session.user.id,
      token: uuidv4(),
    }
  });

  for (const arquivo of arquivos) {
    const ext = path.extname(arquivo.name).slice(1).toLowerCase();
    const nomeArquivo = `${uuidv4()}.${ext}`;
    const caminho = path.join(process.cwd(), "public", "uploads", "solicitacoes", nomeArquivo);
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const base64 = buffer.toString("base64");

    await writeFile(caminho, buffer);

    const arq = await prisma.arquivoSolicitacao.create({
      data: {
        solicitacaoId: novaSolicitacao.id,
        arquivoNome: nomeArquivo,
        arquivoBase64: `data:${arquivo.type};base64,${base64}`,
        analiseIA: null,
      },
    });

    await imageQueue.add("analise-imagem", {
      arquivoId: arq.id,
      arquivoNome: nomeArquivo,
      arquivoBuffer: buffer.toString("base64"),
      arquivoType: arquivo.type,
    });
  }

  return NextResponse.json(novaSolicitacao, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const fieldsParam = req.nextUrl.searchParams.get("fields");
  const fields = fieldsParam?.split(",") ?? [];

  const select = fields.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {} as Record<string, boolean>);

  if (fields.length === 0) {
    return NextResponse.json({ error: "Nenhum campo solicitado." }, { status: 400 });
  }

  const solicitacoes = await prisma.solicitacao.findMany({
    where: { userId: session.user.id },
    select
  });

  return NextResponse.json(solicitacoes);
}
