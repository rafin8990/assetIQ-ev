import Image from "next/image"

import { companyInfo } from "@/lib/company"

type ReportScreenHeaderProps = {
  title: string
  subtitle: string
}

export function ReportScreenHeader({
  title,
  subtitle,
}: ReportScreenHeaderProps) {
  return (
    <div className="rounded-xl border border-[#e8eaed] bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Image
            src={companyInfo.logoPath}
            alt={`${companyInfo.name} logo`}
            width={56}
            height={56}
            className="rounded-xl"
          />
          <div>
            <p className="text-lg font-bold text-[#373B44]">{companyInfo.name}</p>
            <p className="text-sm text-[#8b95a5]">{companyInfo.tagline}</p>
            <p className="mt-1 text-sm text-[#5c6370]">{companyInfo.address}</p>
            <p className="text-sm text-[#5c6370]">
              {companyInfo.phone} | {companyInfo.email}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <h2 className="text-xl font-bold text-[#4DC591]">{title}</h2>
          <p className="mt-1 text-sm text-[#5c6370]">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
