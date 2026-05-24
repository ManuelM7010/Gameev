import React, { useEffect, useState } from "react";
import { Room, Player } from "../../types";
import { Copy, RefreshCw, Trophy } from "lucide-react";

interface MemoryMatchProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_SETS = ["💖", "🌹", "🍫", "💋", "🥂", "🎁", "🧸", "💍"];

export default function MemoryMatch({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: MemoryMatchProps) {
  const gameState = room.gameState || {};
  const cards: Card[] = gameState.memCards || [];
  const currentTurn = gameState.memTurn || "p1"; // "p1" or "p2"
  const p1Score = gameState.memScoreP1 || 0;
  const p2Score = gameState.memScoreP2 || 0;
  const winner = gameState.memWinner || null;
  const flippedIndices: number[] = gameState.memFlipped || [];

  const isMyTurn = (isPlayer1 && currentTurn === "p1") || (!isPlayer1 && currentTurn === "p2");

  // Setup / reset cards board synchronously
  const initBoard = () => {
    // Generate pairs and shuffle
    const paired = [...EMOJI_SETS, ...EMOJI_SETS];
    // Shuffle paired array
    for (let i = paired.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paired[i], paired[j]] = [paired[j], paired[i]];
    }

    const initialCards: Card[] = paired.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));

    onUpdateState({
      memCards: initialCards,
      memTurn: "p1",
      memScoreP1: 0,
      memScoreP2: 0,
      memWinner: null,
      memFlipped: [],
    });
  };

  // On mount initialized board
  useEffect(() => {
    if (cards.length === 0) {
      initBoard();
    }
  }, []);

  // Sync auto flip-down logic
  useEffect(() => {
    if (flippedIndices.length === 2) {
      const timer = setTimeout(() => {
        const [firstIdx, secondIdx] = flippedIndices;
        const firstCard = cards[firstIdx];
        const secondCard = cards[secondIdx];

        if (firstCard && secondCard) {
          const isMatch = firstCard.emoji === secondCard.emoji;
          const nextCards = cards.map((c, idx) => {
            if (idx === firstIdx || idx === secondIdx) {
              return {
                ...c,
                isFlipped: isMatch,
                isMatched: isMatch,
              };
            }
            return c;
          });

          const update: any = {
            memFlipped: [],
            memCards: nextCards,
          };

          if (isMatch) {
            // Give score
            if (currentTurn === "p1") {
              update.memScoreP1 = p1Score + 1;
            } else {
              update.memScoreP2 = p2Score + 1;
            }

            // Check if all matched
            const totalMatches = (update.memScoreP1 || p1Score) + (update.memScoreP2 || p2Score);
            if (totalMatches === EMOJI_SETS.length) {
              const p1F = update.memScoreP1 || p1Score;
              const p2F = update.memScoreP2 || p2Score;
              let winName = "Empate";
              if (p1F > p2F) winName = room.player1?.name || "Player 1";
              if (p2F > p1F) winName = room.player2?.name || "Player 2";
              update.memWinner = winName;
              onFinishGame(winName, 45);
            }
            // Keep turn if match!
          } else {
            // Change turn
            update.memTurn = currentTurn === "p1" ? "p2" : "p1";
          }

          onUpdateState(update);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [flippedIndices, cards, currentTurn, p1Score, p2Score]);

  const handleCardClick = (index: number) => {
    if (!isMyTurn || flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched || winner) {
      return;
    }

    const nextFlipped = [...flippedIndices, index];
    const nextCards = cards.map((c, idx) => {
      if (idx === index) {
        return { ...c, isFlipped: true };
      }
      return c;
    });

    onUpdateState({
      memCards: nextCards,
      memFlipped: nextFlipped,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white" id="memory-duel-arena">
      <div className="flex justify-between items-center w-full mb-4">
        <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-mono">
          🧠 DUELO DE MEMORIA EN PAREJA
        </span>
        <button
          onClick={initBoard}
          className="text-slate-400 hover:text-rose-400 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Reiniciar Tablero
        </button>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-display font-medium text-rose-200">Encuentra las Parejas</h3>
        <p className="text-xs text-rose-300 mt-1">
          {winner
            ? "¡Duelo Completo!"
            : isMyTurn
            ? "🟢 ¡Es tu turno de buscar coincidencia!"
            : `🔴 Turno de tu pareja: ${currentTurn === "p1" ? room.player1?.name : room.player2?.name}`}
        </p>
      </div>

      {/* Grid rendering */}
      <div className="grid grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 max-w-md w-full">
        {cards.map((card, idx) => {
          const isRevealed = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={isRevealed || !isMyTurn || !!winner}
              className={`h-20 w-full rounded-xl flex items-center justify-center text-3xl focus:outline-none transition active:scale-95 duration-150 cursor-pointer ${
                isRevealed
                  ? "bg-slate-900 border-2 border-rose-500/40 shadow shadow-rose-500/10"
                  : "bg-gradient-to-tr from-violet-850 to-rose-900 hover:brightness-110 border border-violet-800"
              }`}
            >
              {isRevealed ? card.emoji : "❓"}
            </button>
          );
        })}
      </div>

      {/* Status Footer Score */}
      <div className="w-full mt-6 space-y-4">
        <div className="flex justify-around items-center bg-black/20 py-3 rounded-xl border border-white/5 text-xs text-slate-300 font-semibold font-mono">
          <div className="text-center">
            <span className="text-xs">{room.player1?.avatar || "❤️"}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">{room.player1?.name}</p>
            <p className="text-sm font-bold text-rose-400 mt-0.5">{p1Score} pares</p>
          </div>
          <div className="text-center text-lg text-rose-500/40">VS</div>
          <div className="text-center">
            <span className="text-xs">{room.player2?.avatar || "💖"}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">{room.player2?.name || "Esperando..."}</p>
            <p className="text-sm font-bold text-rose-400 mt-0.5">{p2Score} pares</p>
          </div>
        </div>

        {winner && (
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-green-500/20 text-center animate-bounce flex flex-col items-center gap-1">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <p className="text-sm font-semibold font-display text-emerald-400">
              {winner === "Empate" ? "¡Es un empate perfecto de memoria!" : `🎉 ¡Ganador: ${winner}!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
