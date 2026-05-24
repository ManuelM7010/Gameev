export interface Player {
  uid: string;
  name: string;
  avatar: string; // Emoji
  score: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  sticker?: string;
}

export interface Room {
  roomId: string;
  status: "waiting" | "playing" | "finished";
  mood: "romantic" | "spicy" | "funny" | "intellectual";
  player1: Player | null;
  player2: Player | null;
  gameType: string;
  gameState: any;
  chat: ChatMessage[];
  updatedAt: number;
}

export interface RankingEntry {
  coupleId: string;
  names: string;
  score: number;
  gamesPlayed: number;
  date: string;
}

export type GameCategory = "competitive" | "couple" | "board" | "external";

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  image: string;
  category: GameCategory;
  mood?: string;
  isRealtime: boolean;
}
