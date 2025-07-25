"use client";
import React from "react";
import { ArrowRight, X, Loader, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SliderWithInput } from "@lobehub/ui";
import { useGroupMembers } from "../hooks/useDatabase";
import { useGroup } from "../hooks/useDatabase";
import { dbHelpers } from "../lib/database";
import Dialog from "../components/Dialog";
import { db } from "../lib/database";

const FIRST_NAMES = ["Alex", "Jamie", "Taylor", "Jordan", "Morgan", "Casey", "Riley", "Avery", "Skyler", "Quinn"];
const LAST_NAMES = ["Chen", "Smith", "Lee", "Patel", "Kim", "Garcia", "Singh", "Khan", "Nguyen", "Yamamoto"];

interface Member {
	id: string;
	name: string;
	role: string;
	status: "active" | "muted";
	type: "human" | "agent";
	thinking?: boolean;
	system_prompt?: string;
}

interface SidebarRightProps {
	groupId: string | null;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ groupId }) => {
	const { members: dbMembers, loading } = useGroupMembers(groupId);
	const [groupVersion, setGroupVersion] = React.useState(0);
	const { group, loading: groupLoading } = useGroup(groupId, groupVersion);
	const [selectedMember, setSelectedMember] = React.useState<null | Member>(
		null
	);
	const [thinkingStates, setThinkingStates] = React.useState<
		Record<string, boolean>
	>({});
	const [descEdit, setDescEdit] = React.useState<string>("");
	const [descEditing, setDescEditing] = React.useState(false);
	const [descSaving, setDescSaving] = React.useState(false);
	const [nameEdit, setNameEdit] = React.useState<string>("");
	const [nameEditing, setNameEditing] = React.useState(false);
	const [nameSaving, setNameSaving] = React.useState(false);
	const [isAddOpen, setAddOpen] = React.useState(false);
	const [addLoading, setAddLoading] = React.useState(false);
	const [addError, setAddError] = React.useState("");
	const [allAgents, setAllAgents] = React.useState<any[]>([]);
	const [allUsers, setAllUsers] = React.useState<any[]>([]);
	const [selectedId, setSelectedId] = React.useState<string>("");
	const [selectedType, setSelectedType] = React.useState<
		"agent" | "human" | ""
	>("");
	const [promptEdit, setPromptEdit] = React.useState<string>("");

	React.useEffect(() => {
		if (group && !nameEditing) setNameEdit(group.name || "");
	}, [group, nameEditing]);

	React.useEffect(() => {
		if (group && !descEditing) setDescEdit(group.description || "");
	}, [group, descEditing]);

	// Load all agents and users not already in the group
	React.useEffect(() => {
		if (!isAddOpen) return;
		(async () => {
			const groupMemberIds = new Set(
				dbMembers.map((m) => m.user_id || m.agent_id)
			);
			const agents = (await db.agents.toArray()).filter(
				(a) => !groupMemberIds.has(a.id)
			);
			const users = (await db.users.toArray()).filter(
				(u) => !groupMemberIds.has(u.id)
			);
			setAllAgents(agents);
			setAllUsers(users);
			setSelectedId("");
			setSelectedType("");
		})();
	}, [isAddOpen, dbMembers]);

	const handleNameSave = async () => {
		if (!groupId) return;
		setNameSaving(true);
		await dbHelpers.updateGroup(groupId, { name: nameEdit });
		setNameEditing(false);
		setNameSaving(false);
		setGroupVersion((v) => v + 1);
	};

	const handleDescSave = async () => {
		if (!groupId) return;
		setDescSaving(true);
		await dbHelpers.updateGroup(groupId, { description: descEdit });
		setDescEditing(false);
		setDescSaving(false);
		setGroupVersion((v) => v + 1);
	};

	// Remove FIRST_NAMES, LAST_NAMES, getRandomName, getRandomAvatar for user, and only use for agent
	// In the Invite Member button, change logic to create a new agent:
	function getRandomName() {
		const first =
			FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
		const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
		return `${first} ${last}`;
	}
	function getRandomAvatar(name: string) {
		return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
			name
		)}`;
	}

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
				system_prompt: isAgent ? details?.system_prompt : undefined,
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

	// When selectedMember changes, set promptEdit to the agent's system_prompt
	React.useEffect(() => {
		if (selectedMember && selectedMember.type === "agent") {
			setPromptEdit(selectedMember.system_prompt || "");
		}
	}, [selectedMember]);

	if (loading || groupLoading) {
		return (
			<aside className="hidden md:flex flex-col gap-4 w-56 sm:w-64 h-screen fixed right-0 top-0 z-20 px-4 py-8 select-none">
				<div className="flex items-center justify-center h-32">
					<Loader className="animate-spin" size={20} />
				</div>
			</aside>
		);
	}

	return (
		<aside className="hidden md:flex flex-col gap-4 w-56 sm:w-72 h-screen fixed right-0 top-0 z-20 px-4 py-8 select-none">
			{/* Group name and description */}

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
						{group && (
							<div className="mb-2 flex flex-col gap-2 pb-4">
								{/* Editable group name */}
								<div className="flex items-start gap-2">
									{nameEditing ? (
										<input
											type="text"
											className="w-full px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition"
											value={nameEdit}
											onChange={(e) =>
												setNameEdit(e.target.value)
											}
											onBlur={handleNameSave}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleNameSave();
												}
											}}
											autoFocus
											maxLength={40}
										/>
									) : (
										<span
											className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 cursor-pointer"
											title={group.name}
											onClick={() => setNameEditing(true)}
										>
											{group.name}
										</span>
									)}
									{nameSaving && (
										<Loader
											size={18}
											className="animate-spin ml-2"
										/>
									)}
								</div>
								<div className="flex items-start gap-2">
									{descEditing ? (
										<textarea
											className="w-full px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition resize-none"
											value={descEdit}
											onChange={(e) =>
												setDescEdit(e.target.value)
											}
											onBlur={async () => {
												if (!groupId) return;
												setDescSaving(true);
												await dbHelpers.updateGroup(
													groupId,
													{ description: descEdit }
												);
												setDescEditing(false);
												setDescSaving(false);
												setGroupVersion((v) => v + 1);
											}}
											autoFocus
											rows={2}
											maxLength={120}
										/>
									) : (
										<div className="flex-1 flex items-center min-h-[2.5rem]">
											<span
												className="text-md text-neutral-500 dark:text-neutral-400 break-words whitespace-pre-line flex-1 cursor-pointer"
												style={{ minHeight: "2.5rem" }}
												onClick={() =>
													setDescEditing(true)
												}
											>
												{group.description || (
													<span className="italic text-neutral-300 dark:text-neutral-600">
														説明がありません
													</span>
												)}
											</span>
											{descSaving && (
												<Loader
													size={14}
													className="animate-spin ml-2"
												/>
											)}
										</div>
									)}
								</div>
							</div>
						)}
						<button
							type="button"
							className="mt-2 flex items-center gap-2 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-md font-medium focus:outline-none disabled:opacity-60"
							onClick={async () => {
								if (!groupId) return;
								setAddLoading(true);
								try {
									const name = getRandomName();
									const avatar_url = getRandomAvatar(name);
									// Create agent in DB
									const agent = await dbHelpers.createAgent({
										name,
										title: "Agent",
										system_prompt: "",
										model: "gemini-2.0-flash-exp",
										temperature: 1,
										max_output_tokens: 1000,
										avatar_url,
									});
									await dbHelpers.addGroupMember({
										group_id: groupId,
										agent_id: agent.id,
										role: "agent",
										status: "active",
									});
								} catch (e) {
									// Optionally handle error
								} finally {
									setAddLoading(false);
								}
							}}
							disabled={addLoading}
						>
							{addLoading ? (
								<Loader size={16} className="animate-spin" />
							) : (
								<Plus size={16} />
							)}
							<span>
								{addLoading
									? "Creating..."
									: "Create new agent"}
							</span>
						</button>
						<button
							type="button"
							className="mt-1 mb-4 flex items-center gap-2 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-md font-medium focus:outline-none disabled:opacity-60"
							onClick={() => setAddOpen(true)}
						>
							<Plus size={16} />
							<span>Invite member</span>
						</button>
						{members.map((member) => (
							<button
								key={member.id}
								className={`flex flex-col items-start group relative py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left ${
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
									{member.type === "agent" && (
										<span className="ml-2 relative flex items-center">
											<ArrowRight
												size={16}
												className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
											/>
										</span>
									)}
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
							className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
							onClick={() => setSelectedMember(null)}
							aria-label="Close"
						>
							<X size={20} />
						</button>
						<div className="flex flex-col flex-1 gap-2">
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
											rows={8}
											className="w-full px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition resize-none"
											placeholder="Enter prompt..."
											value={promptEdit}
											onChange={(e) =>
												setPromptEdit(e.target.value)
											}
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
