import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { Home, Inbox } from "lucide-react"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export async function AppSidebar() {
  const session = await getServerSession(authOptions);
  let items = []
  if (session.user.permissao !== "SOLICITANTE") {
    items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Solicitações",
      url: "/solicitacoes",
      icon: Inbox,
    },
  ]
  } else {
    items = [
      {
        title: "Início",
        url: "/inicio",
        icon: Home,
      },
      {
        title: "Solicitações",
        url: "/MinhasSolicitacoes",
        icon: Inbox,
      },
    ]
  }

    
  return (
    <Sidebar className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg">
      <SidebarHeader className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-center gap-3">
          <img alt="Logo" src="/logo/logo.png" width={32} height={32} className="rounded-sm" />
          <span className="text-1xl font-bold tracking-wide text-blue-400">REQUEST CENTER</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-6 p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-gray-400 tracking-widest">
            Navegação
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
                    >
                      <item.icon className="w-5 h-5 text-blue-300" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>

  )
}