"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sawarabi_Mincho } from "next/font/google";
import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

const mockGroups = [
	{ id: 1, name: "AI Researchers" },
	{ id: 2, name: "Design Team" },
	{ id: 3, name: "Friends" },
];

export default function Sidebar() {
	const pathname = usePathname();
	const match = pathname.match(/\/group\/(\d+)/);
	const groupId = match ? Number(match[1]) : undefined;

	return (
		<aside
			className="w-56 sm:w-64 h-screen fixed left-0 top-0 z-20 px-4 py-8 bg-white dark:bg-neutral-900 flex flex-col gap-2 justify-between overflow-hidden border-none select-none"
			style={{ WebkitOverflowScrolling: "auto" }}
		>
			<nav className="flex flex-col gap-1">
				{mockGroups.map((group) => (
					<Link
						key={group.id}
						href={`/group/${group.id}`}
						className={`text-left px-3 py-2 rounded-lg bg-transparent transition-colors text-neutral-800 dark:text-neutral-200 focus:outline-none hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
							groupId === group.id
								? "font-semibold bg-neutral-100 dark:bg-neutral-800"
								: ""
						}`}
					>
						{group.name}
					</Link>
				))}
			</nav>
			<div className="mt-8 px-6 text-center select-none flex items-center justify-between gap-2">
				<span
					className={`${sawarabi.className} text-xl text-neutral-700 dark:text-neutral-200 tracking-wide`}
				>
					NakaChat
				</span>
				<DarkModeSwitch />
			</div>
		</aside>
	);
}

function DarkModeSwitch() {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null; // Prevents SSR mismatch

	const isDark = resolvedTheme === "dark";
	return (
		<button
			onClick={() => setTheme(isDark ? "light" : "dark")}
			aria-label="Toggle dark mode"
			className="ml-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
			type="button"
		>
			{isDark ? <Sun size={16} /> : <Moon size={16} />}
		</button>
	);
}
