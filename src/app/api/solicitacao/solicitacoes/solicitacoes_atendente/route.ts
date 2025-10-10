import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    where: { atendenteId: null },
    select
  });

  return NextResponse.json(solicitacoes);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: paramId } = await params;
  const solicitacaoId = Number(paramId);

  try {
    const solicitacao = await prisma.solicitacao.update({
      where: { id: solicitacaoId },
      data: {
        atendenteId: session.user.id,
        status: "EM_ATENDIMENTO",
      },
    });

    return NextResponse.json(solicitacao, { status: 200 });
  } catch (error) {
    console.error("Erro ao atender solicitação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
