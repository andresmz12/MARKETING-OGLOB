"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: string[][] }) {
  const path = usePathname();
  return (
    <nav className="flex flex-1 gap-1 overflow-x-auto whitespace-nowrap text-sm">
      {links.map(([href, label]) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`rounded-md px-3 py-1.5 font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
