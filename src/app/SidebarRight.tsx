"use client";
import React from "react";
import { ArrowRight, X, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SliderWithInput } from "@lobehub/ui";
import { useGroupMembers } from "../hooks/useDatabase";

interface Member {
	id: string;
	name: string;
	role: string;
	status: "active" | "muted";
	type: "human" | "agent";
	thinking?: boolean;
}

interface SidebarRightProps {
	groupId: string | null;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ groupId }) => {
	const { members: dbMembers, loading } = useGroupMembers(groupId);
	const [selectedMember, setSelectedMember] = React.useState<null | Member>(
		null
	);
	const [thinkingStates, setThinkingStates] = React.useState<
		Record<string, boolean>
	>({});

	// Transform database members to component format
	const members: Member[] = React.useMemo(() => {
		return dbMembers.map((dbMember) => {
			const isAgent = dbMember.role === "agent";
			const details = dbMember.details;

			return {
				id: dbMember.id,
				name: details?.name || "Unknown",
				role: isAgent ? details?.title || "Agent" : "Human",
				status: dbMember.status,
				type: dbMember.role,
				thinking: thinkingStates[dbMember.id] || false,
			};
		});
	}, [dbMembers, thinkingStates]);

	// Helper to toggle thinking state
	const toggleThinking = (memberId: string) => {
		setThinkingStates((prev) => ({
			...prev,
			[memberId]: !prev[memberId],
		}));
	};

	if (loading) {
		return (
			<aside className="hidden md:flex flex-col gap-4 w-56 sm:w-64 h-screen fixed right-0 top-0 z-20 px-4 py-8 select-none">
				<div className="flex items-center justify-center h-32">
					<Loader className="animate-spin" size={20} />
				</div>
			</aside>
		);
	}

	return (
		<aside className="hidden md:flex flex-col gap-4 w-56 sm:w-64 h-screen fixed right-0 top-0 z-20 px-4 py-8 select-none">
			<AnimatePresence initial={false} mode="wait">
				{!selectedMember ? (
					<motion.ul
						key="list"
						initial={{ x: 64, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 64, opacity: 0 }}
						transition={{
							type: "spring",
							stiffness: 400,
							damping: 40,
						}}
						className="flex flex-col gap-2"
					>
						{members.map((member) => (
							<button
								key={member.id}
								className={`flex flex-col items-start group relative px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left ${
									member.status === "muted"
										? "opacity-60 cursor-not-allowed"
										: ""
								}`}
								onClick={() =>
									member.status === "active" &&
									setSelectedMember(member)
								}
								style={{
									outline: "none",
									border: "none",
									background: "none",
								}}
								disabled={member.status === "muted"}
							>
								<span
									className={`${
										member.status === "muted"
											? "text-neutral-400 dark:text-neutral-600"
											: "text-neutral-900 dark:text-neutral-100"
									} font-medium flex items-center`}
								>
									{member.name}
									<span className="ml-2 relative flex items-center">
										<ArrowRight
											size={16}
											className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
										/>
									</span>
								</span>
								<span
									className={`text-xs ${
										member.status === "muted"
											? "text-neutral-400 dark:text-neutral-600"
											: "text-neutral-500 dark:text-neutral-400"
									} flex items-center gap-1 ${
										member.thinking ? "animate-pulse" : ""
									}`}
								>
									{member.thinking ? "Thinking" : member.role}
									{member.thinking && (
										<span className="mr-1">
											<Loader
												className="animate-spin"
												size={14}
											/>
										</span>
									)}
								</span>
							</button>
						))}
					</motion.ul>
				) : (
					<motion.div
						key="detail"
						initial={{ x: 64, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 64, opacity: 0 }}
						transition={{
							type: "spring",
							stiffness: 400,
							damping: 40,
						}}
						className="relative h-full flex flex-col"
					>
						<button
							className="absolute top-0 right-0 m-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
							onClick={() => setSelectedMember(null)}
							aria-label="Close"
						>
							<X size={20} />
						</button>
						<div className="flex flex-col pt-4 flex-1 gap-2">
							<span
								className={`text-lg font-semibold ${
									selectedMember?.status === "muted"
										? "text-neutral-300 dark:text-neutral-600"
										: "text-neutral-900 dark:text-neutral-100"
								}`}
							>
								{selectedMember.name}
							</span>

							{/* Show thinking toggle for agents */}
							{selectedMember.type === "agent" && (
								<div className="w-full flex items-center justify-between mt-4">
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										Mute
									</span>
									<label
										className="relative inline-flex items-center cursor-pointer select-none"
										style={{ minWidth: "2.25rem" }}
									>
										<input
											type="checkbox"
											checked={selectedMember.thinking}
											onChange={() =>
												toggleThinking(
													selectedMember.id
												)
											}
											className="sr-only peer"
										/>
										<div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full transition-colors peer-focus:outline-none peer-checked:bg-neutral-400 dark:peer-checked:bg-neutral-500" />
										<span
											className="absolute left-0.5 top-0.5 w-4 h-4 bg-white dark:bg-neutral-900 rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4 border border-neutral-300 dark:border-neutral-800"
											style={{ pointerEvents: "none" }}
										/>
									</label>
								</div>
							)}

							{/* Member config panel UI - only show for agents */}
							{selectedMember.type === "agent" && (
								<>
									<div className="w-full flex flex-col gap-1 mt-4">
										<textarea
											id="prompt-input"
											rows={5}
											className="w-full px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition resize-none"
											placeholder="Enter prompt..."
										/>
									</div>
									<div className="w-full flex items-center justify-between mt-4">
										<span className="text-xs text-neutral-500 dark:text-neutral-400">
											Web Search
										</span>
										<label
											className="relative inline-flex items-center cursor-pointer select-none"
											style={{ minWidth: "2.25rem" }}
										>
											<input
												type="checkbox"
												value=""
												className="sr-only peer"
											/>
											<div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full transition-colors peer-focus:outline-none peer-checked:bg-neutral-400 dark:peer-checked:bg-neutral-500" />
											<span
												className="absolute left-0.5 top-0.5 w-4 h-4 bg-white dark:bg-neutral-900 rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4 border border-neutral-300 dark:border-neutral-800"
												style={{
													pointerEvents: "none",
												}}
											/>
										</label>
									</div>

									{/* Temperature slider */}
									<div className="w-full flex flex-col gap-1 mt-4">
										<span className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
											Temperature
										</span>
										<SliderWithInput
											min={0}
											max={2}
											step={0.01}
											defaultValue={1}
											className="w-full"
										/>
									</div>
								</>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</aside>
	);
};

export default SidebarRight;
