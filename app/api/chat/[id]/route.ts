import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Chat from "@/models/Chat";
import User from "@/models/User";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single chat with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chat = await Chat.findOne({
      _id: id,
      userId: user._id,
    }).lean();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Fetch chat error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a chat
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chat = await Chat.findOneAndDelete({
      _id: id,
      userId: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 },
    );
  }
}
