import React, { useState, useEffect } from "react";
import { Player, Room } from "./types";
import MainLobby from "./components/MainLobby";
import GameHost from "./components/GameHost";
import ChatPanel from "./components/ChatPanel";
import { Heart, HelpCircle, Gamepad2, Info, Users, LogOut, MessageCircle } from "lucide-react";

export default function App() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [activeSabotage, setActiveSabotage] = useState<string | null>(null);
  const [connectionHealth, setConnectionHealth] = useState<"connecting" | "connected" | "disconnected" | null>(null);

  // Sync real-time sabotage triggers
  useEffect(() => {
    if (room?.gameState?.sabotageType && room?.gameState?.sabotageTime) {
      const diff = Date.now() - room.gameState.sabotageTime;
      if (diff < 5000) {
        setActiveSabotage(room.gameState.sabotageType);
        const timer = setTimeout(() => {
          setActiveSabotage(null);
        }, 5000 - diff);
        return () => clearTimeout(timer);
      }
    }
    setActiveSabotage(null);
  }, [room?.gameState?.sabotageType, room?.gameState?.sabotageTime]);

  // 1. Initial boot: retrieve player from localStorage if they have logged in before
  useEffect(() => {
    const saved = localStorage.getItem("heartsync_player_v1");
    if (saved) {
      try {
        setCurrentPlayer(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse player setting:", e);
      }
    }
  }, []);

  // Save changes to localStorage on set
  const handleSetUser = (player: Player) => {
    setCurrentPlayer(player);
    localStorage.setItem("heartsync_player_v1", JSON.stringify(player));
  };

  // 2. Real-time Synchronization via Server-Sent Events (SSE) with robust reconnection logic
  useEffect(() => {
    if (!room || !currentPlayer) {
      setConnectionHealth(null);
      return;
    }

    setConnectionHealth("connecting");
    let isMounted = true;
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    function connect() {
      if (!isMounted) return;
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(
        `/api/rooms/stream/${room?.roomId}?uid=${currentPlayer?.uid}`
      );

      eventSource.onopen = () => {
        if (isMounted) setConnectionHealth("connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const updatedRoom = JSON.parse(event.data);
          if (isMounted) {
            setConnectionHealth("connected");
            if (updatedRoom) {
              setRoom(updatedRoom);
              setError(null);
            } else {
              setRoom(null);
              setError("La sala de juegos ya no está disponible.");
            }
          }
        } catch (err) {
          console.error("SSE Parse Error:", err);
        }
      };

      eventSource.onerror = (err) => {
        if (!isMounted) return;
        console.warn("SSE stream network fluctuation. Attempting automatic recovery...", err);
        setConnectionHealth("connecting");
        
        // Explicitly re-instantiate connection if needed after a small delay
        if (eventSource) {
          eventSource.close();
        }
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
          if (isMounted) connect();
        }, 5000); // retry every 5 seconds
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
      setConnectionHealth(null);
    };
  }, [room?.roomId, currentPlayer?.uid]);

  // Handle Create Room API
  const handleCreateRoom = async (mood: "romantic" | "spicy" | "funny" | "intellectual") => {
    if (!currentPlayer) return;
    setError(null);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: currentPlayer, mood }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Algo salió mal.");
      }
      const data: Room = await res.json();
      setRoom(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con la base de datos.");
    }
  };

  // Handle Join Room API
  const handleJoinRoom = async (roomId: string) => {
    if (!currentPlayer || !roomId) return;
    setError(null);
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: currentPlayer }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al ingresar.");
      }
      const data: Room = await res.json();
      setRoom(data);
    } catch (err: any) {
      setError(err.message || "La sala no existe o está llena.");
    }
  };

  // Dispatch state updates to the real-time server
  const handleUpdateRoomState = async (stateUpdate: any) => {
    if (!room) return;
    try {
      const res = await fetch("/api/rooms/updateState", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.roomId,
          ...stateUpdate,
        }),
      });
      if (res.ok) {
        const data: Room = await res.json();
        setRoom(data);
      }
    } catch (err) {
      console.error("Failed to commit live state update:", err);
    }
  };

  // Dispatch live chat messages to the server
  const handleSendMessage = async (text: string, sticker?: string) => {
    if (!room || !currentPlayer) return;
    try {
      await fetch("/api/rooms/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.roomId,
          senderId: currentPlayer.uid,
          senderName: currentPlayer.name,
          text,
          sticker,
        }),
      });
    } catch (err) {
      console.error("Message sync failing:", err);
    }
  };

  // Transition from active competitive play back to standard lobby
  const handleFinishGame = (winnerName: string, points: number) => {
    if (!room) return;
    setTimeout(() => {
      handleUpdateRoomState({
        gameType: "lobby",
        gameState: {},
      });
    }, 4500); // 4.5 seconds delay so players can see who won!
  };

  const handleBackToLobby = () => {
    handleUpdateRoomState({
      gameType: "lobby",
      gameState: {},
    });
  };

  const handleLeaveRoom = () => {
    setRoom(null);
    setError(null);
  };

  const handleLogout = () => {
    setRoom(null);
    setCurrentPlayer(null);
    localStorage.removeItem("heartsync_player_v1");
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0f172a] via-[#581c87] to-[#881337] flex flex-col font-sans select-none overflow-x-hidden text-white transition-all duration-300 ${activeSabotage === "shake" ? "animate-shake" : ""}`} id="main-app">
      {/* Spider Crawl Overlay */}
      {activeSabotage === "spider" && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden select-none">
          <div className="absolute left-[40%] animate-crawl text-7xl select-none">
            🕷️
          </div>
        </div>
      )}

      {/* Cracked Screen Overlay */}
      {activeSabotage === "crack" && (
        <div className="fixed inset-0 z-[150] pointer-events-none select-none flex items-center justify-center bg-black/45">
          <div className="relative text-center w-full max-w-sm p-6 bg-slate-950/95 border border-rose-500/30 rounded-3xl pointer-events-auto backdrop-blur-md shadow-2xl">
            <div className="text-3xl font-display font-bold text-rose-400 mb-3">💥 ¡PANTALLA ROTA! 💥</div>
            <p className="text-xs text-rose-300 mb-4 leading-relaxed">
              {room?.gameState?.sabotageSender || "Tu pareja"} te ha lanzado un balonazo virtual que agrietó tu cristal.
            </p>
            <button
              onClick={() => setActiveSabotage(null)}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-550 text-white text-xs font-bold uppercase rounded-xl transition shadow active:scale-95 cursor-pointer border border-rose-450/30"
              id="fix-cracked-btn"
            >
              🛠️ Reparar Pantalla (Dar Mimos)
            </button>
          </div>
          {/* Glass cracks visuals */}
          <div className="absolute inset-0 border-[20px] border-double border-red-500/20 pointer-events-none opacity-80 animate-pulse" />
        </div>
      )}

      {/* Visual background ambient noise */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-white/5 backdrop-blur-3xl pointer-events-none z-0" />

      {/* Top Navigation Frame */}
      <header className="relative w-full border-b border-white/10 py-4 px-8 flex justify-between items-center bg-white/10 backdrop-blur-md z-12 h-16 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-rose-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse-heart" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight text-white">
            DúoPlay <span className="text-xs text-rose-400 font-normal ml-1 uppercase tracking-widest bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">Beta</span>
          </h1>
        </div>

        {currentPlayer && (
          <div className="flex items-center gap-6">
            {/* Realtime Partner connected banner directly in the navbar */}
            {room && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md transition-all">
                  <div className={`w-2 h-2 rounded-full ${room.player2 ? "bg-emerald-400 animate-pulse" : "bg-yellow-400"}`}></div>
                  <span className="text-[10px] font-semibold uppercase tracking-tight text-white/80">
                    {room.player2 ? (
                      <>En línea con: <span className="text-white font-bold">{currentPlayer.uid === room.player1?.uid ? room.player2.name : room.player1?.name}</span></>
                    ) : (
                      "Esperando pareja..."
                    )}
                  </span>
                </div>

                {connectionHealth && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase transition border ${
                      connectionHealth === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse"
                    }`}
                    title={connectionHealth === "connected" ? "Sincronizado con el Servidor" : "Sincronización en proceso..."}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${connectionHealth === "connected" ? "bg-emerald-400" : "bg-yellow-400 animate-ping"}`} />
                    <span>{connectionHealth === "connected" ? "Sincro" : "Conectando..."}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
                <span className="text-base">{currentPlayer.avatar}</span>
                <span className="text-slate-200">{currentPlayer.name}</span>
              </div>
              
              <button
                onClick={handleLogout}
                id="logout-btn"
                className="p-2 hover:bg-white/15 border border-transparent hover:border-white/10 text-white/60 hover:text-white rounded-full cursor-pointer transition active:scale-95"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Primary Container layout */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 py-6 z-10 flex flex-col md:flex-row gap-6">
        
        {/* Error Callout Panel */}
        {error && (
          <div className="w-full bg-red-950/80 border border-red-500/30 p-4 rounded-2xl flex items-center gap-2.5 text-xs text-red-200 shadow-lg animate-fade-in mb-6 md:mb-0">
            <Info className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Dashboard Grid Logic */}
        <div className="flex-1 min-w-0">
          {!room || room.gameType === "lobby" ? (
            /* LOBBY DIRECTORY */
            <MainLobby
              room={room}
              currentPlayer={currentPlayer}
              onSetUser={handleSetUser}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onStartGame={(game) => handleUpdateRoomState({ gameType: game })}
              onLeaveRoom={handleLeaveRoom}
              onSyncChallenges={handleUpdateRoomState}
            />
          ) : (
            /* ACTIVE MULTIPLAYER PLAYBOARD */
            <GameHost
              room={room}
              currentPlayer={currentPlayer}
              onUpdateState={handleUpdateRoomState}
              onFinishGame={handleFinishGame}
              onBackToLobby={handleBackToLobby}
            />
          )}
        </div>

        {/* COMPANION REAL-TIME CHAT PANEL (Right sidebar when connected) */}
        {room && currentPlayer && (
          <>
            {/* Desktop floating docked panel */}
            <div className="hidden md:block w-80 shrink-0 h-[640px] sticky top-22">
              <ChatPanel
                room={room}
                currentPlayer={currentPlayer}
                onSendMessage={handleSendMessage}
              />
            </div>

            {/* Mobile collapsible floating chat drawer button */}
            <button
              onClick={() => setMobileChatOpen(!mobileChatOpen)}
              id="mobile-chat-fab"
              className="md:hidden fixed bottom-6 right-6 z-44 p-4 bg-rose-600 hover:bg-rose-550 text-white rounded-full shadow-2xl active:scale-90 cursor-pointer flex items-center justify-center"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            {/* Mobile chat drawer container overlay */}
            {mobileChatOpen && (
              <div className="md:hidden fixed inset-0 z-45 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-905 rounded-t-3xl border-t border-rose-500/20 max-h-[85vh] flex flex-col">
                  {/* Close trigger drawer */}
                  <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-3" onClick={() => setMobileChatOpen(false)} />
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chat Pareja</span>
                    <button
                      onClick={() => setMobileChatOpen(false)}
                      className="text-xs text-rose-400 font-bold"
                    >
                      Cerrar ×
                    </button>
                  </div>
                  <div>
                    <ChatPanel
                      room={room}
                      currentPlayer={currentPlayer}
                      onSendMessage={handleSendMessage}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Simple Footer credit frame */}
      <footer className="relative w-full border-t border-white/5 py-4 text-center text-[10px] text-slate-500 z-11">
        <p>© 2026 DúoPlay Sincronizado. Creado con amor para parejas.</p>
      </footer>
    </div>
  );
}
