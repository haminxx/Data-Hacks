import { EnterpriseAuthGuard } from "@/components/enterprise/EnterpriseAuthGuard";

export default function EnterprisePortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <EnterpriseAuthGuard>
      <div className="min-h-screen bg-[#0B1220]">{children}</div>
    </EnterpriseAuthGuard>
  );
}
