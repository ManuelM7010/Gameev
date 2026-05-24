import React, { useState, useEffect } from "react";
import { Room, Player } from "../../types";
import { Sparkles, Trophy, RotateCcw } from "lucide-react";

interface SpicyDiceProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

const DICE_ACTIONS = [
  { text: "💋 Dar un Besito", icon: "💋", desc: "Dale un beso suave y cariñoso." },
  { text: "🧸 Dar un Abrazo", icon: "🧸", desc: "Dale un fuerte y cálido abrazo de oso." },
  { text: "🌬️ Dar un Susurro", icon: "🌬️", desc: "Dile una frase dulce o coqueta al oído." },
  { text: "🦷 Dar un Mordisquito", icon: "🦷", desc: "Hazle un mordisquito sumamente tierno." },
  { text: "💆 Dar un Masaje", icon: "💆", desc: "Hazle un masaje relajante de hombros..." },
  { text: "💬 Decir un Cumplido", icon: "💬", desc: "Elogia algo que te fascina de tu pareja." },
];

const DICE_TARGETS = [
  { text: "El Cuello 🦒", icon: "🦒", desc: "Enfocado en su cuello o nuca." },
  { text: "Los Labios 👄", icon: "👄", desc: "Directo sobre sus hermosos labios." },
  { text: "La Oreja 👂", icon: "👂", desc: "Justo en el lóbulo de su oreja." },
  { text: "La Espalda 🪐", icon: "🪐", desc: "Consiente su espalda o cintura." },
  { text: "Las Manos 🤝", icon: "🤝", desc: "Sostén o besa delicadamente sus manos." },
  { text: "La Mejilla 🌸", icon: "🌸", desc: "Sobre su mejilla tierna." },
];

export default function SpicyDice({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: SpicyDiceProps) {
  const gameState = room.gameState || {};
  const dice1 = gameState.dice1 !== undefined ? gameState.dice1 : 0;
  const dice2 = gameState.dice2 !== undefined ? gameState.dice2 : 0;
  const isRolling = gameState.isRolling || false;
  const rollerUid = gameState.rollerUid || "";
  const rollCount = gameState.rollCount || 0;

  const [localRolling, setLocalRolling] = useState(false);
  const [localD1, setLocalD1] = useState(0);
  const [localD2, setLocalD2] = useState(0);

  // Sync server rolling state with local state
  useEffect(() => {
    if (isRolling) {
      setLocalRolling(true);
      const interval = setInterval(() => {
        setLocalD1(Math.floor(Math.random() * DICE_ACTIONS.length));
        setLocalD2(Math.floor(Math.random() * DICE_TARGETS.length));
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setLocalRolling(false);
        if (currentPlayer.uid === rollerUid) {
          onUpdateState({
            isRolling: false,
          });
        }
      }, 1800);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setLocalD1(dice1);
      setLocalD2(dice2);
      setLocalRolling(false);
    }
  }, [isRolling, dice1, dice2, rollerUid]);

  const rollDice = () => {
    if (isRolling || localRolling) return;

    // Play synthesized bleep sound for retro arcade feel!
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext blocks sometimes, ignore safely
    }

    const rand1 = Math.floor(Math.random() * DICE_ACTIONS.length);
    const rand2 = Math.floor(Math.random() * DICE_TARGETS.length);

    onUpdateState({
      dice1: rand1,
      dice2: rand2,
      isRolling: true,
      rollerUid: currentPlayer.uid,
      rollCount: rollCount + 1,
    });
  };

  const currentRollerName =
    rollerUid === room.player1?.uid ? room.player1?.name : room.player2?.name || "Pareja";

  const isMyTurnToReceive = rollerUid && rollerUid !== currentPlayer.uid;

  const rewardPoints = (points: number) => {
    const isP1 = room.player1?.uid === currentPlayer.uid;
    const scoreUpdateField = isP1 ? "player1Score" : "player2Score";
    const currentScore = isP1 ? (room.player1?.score || 0) : (room.player2?.score || 0);

    onUpdateState({
      [scoreUpdateField]: currentScore + points,
    });

    onFinishGame(currentPlayer.name, points);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white shadow-xl" id="spicy-dice-arena">
      <div className="flex justify-between items-center w-full mb-6">
        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-mono">
          💋 DADOS COQUETOS MULTIJUGADOR
        </span>
        <span className="text-xs text-rose-300 font-mono">Tiradas: {rollCount}</span>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-display font-medium text-rose-200">Dados del Deseo en Pareja</h3>
        <p className="text-xs text-rose-300 mt-1 max-w-sm mx-auto">
          Lanza los dados mágicos. El que lanza debe realizar la acción en la zona indicada de su pareja.
        </p>
      </div>

      {/* Realtime synchronized rolling container */}
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-center py-6 w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 p-4 mb-6">
        {/* DICE 1 (ACTION) */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">DADO DE ACCIÓN</span>
          <div
            className={`w-28 h-28 bg-gradient-to-br from-rose-800 to-rose-950 rounded-2xl border-2 border-rose-500/30 flex flex-col items-center justify-center text-center p-2 shadow-2xl relative overflow-hidden transition-all duration-100 ${
              localRolling ? "animate-bounce scale-105 rotate-6 shadow-rose-500/40" : ""
            }`}
          >
            <div className="text-4xl mb-1">{DICE_ACTIONS[localD1]?.icon}</div>
            <div className="text-[11px] font-bold tracking-tight text-white line-clamp-2">
              {DICE_ACTIONS[localD1]?.text.split(" ").slice(1).join(" ")}
            </div>
          </div>
        </div>

        {/* PLUS JOINER */}
        <div className="text-lg font-bold text-rose-500 font-mono">+</div>

        {/* DICE 2 (BODY ZONE) */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">DADO DE ZONA</span>
          <div
            className={`w-28 h-28 bg-gradient-to-br from-violet-800 to-violet-950 rounded-2xl border-2 border-violet-500/30 flex flex-col items-center justify-center text-center p-2 shadow-2xl relative overflow-hidden transition-all duration-100 ${
              localRolling ? "animate-bounce scale-105 -rotate-6 shadow-violet-500/40" : ""
            }`}
          >
            <div className="text-4xl mb-1">{DICE_TARGETS[localD2]?.icon}</div>
            <div className="text-[11px] font-bold tracking-tight text-white line-clamp-2">
              {DICE_TARGETS[localD2]?.text}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions on the rolled combination */}
      {!localRolling && rollerUid && (
        <div className="w-full bg-slate-950/60 border border-white/5 p-4 rounded-xl text-center mb-6 animate-fade-in space-y-1.5">
          <p className="text-xs text-rose-300">
            👋 <strong className="text-rose-100">{currentRollerName}</strong> lanzó la combinación:
          </p>
          <h4 className="text-base font-bold text-rose-400 font-display">
            ¡{DICE_ACTIONS[localD1]?.text} en {DICE_TARGETS[localD2]?.text}!
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto">
            {DICE_ACTIONS[localD1]?.desc} {DICE_TARGETS[localD2]?.desc}
          </p>
        </div>
      )}

      {/* Control Actions buttons */}
      <div className="w-full space-y-4">
        <div className="flex justify-center">
          <button
            onClick={rollDice}
            disabled={localRolling || isRolling}
            className={`px-8 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-display text-xs font-bold uppercase rounded-xl tracking-wider shadow-lg hover:shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5`}
            id="roll-dice-btn"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            {localRolling ? "Girando Dados coquetos..." : "¡LANZAR DADOS!"}
          </button>
        </div>

        {/* Referee Points / Validation Action */}
        {!localRolling && rollerUid && (
          <div className="pt-4 border-t border-slate-800/80 w-full flex flex-col items-center gap-3">
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider">
              {isMyTurnToReceive
                ? "👇 ¿Tu pareja cumplió con el dulce castigo? Corónala de campeón:"
                : "👇 Esperando que tu pareja confirme que cumpliste el reto..."}
            </p>

            <div className="flex gap-2">
              {isMyTurnToReceive ? (
                <>
                  <button
                    onClick={() => rewardPoints(20)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition active:scale-95"
                  >
                    🏆 Si lo hizo (+20 Pts)
                  </button>
                  <button
                    onClick={() => {
                      onUpdateState({ rollerUid: "", isRolling: false, dice1: 0, dice2: 0 });
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition"
                  >
                    Pasar Turno
                  </button>
                </>
              ) : (
                <div className="text-[11px] text-rose-300 animate-pulse font-mono bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                  ⌛ Esperando que valide tu pareja...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-full mt-6 flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-805 pt-2 font-mono">
        <span>Anfitrión: {room.player1?.name}</span>
        <span>Pareja: {room.player2?.name || "Esperando..."}</span>
      </div>
    </div>
  );
}
