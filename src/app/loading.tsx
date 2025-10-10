'use client'

import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-black">
      <Image src="/logo.png" alt="Request Center" width={80} height={80} className="mb-6 animate-pulse" />
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent"></div>
      <p className="text-blue-200 text-sm mt-4">Carregando Request Center...</p>
    </div>
  );
}
