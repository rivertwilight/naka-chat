"use client";

import { Geist, Geist_Mono } from "next/font/google";
import React from "react";
import Sidebar from "../components/Sidebar";
import { ThemeProvider } from "next-themes";
import { UiProvider } from "../components/UiContext";
import { PersistanceProvider } from "../components/PersistanceContext";
import { GoogleAnalytics } from "@next/third-parties/google";

import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
				<PersistanceProvider>
					<UiProvider>
						<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
							<div className="flex bg-white dark:bg-neutral-900 dark:text-white">
								<Sidebar />
								<div className="flex-1 md:ml-72 md:sm:ml-80 mr-0 md:mr-56 md:sm:mr-64 min-h-screen relative w-full">
									{children}
								</div>
							</div>
						</ThemeProvider>
					</UiProvider>
				</PersistanceProvider>
			</body>
		</html>
	);
}
