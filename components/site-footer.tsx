import Link from "next/link";
import { APPS } from "@/lib/apps";
import { SeerMark } from "./mark";

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-text/85">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-8 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-1.5">
            <SeerMark size={18} />
            <span className="text-[17px] font-semibold tracking-[-0.045em]">seer</span>
          </div>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-text-2">
            Design prototype for Seer&apos;s six interfaces on the Electric Foundation kit. Market data is read
            live from Seer&apos;s public endpoints; trading and wallets are simulated.
          </p>
          <Link href="/about" className="mt-4 inline-flex text-[13px] text-signal underline-offset-4 hover:underline">
            Design rationale, departures &amp; data sources →
          </Link>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {APPS.map((a) => (
            <Link key={a.key} href={a.href} className="text-[13px] text-text-2 hover:text-text">
              {a.name}
            </Link>
          ))}
          <Link href="/about" className="text-[13px] text-text-2 hover:text-text">About this design</Link>
        </nav>
      </div>
    </footer>
  );
}
