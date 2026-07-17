export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: ConversationUser;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface SendMessageRequest {
  receiverId: string;
  content: string;
}

export interface TypingIndicator {
  senderId: string;
  conversationWith: string;
  typing: boolean;
}

export interface MessageReadReceipt {
  messageId: string;
  readBy: string;
  readAt: string;
}
