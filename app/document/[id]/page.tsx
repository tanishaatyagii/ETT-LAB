import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DocumentChatContent } from "./document-chat-content";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentChatPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <DocumentChatContent documentId={id} user={session.user} />;
}
