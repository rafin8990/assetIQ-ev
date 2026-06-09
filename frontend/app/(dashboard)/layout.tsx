import { AuthGuard } from "@/components/auth/auth-guard"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <DashboardShell>
        <PermissionGuard>{children}</PermissionGuard>
      </DashboardShell>
    </AuthGuard>
  )
}
