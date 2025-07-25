"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, Sparkles, Check } from "lucide-react";
import { Sawarabi_Mincho } from "next/font/google";
import { AvatarGroup } from "@lobehub/ui";
import { useAgents, useCurrentUser } from "../hooks/useDatabase";
import { dbHelpers } from "../lib/database";

interface Agent {
	id: string;
	name: string;
	title: string;
	system_prompt: string;
	model: string;
	temperature: number;
	max_output_tokens: number;
	avatar_url?: string;
	created_at: Date;
	updated_at: Date;
}

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

export default function HomePage() {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { agents, loading, error } = useAgents();
	const { user, loading: userLoading, error: userError } = useCurrentUser();
	const [checked, setChecked] = useState<boolean[]>([]);
	const router = useRouter();
	const [errorMsg, setErrorMsg] = useState("");

	// Sync checked state with agents length
	useEffect(() => {
		setChecked((prev) => {
			if (agents.length !== prev.length) {
				return Array(agents.length).fill(false);
			}
			return prev;
		});
	}, [agents.length]);

	const redirectTo = "/group/1";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		setIsLoading(true);

		// Default behavior: redirect after loading
		setTimeout(() => {
			router.push(redirectTo);
		}, 800);
	};

	const handleStartGroupChat = async () => {
		if (!user) {
			setErrorMsg("No user found");
			return;
		}
		setIsLoading(true);
		setErrorMsg("");
		try {
			// Create group
			const group = await dbHelpers.createGroup({
				name: "Untitled",
				description: "",
				created_by: user.id,
			});
			// Add current user as member
			await dbHelpers.addGroupMember({
				group_id: group.id,
				user_id: user.id,
				role: "human",
				status: "active",
			});
			// Add selected agents as members
			const selectedAgentIds = agents
				.filter((_, idx) => checked[idx])
				.map((a) => a.id);
			for (const agentId of selectedAgentIds) {
				await dbHelpers.addGroupMember({
					group_id: group.id,
					agent_id: agentId,
					role: "agent",
					status: "active",
				});
			}
			// Redirect to new group
			setTimeout(() => router.push(`/group/${group.id}`), 100);
		} catch (e) {
			setErrorMsg("Failed to create group");
		} finally {
			setIsLoading(false);
		}
	};

	if (loading || userLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center text-neutral-500">
				Loading agents...
			</div>
		);
	}

	if (error || userError) {
		return (
			<div className="min-h-screen flex items-center justify-center text-red-500">
				{error || userError}
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col justify-center items-center">
			<div className="container mx-auto px-4 py-16 pl-24">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="flex items-center justify-center mb-6">
						<div className="relative">
							<MessageCircle className="w-12 h-12 text-neutral-700 dark:text-neutral-300" />
							<Sparkles className="w-6 h-6 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
						</div>
					</div>
					<h1
						className={`text-3xl md:text-4xl font-light text-neutral-800 dark:text-neutral-200 mb-4 ${sawarabi.className}`}
					>
						NakaChat
					</h1>
					<p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
						Collaborate with AI agents in a harmonious group chat
						experience. Each agent brings unique expertise to your
						conversations.
					</p>
				</div>

				{/* Agent Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
					{agents.slice(0, 9).map((agent: Agent, index: number) => (
						<div
							key={agent.id}
							className={
								"group flex flex-row items-center bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700 transition-all duration-500 min-h-[64px] h-[72px] max-h-[80px] cursor-pointer select-none"
							}
							style={{ animationDelay: `${index * 100}ms` }}
							onClick={() => {
								setChecked((prev) => {
									const next = [...prev];
									next[index] = !next[index];
									return next;
								});
							}}
						>
							<div className="relative mr-3 flex-shrink-0">
								<img
									src={agent.avatar_url}
									alt={agent.name}
									className="w-12 h-12 rounded-full border-2 border-white dark:border-neutral-700 shadow group-hover:scale-105 transition-transform duration-300"
								/>
							</div>
							<div className="flex flex-col justify-center min-w-0 flex-1">
								<h3 className="text-base font-medium text-neutral-800 dark:text-neutral-200 truncate">
									{agent.name}
								</h3>
								<p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate">
									{agent.title}
								</p>
								<p className="text-xs text-neutral-500 dark:text-neutral-500 leading-tight truncate">
									{agent.system_prompt || agent.model}
								</p>
							</div>
							<div className="ml-3 flex items-center">
								<div
									className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-colors duration-200 ${
										checked[index]
											? "bg-amber-400 border-amber-400"
											: "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600"
									}`}
								>
									{checked[index] && (
										<Check className="w-4 h-4 text-white" />
									)}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="flex justify-center mb-4">
					<button
						onClick={handleStartGroupChat}
						disabled={isLoading}
						className="flex hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 items-center gap-2 px-6 py-2 rounded-xl text-base font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-60"
					>
						<ArrowRight className="w-4 h-4" />
						{isLoading ? "Creating..." : "Start Group Chat"}
						<AvatarGroup
							className="ml-1"
							size={20}
							items={agents
								.map((agent: Agent, idx: number) =>
									checked[idx] && agent.avatar_url
										? {
												src: agent.avatar_url,
												key: agent.id,
												name: agent.name,
										  }
										: undefined
								)
								.filter(
									(
										item:
											| {
													src: string;
													key: string;
													name: string;
											  }
											| undefined
									): item is {
										src: string;
										key: string;
										name: string;
									} => Boolean(item)
								)}
						/>
					</button>
					{errorMsg && (
						<div className="text-red-500 text-sm mt-2">
							{errorMsg}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// 为了保持向后兼容，导出一个默认的 Home 组件
export function Home() {
	return <HomePage />;
}
