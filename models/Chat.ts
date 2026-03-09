import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ChatSchema = new Schema<IChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: [true, "Document ID is required"],
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for user's chats by document
ChatSchema.index({ userId: 1, documentId: 1, createdAt: -1 });

const Chat: Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;
