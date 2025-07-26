"use client";

import React from "react";
import { ArrowRight, X, Loader, Plus, Globe, Cloud, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@lobehub/ui";

import Dialog from "@/components/Dialog";
import {
	useGroup,
	useGroupMembers,
	useGroupOperations
} from "@/hooks/useDatabase";
import { dbHelpers, db } from "@/lib/database";
import { getRandomName, getRandomAvatar } from "@/utils/randomUtils";

interface Member {
	id: string;
	name: string;
	role: string;
	status: "active" | "muted";
	type: "human" | "agent";
	avatar_url?: string;
	thinking?: boolean;
	system_prompt?: string;
}

interface SidebarRightProps {
	groupId: string | null;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ groupId }) => {
	const [groupVersion, setGroupVersion] = React.useState(0);
	const { members: dbMembers, loading } = useGroupMembers(
		groupId,
		groupVersion
	);
	const { group, loading: groupLoading } = useGroup(groupId, groupVersion);
	const [selectedMember, setSelectedMember] = React.useState<null | Member>(
		null
	);

	const [descEdit, setDescEdit] = React.useState<string>("");
	const [descEditing, setDescEditing] = React.useState(false);
	const [descSaving, setDescSaving] = React.useState(false);
	const [nameEdit, setNameEdit] = React.useState<string>("");
	const [nameEditing, setNameEditing] = React.useState(false);
	const [nameSaving, setNameSaving] = React.useState(false);
	const [addLoading, setAddLoading] = React.useState(false);
	const [allAgents, setAllAgents] = React.useState<any[]>([]);
	const [promptEdit, setPromptEdit] = React.useState<string>("");
	const [memberNameEdit, setMemberNameEdit] = React.useState<string>("");
	const [memberNameEditing, setMemberNameEditing] = React.useState(false);
	const [memberNameSaving, setMemberNameSaving] = React.useState(false);
	const [inviteAgentOpen, setInviteAgentOpen] = React.useState(false);
	const [inviteAgentLoading, setInviteAgentLoading] = React.useState(false);
	const [selectedAgentIds, setSelectedAgentIds] = React.useState<string[]>([]);
	const { renameGroup } = useGroupOperations();

	React.useEffect(() => {
		if (group && !nameEditing) setNameEdit(group.name || "");
	}, [group, nameEditing]);

	React.useEffect(() => {
		if (group && !descEditing) setDescEdit(group.description || "");
	}, [group, descEditing]);

	// Load all agents and users not already in the group
	React.useEffect(() => {
		if (!inviteAgentOpen) return;
		(async () => {
			const groupMemberIds = new Set(
				dbMembers.map((m) => m.user_id || m.agent_id)
			);
			const agents = (await db.agents.toArray()).filter(
				(a) => !groupMemberIds.has(a.id)
			);
			setAllAgents(agents);
			setSelectedAgentIds([]);
		})();
	}, [inviteAgentOpen, dbMembers]);

	const handleNameSave = async () => {
		if (!groupId) return;
		setNameSaving(true);
		await renameGroup(groupId, nameEdit);
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

	// Transform database members to component format
	const members: Member[] = React.useMemo(() => {
		return dbMembers.map((dbMember) => {
			const isAgent = dbMember.role === "agent";
			const details = dbMember.details;

			return {
				id: dbMember.id,
				name: details?.name || "Unknown",
				role: isAgent ? details?.title || "Agent" : "You",
				status: dbMember.status,
				type: dbMember.role,
				avatar_url: details?.avatar_url,
				system_prompt: isAgent ? details?.system_prompt : undefined
			};
		});
	}, [dbMembers]);

	// When selectedMember changes, set promptEdit to the agent's system_prompt
	React.useEffect(() => {
		if (selectedMember && selectedMember.type === "agent") {
			setPromptEdit(selectedMember.system_prompt || "");
		}
	}, [selectedMember]);

	// When selectedMember changes, set memberNameEdit
	React.useEffect(() => {
		if (selectedMember) setMemberNameEdit(selectedMember.name || "");
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
		<aside className="hidden md:flex flex-col gap-4 w-56 sm:w-72 h-screen fixed right-0 top-0 z-20 px-4 py-8 select-none overflow-y-auto overflow-x-hidden">
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
							damping: 40
						}}
						className="flex flex-col gap-2"
					>
						{group && (
							<div className="mb-2 flex flex-col gap-2 pb-4 px-2">
								{/* Editable group name */}
								<div className="flex items-start gap-2">
									{nameEditing ? (
										<input
											type="text"
											className="w-full rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xl font-semibold focus:outline-none transition"
											value={nameEdit}
											onChange={(e) => setNameEdit(e.target.value)}
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
										<Loader size={18} className="animate-spin ml-2" />
									)}
								</div>
								<div className="flex items-start gap-2">
									{descEditing ? (
										<textarea
											className="w-full p-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none transition resize-none"
											value={descEdit}
											onChange={(e) => setDescEdit(e.target.value)}
											onBlur={async () => {
												if (!groupId) return;
												setDescSaving(true);
												await dbHelpers.updateGroup(groupId, {
													description: descEdit
												});
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
												onClick={() => setDescEditing(true)}
											>
												{group.description || (
													<span className="text-neutral-300 dark:text-neutral-600 flex items-center gap-2">
														No description <Edit size={16} />
													</span>
												)}
											</span>
											{descSaving && (
												<Loader size={14} className="animate-spin ml-2" />
											)}
										</div>
									)}
								</div>
							</div>
						)}
						<button
							type="button"
							className="mt-2 px-2 flex items-center gap-2 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-md font-medium focus:outline-none disabled:opacity-60"
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
										avatar_url
									});
									await dbHelpers.addGroupMember({
										group_id: groupId,
										agent_id: agent.id,
										role: "agent",
										status: "active"
									});
								} catch (e) {
									// Optionally handle error
								} finally {
									setAddLoading(false);
									setGroupVersion((v) => v + 1);
								}
							}}
							disabled={addLoading}
						>
							{addLoading ? (
								<Loader size={16} className="animate-spin" />
							) : (
								<Plus size={16} />
							)}
							<span>{addLoading ? "Creating..." : "Create new agent"}</span>
						</button>
						<button
							type="button"
							className="mt-1 px-2 mb-4 flex items-center gap-2 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-md font-medium focus:outline-none disabled:opacity-60"
							onClick={() => setInviteAgentOpen(true)}
						>
							<Plus size={16} />
							<span>Invite agent</span>
						</button>
						{members.map((member) => (
							<button
								key={member.id}
								className={`flex items-center gap-4 group relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left ${
									member.status === "muted"
										? "opacity-60 cursor-not-allowed"
										: ""
								}`}
								onClick={() =>
									member.status === "active" && setSelectedMember(member)
								}
								style={{
									outline: "none",
									border: "none",
									background: "none"
								}}
								disabled={member.status === "muted"}
							>
								<Avatar
									avatar={member.avatar_url}
									size={30}
									title={member.name}
								/>
								<div className="flex flex-col gap-0.5">
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
												<Loader className="animate-spin" size={14} />
											</span>
										)}
									</span>
								</div>
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
							damping: 40
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
							<div
								className={`text-lg flex items-center gap-4 font-semibold ${
									selectedMember?.status === "muted"
										? "text-neutral-300 dark:text-neutral-600"
										: "text-neutral-900 dark:text-neutral-100"
								}`}
							>
								<Avatar
									src={selectedMember.avatar_url}
									size={28}
									className="flex-shrink-0"
								/>
								{memberNameEditing ? (
									<input
										type="text"
										className="w-full rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-lg font-semibold focus:outline-none transition"
										value={memberNameEdit}
										onChange={(e) => setMemberNameEdit(e.target.value)}
										onBlur={async () => {
											if (!selectedMember) return;
											setMemberNameSaving(true);
											// Find the dbMember for the selectedMember
											const dbMember = dbMembers.find(
												(m) => m.id === selectedMember.id
											);
											if (!dbMember) {
												setMemberNameEditing(false);
												setMemberNameSaving(false);
												return;
											}
											if (selectedMember.type === "agent") {
												await dbHelpers.updateAgent(dbMember.agent_id, {
													name: memberNameEdit
												});
											} else {
												await dbHelpers.updateUser(dbMember.user_id, {
													name: memberNameEdit
												});
											}
											setMemberNameEditing(false);
											setMemberNameSaving(false);
											setGroupVersion((v) => v + 1);
											// Update selectedMember with new name
											setSelectedMember((prev) =>
												prev
													? {
															...prev,
															name: memberNameEdit
														}
													: prev
											);
										}}
										onKeyDown={async (e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												if (!selectedMember) return;
												setMemberNameSaving(true);
												const dbMember = dbMembers.find(
													(m) => m.id === selectedMember.id
												);
												if (!dbMember) {
													setMemberNameEditing(false);
													setMemberNameSaving(false);
													return;
												}
												if (selectedMember.type === "agent") {
													await dbHelpers.updateAgent(dbMember.agent_id, {
														name: memberNameEdit
													});
												} else {
													await dbHelpers.updateUser(dbMember.user_id, {
														name: memberNameEdit
													});
												}
												setMemberNameEditing(false);
												setMemberNameSaving(false);
												setGroupVersion((v) => v + 1);
											}
										}}
										autoFocus
										maxLength={40}
									/>
								) : (
									<span
										className="cursor-pointer flex items-center gap-2"
										title={selectedMember.name}
										onClick={() => setMemberNameEditing(true)}
									>
										{selectedMember.name}
										<Edit
											size={16}
											className="text-neutral-400 dark:text-neutral-400"
										/>
									</span>
								)}
								{memberNameSaving && (
									<Loader size={18} className="animate-spin ml-2" />
								)}
							</div>

							<div className="w-full flex flex-col gap-1 mt-4">
								<textarea
									id="prompt-input"
									rows={8}
									className="w-full px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition resize-none"
									placeholder="e.g. A 18 yo girl comes from bay area"
									value={promptEdit}
									onChange={(e) => setPromptEdit(e.target.value)}
								/>
							</div>

							{/* Tools */}
							<div className="w-full mt-2 overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-md flex flex-col gap-0.5">
								<div className="w-full flex items-center justify-between p-3">
									<span className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
										<Globe size={16} /> Web Search
									</span>
									<label
										className="relative inline-flex items-center cursor-pointer select-none"
										style={{ minWidth: "2.25rem" }}
									>
										<input type="checkbox" value="" className="sr-only peer" />
										<div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full transition-colors peer-focus:outline-none peer-checked:bg-neutral-400 dark:peer-checked:bg-neutral-500" />
										<span
											className="absolute left-0.5 top-0.5 w-4 h-4 bg-white dark:bg-neutral-900 rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4 border border-neutral-300 dark:border-neutral-800"
											style={{
												pointerEvents: "none"
											}}
										/>
									</label>
								</div>
								<div className="w-full flex items-center justify-between p-3">
									<span className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
										<Cloud size={16} /> Get Weather
									</span>
									<label
										className="relative inline-flex items-center cursor-pointer select-none"
										style={{ minWidth: "2.25rem" }}
									>
										<input type="checkbox" value="" className="sr-only peer" />
										<div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full transition-colors peer-focus:outline-none peer-checked:bg-neutral-400 dark:peer-checked:bg-neutral-500" />
										<span
											className="absolute left-0.5 top-0.5 w-4 h-4 bg-white dark:bg-neutral-900 rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4 border border-neutral-300 dark:border-neutral-800"
											style={{
												pointerEvents: "none"
											}}
										/>
									</label>
								</div>
							</div>

							<button
								type="button"
								className="mt-2 flex items-center gap-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-md font-medium focus:outline-none"
								onClick={async () => {
									if (!selectedMember) return;
									// Find the dbMember by id
									const dbMember = dbMembers.find(
										(m) => m.id === selectedMember.id
									);
									if (!dbMember) return;
									await db.groupMembers.update(dbMember.id, {
										status: "muted",
										left_at: new Date()
									});
									setSelectedMember(null);
									setGroupVersion((v) => v + 1);
								}}
							>
								<X size={16} />
								<span>Remove from group</span>
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			{/* Invite Agent Dialog */}
			<Dialog
				open={inviteAgentOpen}
				onClose={() => {
					setInviteAgentOpen(false);
					setSelectedAgentIds([]);
					setInviteAgentLoading(false);
				}}
				variant="modal"
			>
				<div className="flex flex-col min-h-[300px] w-full p-6">
					<h2 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
						<Plus size={20} /> Invite Agents
					</h2>
					<div className="flex-1 overflow-y-auto mb-4">
						{allAgents.length === 0 ? (
							<div className="text-neutral-400 text-center py-8">
								No available agents to invite.
							</div>
						) : (
							<ul className="flex flex-col gap-2">
								{allAgents.map((agent) => (
									<li
										key={agent.id}
										className="flex items-center gap-3 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
									>
										<input
											type="checkbox"
											checked={selectedAgentIds.includes(agent.id)}
											onChange={() => {
												setSelectedAgentIds((prev) =>
													prev.includes(agent.id)
														? prev.filter((id) => id !== agent.id)
														: [...prev, agent.id]
												);
											}}
											className="accent-neutral-600 w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-400"
											id={`invite-agent-${agent.id}`}
										/>
										<Avatar src={agent.avatar_url} size={28} />
										<label
											htmlFor={`invite-agent-${agent.id}`}
											className="flex-1 cursor-pointer text-neutral-800 dark:text-neutral-100"
										>
											<span className="font-medium">{agent.name}</span>
											<span className="ml-2 text-xs text-neutral-400">
												{agent.title}
											</span>
										</label>
									</li>
								))}
							</ul>
						)}
					</div>
					<div className="flex justify-end gap-2 mt-4">
						<button
							type="button"
							className="px-4 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium"
							onClick={() => {
								setInviteAgentOpen(false);
								setSelectedAgentIds([]);
								setInviteAgentLoading(false);
							}}
							disabled={inviteAgentLoading}
						>
							Cancel
						</button>
						<button
							type="button"
							className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-60"
							onClick={async () => {
								if (!groupId || selectedAgentIds.length === 0) return;
								setInviteAgentLoading(true);
								try {
									await Promise.all(
										selectedAgentIds.map((agentId) =>
											dbHelpers.addGroupMember({
												group_id: groupId,
												agent_id: agentId,
												role: "agent",
												status: "active"
											})
										)
									);
									setInviteAgentOpen(false);
									setSelectedAgentIds([]);
									setGroupVersion((v) => v + 1);
								} catch (e) {
									// Optionally handle error
								} finally {
									setInviteAgentLoading(false);
								}
							}}
							disabled={inviteAgentLoading || selectedAgentIds.length === 0}
						>
							{inviteAgentLoading ? (
								<Loader size={16} className="animate-spin" />
							) : (
								<Plus size={16} />
							)}
							Invite
						</button>
					</div>
				</div>
			</Dialog>
		</aside>
	);
};

export default SidebarRight;
