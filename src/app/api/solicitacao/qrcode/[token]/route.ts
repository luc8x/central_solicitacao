import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  console.log('token: ', token);

  const solicitacao = await prisma.solicitacao.findFirst({
    where: { token },
  });

  return NextResponse.json(solicitacao);
}
