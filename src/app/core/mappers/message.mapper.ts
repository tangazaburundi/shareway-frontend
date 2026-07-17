import { Conversation, ConversationUser, Message } from '../models/message.model';

export function mapConversation(dto: any): Conversation {
  const participant: ConversationUser = {
    id: dto.participantId,
    firstName: dto.participantFirstName,
    lastName: dto.participantLastName,
    avatarUrl: dto.participantAvatarUrl
  };

  return {
    id: dto.participantId,
    participant,
    lastMessage: dto.lastMessage,
    lastMessageAt: dto.lastMessageAt,
    unreadCount: dto.unreadCount ?? 0
  };
}

export function mapMessage(dto: any): Message {
  return {
    id: dto.id,
    senderId: dto.senderId,
    receiverId: dto.receiverId,
    content: dto.content,
    read: dto.read,
    createdAt: dto.createdAt
  };
}