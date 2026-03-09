"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, User, Bot } from "lucide-react";
import { useEffect, useRef, useState, FormEvent, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  documentId: string;
  chatId?: string;
  onChatCreated?: (chatId: string) => void;
}

export function ChatInterface({
  documentId,
  chatId: initialChatId,
  onChatCreated,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState(initialChatId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load existing chat messages if chatId is provided
  const loadChat = useCallback(async () => {
    if (!chatId) return;

    try {
      const response = await fetch(`/api/chat/${chatId}`);
      const data = await response.json();

      if (response.ok && data.chat?.messages) {
        setMessages(
          data.chat.messages.map((msg: Message, index: number) => ({
            id: `${chatId}-${index}`,
            role: msg.role,
            content: msg.content,
          })),
        );
      }
    } catch {
      // Ignore errors loading chat
    }
  }, [chatId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setError(null);

    // Add user message immediately
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userMessage },
    ]);

    setIsLoading(true);
    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          chatId,
          message: userMessage,
        }),
      });

      // Get chat ID from headers
      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && !chatId) {
        setChatId(newChatId);
        if (onChatCreated) {
          onChatCreated(newChatId);
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" },
      ]);

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Update the assistant message with streamed content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Bot className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm">Ask questions about your document</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <Card
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <CardContent className="p-3">
                  <p className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </p>
                </CardContent>
              </Card>
              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Card className="bg-muted">
              <CardContent className="p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about this document..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
