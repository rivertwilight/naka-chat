// This file will redirect to /group/1 by default
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/group/1");
  return null;
}
