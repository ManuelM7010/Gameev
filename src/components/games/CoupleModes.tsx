import React, { useState, useEffect } from "react";
import { Room, Player } from "../../types";
import { HelpCircle, Star, Heart, Flame, Sparkles, Smile, RefreshCw, Layers } from "lucide-react";

interface CoupleModesProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

export default function CoupleModes({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: CoupleModesProps) {
  const gameState = room.gameState || {};
  const activeMood = room.mood || "romantic";
  const activeDeck = gameState.challenges || [];
  const activeIndex = gameState.challengeIndex || 0;
  const isFlipped = gameState.cardFlipped || false;

  const [spinning, setSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Sync prompts from server
  const loadAIChallenges = async (selectedMood: string) => {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/get-challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          player1Name: room.player1?.name || "Pareja 1",
          player2Name: room.player2?.name || "Pareja 2",
        }),
      });
      const data = await response.json();
      onUpdateState({
        challenges: data.challenges,
        challengeIndex: 0,
        cardFlipped: false,
      });
    } catch (err) {
      console.error("Failed to sync AI challenges:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Trigger setup on start if empty
  useEffect(() => {
    if (activeDeck.length === 0) {
      loadAIChallenges(activeMood);
    }
  }, [activeMood]);

  // Spin the wheel
  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    const bonusDeg = 1440 + Math.floor(Math.random() * 360);
    setSpinDeg((prev) => prev + bonusDeg);

    setTimeout(() => {
      setSpinning(false);
      // Select mood based on final outcome
      const moods: Array<"romantic" | "spicy" | "funny" | "intellectual"> = [
        "romantic",
        "spicy",
        "funny",
        "intellectual",
      ];
      const randomizedMood = moods[Math.floor(Math.random() * moods.length)];
      
      // Update mood state and fetch matching cards
      onUpdateState({ mood: randomizedMood });
      loadAIChallenges(randomizedMood);
    }, 2800);
  };

  // Flip the prompt card
  const handleFlipCard = () => {
    onUpdateState({ cardFlipped: !isFlipped });
  };

  // Settle challenge or draw next
  const progressChallenge = (doneByPlayer: boolean) => {
    if (doneByPlayer) {
      // Add ranking points to current actor
      const targetScoreField = isPlayer1 ? "player1Score" : "player2Score";
      const currentScoreValue = isPlayer1 ? (room.player1?.score || 0) : (room.player2?.score || 0);

      onUpdateState({
        [targetScoreField]: currentScoreValue + 15,
        challengeIndex: (activeIndex + 1) % Math.max(1, activeDeck.length),
        cardFlipped: false,
      });
    } else {
      // Just step forwards
      onUpdateState({
        challengeIndex: (activeIndex + 1) % Math.max(1, activeDeck.length),
        cardFlipped: false,
      });
    }
  };

  // End couple play session
  const exitSession = () => {
    const p1Score = room.player1?.score || 0;
    const p2Score = room.player2?.score || 0;
    const sessionWinner = p1Score > p2Score ? (room.player1?.name || "P1") : (room.player2?.name || "P2");
    
    // Register global rank score
    fetch("/api/rankings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        names: `${room.player1?.name} & ${room.player2?.name}`,
        points: p1Score + p2Score,
      }),
    });

    onFinishGame(sessionWinner, p1Score + p2Score);
  };

  const getMoodTitle = (m: string) => {
    switch (m) {
      case "spicy":
        return { label: "Modo Coqueto (Spicy)", color: "text-rose-400 border-rose-950 bg-rose-950/20", icon: <Flame className="w-5 h-5 text-rose-500" /> };
      case "funny":
        return { label: "Caos Divertido (Funny)", color: "text-amber-400 border-amber-950 bg-amber-950/20", icon: <Smile className="w-5 h-5 text-amber-500" /> };
      case "intellectual":
        return { label: "Modo Intelectual (Debate)", color: "text-violet-400 border-violet-950 bg-violet-950/20", icon: <Layers className="w-5 h-5 text-violet-500" /> };
      default:
        return { label: "Modo Romántico (Cosy)", color: "text-pink-400 border-pink-950 bg-pink-950/20", icon: <Heart className="w-5 h-5 text-pink-500" /> };
    }
  };

  const moodConfig = getMoodTitle(activeMood);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white" id="couple-modes">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-xs font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> RETOS CONEXIÓN PAREJA
        </span>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-display font-medium text-rose-200">Refugio de Intimidad</h3>
        <p className="text-xs text-rose-300 mt-1">¡Giren la ruleta para consensuar un mood, o revelen cartas generadas por IA!</p>
      </div>

      {/* Grid containing spinner on left and cards on right */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Spinner Column */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-44 h-44 flex items-center justify-center bg-slate-950 p-2 rounded-full border border-slate-800 shadow-xl shadow-rose-950/10">
            {/* Spinning Wheel */}
            <div
              style={{
                transform: `rotate(${spinDeg}deg)`,
                transition: spinning ? "transform 2.8s cubic-bezier(0.1, 0.8, 0.1, 1)" : "none",
              }}
              className="w-full h-full rounded-full relative overflow-hidden border-2 border-slate-700 bg-slate-900 grid grid-cols-2 grid-rows-2"
            >
              {/* Pie sectors */}
              <div className="bg-pink-900/60 flex items-center justify-center border border-slate-800"><Heart className="w-6 h-6 text-pink-400 rotate-45" /></div>
              <div className="bg-rose-900/60 flex items-center justify-center border border-slate-800"><Flame className="w-6 h-6 text-rose-500 -rotate-45" /></div>
              <div className="bg-slate-900 flex items-center justify-center border border-slate-800"><Smile className="w-6 h-6 text-amber-400 rotate-135" /></div>
              <div className="bg-violet-900/60 flex items-center justify-center border border-slate-800"><Layers className="w-6 h-6 text-violet-400 -rotate-135" /></div>
            </div>

            {/* Spinner Needle */}
            <div className="absolute top-0 left-1/2 -ml-2 -mt-1 w-4 h-6 bg-red-500 border border-white clip-path-needle z-20" />

            {/* Center spin helper */}
            <button
              onClick={handleSpinWheel}
              disabled={spinning}
              id="spin-wheel-btn"
              className="absolute w-12 h-12 bg-white text-slate-950 hover:bg-rose-100 font-bold text-xs uppercase rounded-full shadow-lg border border-rose-500 flex items-center justify-center cursor-pointer transition active:scale-90"
            >
              {spinning ? "🎡" : "GIRAR"}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Presiona girar para sortear humor</p>
        </div>

        {/* Flipped Card Column */}
        <div className="md:col-span-7 flex flex-col items-center">
          {generating ? (
            <div className="h-44 flex flex-col items-center justify-center w-full">
              <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
              <p className="text-xs text-slate-400 mt-2 font-mono">Generando cartas con IA...</p>
            </div>
          ) : activeDeck.length > 0 ? (
            <div className="w-full space-y-4">
              {/* Flip Container */}
              <div
                onClick={handleFlipCard}
                className="w-full h-44 relative perspective cursor-pointer"
              >
                <div
                  className={`relative w-full h-full duration-550 preserve-3d ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Card Front (Face down decoration) */}
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border-2 border-rose-500/20 shadow-xl flex flex-col items-center justify-center p-4">
                    <Heart className="w-8 h-8 text-rose-500 animate-pulse-heart" />
                    <span className="text-rose-300 font-display font-medium text-xs mt-3 uppercase tracking-wider">
                      REVELAR CARTA
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1">Cargado: {idx => idx}</span>
                  </div>

                  {/* Card Back (Active challenge revealed) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-950 border-2 border-rose-500 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className={`p-1 border rounded-lg flex items-center gap-1.5 self-start text-xs ${moodConfig.color}`}>
                        {moodConfig.icon}
                        <span className="font-semibold">{moodConfig.label}</span>
                      </div>
                    </div>

                    <p className="text-sm font-display font-medium leading-relaxed my-2 text-center text-slate-100">
                      "{activeDeck[activeIndex]}"
                    </p>

                    <div className="text-[10px] text-slate-500 text-right italic font-mono">
                      Desafío {activeIndex + 1} de {activeDeck.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action indicators */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => progressChallenge(true)}
                  id="challenge-complete-btn"
                  className="flex-1 py-2 bg-green-700 hover:bg-green-600 border border-green-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition active:scale-95 text-center flex items-center justify-center gap-1"
                >
                  <Star className="w-3.5 h-3.5" /> ¡Reto Cumplido! (+15)
                </button>
                <button
                  onClick={() => progressChallenge(false)}
                  id="challenge-skip-btn"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer transition active:scale-95 text-center"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-xs p-4 text-center">No hay cartas en este mood...</div>
          )}
        </div>
      </div>

      <div className="w-full mt-6 pt-4 border-t border-slate-850 flex justify-between items-center">
        <div className="flex gap-3 text-xs font-mono">
          <span className="text-rose-400">{room.player1?.name}: {room.player1?.score || 0} pts</span>
          <span className="text-violet-400">{room.player2?.name}: {room.player2?.score || 0} pts</span>
        </div>

        <button
          onClick={exitSession}
          id="couple-exit-btn"
          className="px-4 py-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/40 text-rose-300 text-xs rounded-lg font-semibold transition"
        >
          Guardar & Volver al Lobby
        </button>
      </div>
    </div>
  );
}
