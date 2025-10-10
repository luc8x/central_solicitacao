import { prisma } from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramId } = await params;
  const solicitacaoId = parseInt(paramId, 10);
  const { status } = await req.json();

  if (!solicitacaoId || !status) {
    return NextResponse.json({ error: "ID e status são obrigatórios" }, { status: 400 });
  }

  const validStatus = ["FINALIZADA", "CANCELADA"];
  if (!validStatus.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    const updated = await prisma.solicitacao.update({
      where: { id: solicitacaoId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
