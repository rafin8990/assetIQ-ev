export const brand = {
  dark: "#373B44",
  green: "#4DC591",
  greenLight: "#e8f8f0",
  greenMuted: "#b8e8d4",
  greenDark: "#3aab7a",
  slate: "#5c6370",
  muted: "#8b95a5",
  border: "#e8eaed",
  surface: "#f8f9fb",
} as const

export const chartColors = [
  brand.green,
  brand.dark,
  brand.greenDark,
  "#6dd4a8",
  "#2d8f65",
] as const

export type StatAccent = "green" | "dark" | "teal" | "mint"

export const statAccentStyles: Record<
  StatAccent,
  {
    card: string
    icon: string
    iconColor: string
    trendUp: string
    trendDown: string
  }
> = {
  green: {
    card: "border-[#4DC591]/25 bg-gradient-to-br from-[#e8f8f0] to-white",
    icon: "bg-[#4DC591]",
    iconColor: "text-white",
    trendUp: "bg-[#4DC591]/15 text-[#2d8f65]",
    trendDown: "bg-red-50 text-red-600",
  },
  dark: {
    card: "border-[#373B44]/15 bg-gradient-to-br from-[#f0f1f3] to-white",
    icon: "bg-[#373B44]",
    iconColor: "text-white",
    trendUp: "bg-[#4DC591]/15 text-[#2d8f65]",
    trendDown: "bg-red-50 text-red-600",
  },
  teal: {
    card: "border-[#3aab7a]/25 bg-gradient-to-br from-[#d9f2e6] to-white",
    icon: "bg-[#3aab7a]",
    iconColor: "text-white",
    trendUp: "bg-[#4DC591]/15 text-[#2d8f65]",
    trendDown: "bg-amber-50 text-amber-700",
  },
  mint: {
    card: "border-[#6dd4a8]/30 bg-gradient-to-br from-[#eefaf4] to-white",
    icon: "bg-gradient-to-br from-[#4DC591] to-[#3aab7a]",
    iconColor: "text-white",
    trendUp: "bg-[#4DC591]/15 text-[#2d8f65]",
    trendDown: "bg-red-50 text-red-600",
  },
}
