import React from "react";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

export const metadata = {
	title: "NakaChat",
	description: "NakaChat",
};

interface GroupPageProps {
	params: { id: string };
}

export default async function GroupPage({ params }: GroupPageProps) {
	const { id } = await params;

	return <ChatClient groupId={id} />;
}
