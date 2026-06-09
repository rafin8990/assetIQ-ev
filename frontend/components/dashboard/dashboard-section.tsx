import { StatCard } from "@/components/dashboard/stat-card"
import type { DashboardStatSection } from "@/types"

type DashboardSectionProps = DashboardStatSection

export function DashboardSection({
  title,
  description,
  stats,
}: DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[#373B44]">{title}</h3>
        {description && (
          <p className="text-sm text-[#8b95a5]">{description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map(stat => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </section>
  )
}
