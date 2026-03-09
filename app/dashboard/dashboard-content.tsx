"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  LogOut,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

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

interface DashboardContentProps {
  user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents);
      } else {
        setError(data.error || "Failed to fetch documents");
      }
    } catch {
      setError("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing documents
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        await fetchDocuments();
      } else {
        setError(data.error || "Failed to upload document");
      }
    } catch {
      setError("Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete document");
      }
    } catch {
      setError("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="application/pdf"
        className="hidden"
        aria-label="Upload PDF document"
      />

      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">DocTalk</span>
          </Link>
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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || "there"}!
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Documents Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Documents</h2>
            <Button onClick={triggerUpload} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">No documents yet</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Your documents will appear here. Upload a PDF to get started.
                </p>
                <Button
                  onClick={triggerUpload}
                  variant="outline"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload your first document
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Documents List */
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(doc.createdAt)}</span>
                          {doc.pageCount && (
                            <>
                              <span>•</span>
                              <span>{doc.pageCount} pages</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(doc.status)}
                        <span className="text-sm capitalize text-muted-foreground">
                          {doc.status}
                        </span>
                      </div>
                      {doc.status === "ready" && (
                        <Link href={`/document/${doc._id}`}>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc._id)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
