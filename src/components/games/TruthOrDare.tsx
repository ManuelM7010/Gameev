import React, { useState } from "react";
import { Room, Player } from "../../types";
import { HelpCircle, Sparkles, Flame, Eye, RefreshCw } from "lucide-react";

interface TruthOrDareProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

const TRUTH_BANK = [
  "¿Cuál fue tu primera impresión real sobre mí cuando nos conocimos?",
  "Si ganaras la lotería mañana, ¿qué viaje romántico planearías para nosotros dos?",
  "¿Cuál es el cumplido o frase que te he dicho que más recuerdas o guardas con cariño?",
  "¿Qué rasgo o detalle físico mío te enamora hoy más que al principio?",
  "Si pudieras elegir un superpoder únicamente para hacerme feliz, ¿cuál elegirías?",
  "¿Cuál es tu fantasía o plan ideal de cita perfecta que aún no hayamos cumplido?",
  "¿Qué manía graciosa mía te parece sumamente adorable aunque digas lo contrario?",
  "Si tuvieras que describirme usando solamente tres canciones de amor, ¿cuáles serían?",
  "¿Qué momento de nuestra historia juntos te gustaría repetir en cámara lenta?",
  "¿Qué canción o rincón te recuerda instantáneamente a mí cuando estás a solas?"
];

const DARE_BANK = [
  "Dale un beso de película de 8 segundos en el cuello o mejilla a tu pareja ahora.",
  "Escríbele un mensaje de texto sumamente pícaro o cariñoso y envíaselo justo en este instante.",
  "Sostén las manos de tu pareja y mírale fijamente a los ojos durante 20 segundos sin reírte.",
  "Dile un piropo tan exageradamente cursi y dramático que le haga ruborizarse.",
  "Dale un masaje suave en los hombros o el cuello durante un minuto entero.",
  "Susúrrale al oído tu deseo oculto más travieso con voz seductora.",
  "Hazle una promesa graciosa o un favor cariñoso (como traerle agua, snacks) para cumplir hoy.",
  "Canta un fragmento corto de una canción romántica dedicándosela con mirada exagerada.",
  "Párate y haz una breve imitación o baile divertido que haga reír a tu pareja.",
  "Dale un abrazo fuerte por la espalda durante 15 segundos mecíendola suavemente."
];

export default function TruthOrDare({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: TruthOrDareProps) {
  const gameState = room.gameState || {};
  const currentTurn = gameState.todTurn || "p1"; // "p1" or "p2"
  const selectedType = gameState.todType || null; // "truth" or "dare"
  const selectedText = gameState.todText || null;
  const isCompleted = gameState.todCompleted || false;

  const isMyTurn = (isPlayer1 && currentTurn === "p1") || (!isPlayer1 && currentTurn === "p2");

  const selectOption = (type: "truth" | "dare") => {
    if (!isMyTurn) return;

    const bank = type === "truth" ? TRUTH_BANK : DARE_BANK;
    const randomIndex = Math.floor(Math.random() * bank.length);
    const text = bank[randomIndex];

    onUpdateState({
      todType: type,
      todText: text,
      todCompleted: false,
    });
  };

  const completeChallenge = (points: number) => {
    if (!isMyTurn) return;

    const isP1 = room.player1?.uid === currentPlayer.uid;
    const scoreUpdateField = isP1 ? "player1Score" : "player2Score";
    const currentScore = isP1 ? (room.player1?.score || 0) : (room.player2?.score || 0);

    const nextTurn = currentTurn === "p1" ? "p2" : "p1";

    onUpdateState({
      [scoreUpdateField]: currentScore + points,
      todCompleted: true,
      todTurn: nextTurn,
      todType: null,
      todText: null,
    });

    onFinishGame(currentPlayer.name, points);
  };

  const activeTurnName = currentTurn === "p1" ? (room.player1?.name || "Player 1") : (room.player2?.name || "Player 2");

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white" id="truth-dare-portal">
      <div className="flex justify-between items-center w-full mb-4">
        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-mono">
          🔥 VERDAD O RETO COQUETO
        </span>
        <span className="text-xs text-rose-300 font-mono">
          Acción: {activeTurnName}
        </span>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-display font-medium text-rose-200">Verdad o Reto Íntimo</h3>
        <p className="text-xs text-rose-300 mt-1 max-w-md mx-auto">
          ¿Escogerás responder con total sinceridad o atreverte a cumplir el sensual reto de pareja?
        </p>
      </div>

      {/* Card Arena */}
      {!selectedText ? (
        <div className="w-full max-w-md bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-6">
          <p className="text-sm text-slate-300">
            {isMyTurn
              ? "👉 Elige una opción para revelar tu desafío:"
              : `⌛ Esperando que ${activeTurnName} seleccione Verdad o Reto...`}
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => selectOption("truth")}
              disabled={!isMyTurn}
              className="px-6 py-4 bg-gradient-to-tr from-violet-600 to-violet-900 hover:brightness-110 disabled:opacity-40 text-sm font-bold uppercase tracking-wider rounded-xl cursor-pointer flex-1 transition flex flex-col items-center gap-2 border border-violet-500/30"
              id="choose-truth-btn"
            >
              <HelpCircle className="w-6 h-6 text-violet-300" />
              Verdad
            </button>
            <button
              onClick={() => selectOption("dare")}
              disabled={!isMyTurn}
              className="px-6 py-4 bg-gradient-to-tr from-rose-600 to-rose-900 hover:brightness-110 disabled:opacity-40 text-sm font-bold uppercase tracking-wider rounded-xl cursor-pointer flex-1 transition flex flex-col items-center gap-2 border border-rose-500/30"
              id="choose-dare-btn"
            >
              <Flame className="w-6 h-6 text-rose-300 animate-pulse" />
              Reto
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-slate-950 p-6 rounded-2xl border-2 border-rose-500/30 text-center space-y-6 relative overflow-hidden animate-scale-up">
          <div className="absolute right-4 top-4">
            {selectedType === "truth" ? (
              <span className="px-2 py-0.5 bg-violet-500/25 text-violet-300 text-[9px] font-mono rounded uppercase">
                PREGUNTA VERDAD
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-rose-500/25 text-rose-300 text-[9px] font-mono rounded uppercase">
                ACCIÓN RETO
              </span>
            )}
          </div>

          <div className="pt-4">
            <div className={`p-4 rounded-xl border leading-relaxed text-sm font-display font-semibold ${
              selectedType === "truth"
                ? "bg-violet-950/20 border-violet-500/20 text-violet-200"
                : "bg-rose-950/20 border-rose-500/20 text-rose-200"
            }`}>
              "{selectedText}"
            </div>
          </div>

          {isMyTurn ? (
            <div className="space-y-2">
              <button
                onClick={() => completeChallenge(20)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs font-bold uppercase rounded-xl shadow cursor-pointer transition active:scale-95"
                id="complete-tod-btn"
              >
                ✓ Cumplí el desafío (+20 Pts)
              </button>
              <button
                onClick={() => {
                  onUpdateState({ todType: null, todText: null });
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl cursor-pointer transition"
              >
                Cambiar de pregunta
              </button>
            </div>
          ) : (
            <div className="p-3 bg-rose-500/5 text-rose-300 text-xs animate-pulse rounded-xl border border-rose-500/10 font-mono">
              ⚡ Esperando que {activeTurnName} complete la acción en persona...
            </div>
          )}
        </div>
      )}

      {/* Quick turn instructions footer */}
      <div className="w-full mt-6 bg-black/10 py-2 px-4 rounded-xl flex justify-between text-[10px] text-slate-500 font-mono border border-white/5">
        <span>Anfitrión (P1): {room.player1?.name}</span>
        <span>Pareja (P2): {room.player2?.name || "Esperando..."}</span>
      </div>
    </div>
  );
}
