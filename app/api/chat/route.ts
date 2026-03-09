import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Chat from "@/models/Chat";
import DocumentModel from "@/models/Document";
import User from "@/models/User";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { documentId, chatId, message } = await request.json();

    if (!documentId || !message) {
      return new Response(
        JSON.stringify({ error: "Document ID and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get document with extracted text
    const document = await DocumentModel.findOne({
      _id: documentId,
      userId: user._id,
    });

    if (!document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (document.status !== "ready") {
      return new Response(
        JSON.stringify({ error: "Document is still processing" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get or create chat
    let chat;
    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId: user._id,
        documentId: document._id,
      });
    }

    if (!chat) {
      chat = await Chat.create({
        userId: user._id,
        documentId: document._id,
        title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        messages: [],
      });
    }

    // Add user message to chat
    chat.messages.push({
      role: "user",
      content: message,
      createdAt: new Date(),
    });
    await chat.save();

    // Prepare messages for AI
    const systemPrompt = `You are a helpful assistant that answers questions about documents. 
You have access to the following document content:

---
Document: ${document.name}
---
${document.extractedText}
---

Answer questions based on this document. If the answer is not in the document, say so.
Be concise and accurate. Quote relevant parts of the document when appropriate.`;

    const aiMessages = chat.messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }),
    );

    // Stream the response
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: aiMessages,
      onFinish: async ({ text }) => {
        // Save assistant message after streaming completes
        await Chat.findByIdAndUpdate(chat._id, {
          $push: {
            messages: {
              role: "assistant",
              content: text,
              createdAt: new Date(),
            },
          },
        });
      },
    });

    const response = result.toTextStreamResponse();
    response.headers.set("X-Chat-Id", chat._id.toString());
    return response;
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process message" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// GET - List chats for a document
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Document ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chats = await Chat.find({
      userId: user._id,
      documentId,
    })
      .select("-messages")
      .sort({ updatedAt: -1 })
      .lean();

    return new Response(JSON.stringify({ chats }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fetch chats error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch chats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
