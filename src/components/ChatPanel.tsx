import React, { useState, useEffect, useRef } from "react";
import { Room, Player, ChatMessage } from "../types";
import { Send, Smile, Heart, MessageSquare, Flame } from "lucide-react";

interface ChatPanelProps {
  room: Room;
  currentPlayer: Player;
  onSendMessage: (text: string, sticker?: string) => void;
}

interface CuteSticker {
  emoji: string;
  label: string;
  color: string;
}

const CUTE_STICKERS: CuteSticker[] = [
  { emoji: "🐱💖", label: "Michi Mimi", color: "from-pink-500 to-rose-400" },
  { emoji: "🐨🫂", label: "Super Abrazo", color: "from-slate-500 to-indigo-400" },
  { emoji: "🐼💤", label: "Tengo Sueño", color: "from-gray-700 to-neutral-400" },
  { emoji: "🦊🔥", label: "Coqueteo", color: "from-orange-500 to-amber-400" },
  { emoji: "🍿🎬", label: "Netflix & Chill", color: "from-blue-600 to-cyan-400" },
  { emoji: "🧇😋", label: "Hambre", color: "from-amber-600 to-yellow-400" }
];

const EMOJI_ACCENTS = ["❤️", "💖", "🔥", "😂", "😘", "🥺", "💀", "🌹"];

export default function ChatPanel({ room, currentPlayer, onSendMessage }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [showStickersTab, setShowStickersTab] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.chat?.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleSendSticker = (sticker: CuteSticker) => {
    onSendMessage(`Envió sticker: ${sticker.label}`, sticker.emoji);
    setShowStickersTab(false);
  };

  const handleSendEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  return (
    <div className="flex flex-col h-full glass-morphism p-4 rounded-2xl shrink-0 shadow-xl overflow-hidden relative group" id="chat-panel-container">
      {/* Decorative top ambient indicator */}
      <div className="absolute -right-12 -top-12 w-28 h-28 bg-rose-500/10 blur-2xl rounded-full group-hover:bg-rose-500/20 transition-all pointer-events-none" />

      {/* Thread Title */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10 z-10">
        <MessageSquare className="w-4 h-4 text-rose-400 animate-pulse" />
        <h4 className="text-xs font-display font-bold uppercase tracking-wider text-rose-200">
          Chat en tiempo real
        </h4>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider font-mono text-white/50">Online</span>
        </div>
      </div>

      {/* Messages overflow thread */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 min-h-[160px] z-10">
        {room.chat && room.chat.length > 0 ? (
          room.chat.map((msg: ChatMessage) => {
            const isMe = msg.senderId === currentPlayer.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                {/* Author subtitle */}
                <span className="text-[9px] text-white/50 mb-0.5 font-mono">
                  {msg.senderName} ({new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>

                {/* Message block */}
                {msg.sticker ? (
                  /* Render Sticker */
                  <div className="flex flex-col items-center bg-black/30 border border-white/10 p-3 rounded-2xl shadow-md transform text-center backdrop-blur-md">
                    <span className="text-4xl filter drop-shadow-md animate-bounce">{msg.sticker}</span>
                    <span className="text-[10px] text-rose-300 font-semibold mt-1 uppercase font-display select-none">
                      {msg.text.replace("Envió sticker:", "").trim()}
                    </span>
                  </div>
                ) : (
                  /* Standard text */
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-all ${
                      isMe
                        ? "bg-rose-500 text-white rounded-tr-none shadow-md shadow-rose-500/10"
                        : "bg-white/10 backdrop-blur-sm text-slate-100 rounded-tl-none border border-white/10"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-center p-4">
            <p className="text-[11px] text-white/40 italic max-w-[180px]">
              ¡El chat está silencioso! Envíale un te amo, un sticker o sabotea la partida de tu pareja 😊
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Interactive additions */}
      <div className="space-y-2 pt-2 border-t border-white/10 z-10">
        {/* Quick emojis bar */}
        <div className="flex justify-between gap-1 items-center">
          <div className="flex gap-1">
            {EMOJI_ACCENTS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendEmoji(emoji)}
                className="text-base p-1 hover:bg-white/10 rounded cursor-pointer transition active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowStickersTab(!showStickersTab)}
            className={`text-[10px] px-2.5 py-1 font-semibold rounded-full cursor-pointer transition uppercase tracking-wider ${
              showStickersTab ? "bg-rose-500 text-white" : "bg-white/5 hover:bg-white/12 text-slate-300 border border-white/10"
            }`}
          >
            Stickers
          </button>
        </div>

        {/* Stickers Grid */}
        {showStickersTab && (
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-black/40 backdrop-blur-lg rounded-xl border border-white/10 animate-fade-in mb-1">
            {CUTE_STICKERS.map((stick) => (
              <button
                key={stick.label}
                onClick={() => handleSendSticker(stick)}
                className="bg-black/20 p-2 border border-white/10 rounded-lg text-center cursor-pointer hover:border-rose-500/30 transition flex flex-col items-center gap-1 active:scale-95"
              >
                <span className="text-xl">{stick.emoji}</span>
                <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{stick.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Submit Form */}
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dile algo lindo..."
            className="flex-1 glass-input text-xs px-3 py-2.5 rounded-xl text-white font-medium outline-none"
          />
          <button
            type="submit"
            id="chat-send-btn"
            className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl cursor-pointer transform active:scale-95 transition flex items-center justify-center shadow-lg shadow-rose-500/20"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
