import type { Metadata } from "next"
import { Settings } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Settings",
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your platform preferences and account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Manage notifications, display preferences, and integrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            "Email notifications",
            "Fleet alert thresholds",
            "API integrations",
            "Data export preferences",
          ].map((setting) => (
            <div key={setting}>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">{setting}</span>
                <span className="text-xs text-muted-foreground">
                  Configure
                </span>
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
