"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import {
  FileText,
  LogOut,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Document {
  _id: string;
  name: string;
  originalName: string;
  fileSize: number;
  status: "processing" | "ready" | "error";
  pageCount?: number;
  createdAt: string;
}

interface DocumentChatContentProps {
  documentId: string;
  user: User;
}

export function DocumentChatContent({
  documentId,
  user,
}: DocumentChatContentProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();

  const fetchDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      const data = await response.json();

      if (response.ok) {
        setDocument(data.document);
      } else {
        setError(data.error || "Failed to fetch document");
      }
    } catch {
      setError("Failed to fetch document");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Poll if document is still processing
  useEffect(() => {
    if (document?.status !== "processing") return;

    const interval = setInterval(fetchDocument, 3000);
    return () => clearInterval(interval);
  }, [document?.status, fetchDocument]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">
                {document?.name || "Loading..."}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user.name || user.email}
            </span>
            {user.image && (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="text-lg font-medium text-red-500">{error}</p>
              <Link href="/dashboard">
                <Button className="mt-4">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        ) : document?.status === "processing" ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Processing document...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we extract the text from your PDF.
              </p>
            </div>
          </div>
        ) : document?.status === "error" ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="text-lg font-medium text-red-500">
                Failed to process document
              </p>
              <p className="text-sm text-muted-foreground">
                There was an error extracting text from this PDF.
              </p>
              <Link href="/dashboard">
                <Button className="mt-4">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col lg:flex-row">
            {/* Document Info Sidebar */}
            <aside className="w-full border-b bg-muted/30 p-4 lg:w-64 lg:border-b-0 lg:border-r">
              <h2 className="mb-2 font-semibold">Document Info</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Name:</span> {document?.name}
                </p>
                <p>
                  <span className="font-medium">Size:</span>{" "}
                  {document && formatFileSize(document.fileSize)}
                </p>
                {document?.pageCount && (
                  <p>
                    <span className="font-medium">Pages:</span>{" "}
                    {document.pageCount}
                  </p>
                )}
              </div>
            </aside>

            {/* Chat Area */}
            <div className="flex-1">
              <ChatInterface
                documentId={documentId}
                chatId={currentChatId}
                onChatCreated={setCurrentChatId}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
