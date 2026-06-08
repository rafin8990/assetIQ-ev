export const companyInfo = {
  name: "EtherTech EV",
  tagline: "EV Warehouse Management System",
  address: "House No 18, Road no: 06, Gulshan 1, Dhaka 1212",
  phone: "+880 1712-345678",
  email: "info@ethertech.ev",
  logoPath: "/logo/ev-logo.svg",
  pdfLogoPath: "/favicon/android-chrome-512x512.png",
} as const

export function getCompanyLogoUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${companyInfo.pdfLogoPath}`
  }

  return companyInfo.pdfLogoPath
}
