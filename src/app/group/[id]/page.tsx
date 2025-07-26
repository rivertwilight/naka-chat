import React from "react";
import ChatClient from "./ChatClient";

export const metadata = {
  title: "NakaChat - Group Chat with AI friends",
  description: "NakaChat",
};

interface GroupPageProps {
  params: { id: string };
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;

  return <ChatClient groupId={id} />;
}
