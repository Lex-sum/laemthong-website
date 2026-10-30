"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LayoutDashboard, Package, Building2, MessageSquare, ImageIcon, ChevronRight, Warehouse, Users, Landmark, Wrench, Tags, History } from "lucide-react";
import { TABS } from "@/data/page-image-slots";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Products in SAP B1", href: "/admin/sap-products", icon: Warehouse },
  { title: "Categories", href: "/admin/categories", icon: Tags },
  { title: "Brands", href: "/admin/brands", icon: Building2 },
  { title: "Services", href: "/admin/services", icon: Wrench },
  { title: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
];

const ownerNavItems = [
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Activity Log", href: "/admin/activity", icon: History },
];

export function AdminSidebar({
  isOwner = false,
  newInquiries = 0,
}: {
  isOwner?: boolean;
  /** Inquiries with status "new" — shown as a badge on the menu item. */
  newInquiries?: number;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const searchParams = useSearchParams();
  const isPageContent = pathname.startsWith("/admin/content");
  const activeSection = searchParams.get("section") || TABS[0].value;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo.webp"
            alt="Laemthong Syndicate"
            width={120}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <span className="text-sm font-semibold text-muted-foreground">Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.href === "/admin/inquiries" && newInquiries > 0 && (
                    <SidebarMenuBadge className="bg-primary text-primary-foreground">
                      {newInquiries}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isOwner && (
          <SidebarGroup>
            <SidebarGroupLabel>Owner</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ownerNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Site</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isPageContent}>
                      <ImageIcon className="h-4 w-4" />
                      <span>Page Content</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <SidebarMenuSubItem key={tab.value}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isPageContent && activeSection === tab.value}
                            >
                              <Link href={`/admin/content?section=${tab.value}`}>
                                <Icon className="h-3.5 w-3.5" />
                                <span>{tab.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/admin/company")}>
                  <Link href="/admin/company">
                    <Landmark className="h-4 w-4" />
                    <span>Company Info</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
