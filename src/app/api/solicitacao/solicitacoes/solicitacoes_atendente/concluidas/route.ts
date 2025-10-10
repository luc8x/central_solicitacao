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
    where: {
      atendenteId: session?.user?.id,
      status: {
        in: ['CANCELADA', 'FINALIZADA'],
      },
    },
    select,
  });

  return NextResponse.json(solicitacoes);
}