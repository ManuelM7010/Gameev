import React, { useState, useEffect, useRef } from "react";
import { Room, Player } from "../../types";
import { Palette, Play, Trash2, Send, Lightbulb, Sparkles } from "lucide-react";

interface DrawingDuelProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

const SECRET_WORDS = ["Corazón", "Gatito", "Arcoíris", "Anillo de Bodas", "Paraguas", "Castillo", "Abrazo", "Sol"];

export default function DrawingDuel({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: DrawingDuelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const gameState = room.gameState || {};
  const currentWord = gameState.secretWord || SECRET_WORDS[0];
  const strokes = gameState.strokes || []; // format: Array<{ x1, y1, x2, y2, color }>
  const lastEvaluatedGuess = gameState.lastGuessResult || null;

  const [guessInput, setGuessInput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#f43f5e");

  // Both players' roles are determined: Player 1 is the Artist, Player 2 is the Guesser
  const isArtist = isPlayer1;

  // Sync canvas lines on change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and redraw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;

    strokes.forEach((stroke: any) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color || "#f43f5e";
      ctx.moveTo(stroke.x1, stroke.y1);
      ctx.lineTo(stroke.x2, stroke.y2);
      ctx.stroke();
    });
  }, [strokes]);

  // Artist drawing logic
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isArtist) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Scale matching the physical canvas resolution (e.g. 500x320)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isArtist || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newStroke = {
      x1: lastPosRef.current.x,
      y1: lastPosRef.current.y,
      x2: x,
      y2: y,
      color: selectedColor,
    };

    const nextStrokes = [...strokes, newStroke];
    onUpdateState({ strokes: nextStrokes });
    lastPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    if (!isArtist) return;
    onUpdateState({ strokes: [] });
  };

  // Change active word
  const cycleWord = () => {
    if (!isArtist) return;
    const randWord = SECRET_WORDS[Math.floor(Math.random() * SECRET_WORDS.length)];
    onUpdateState({ secretWord: randWord, strokes: [], lastGuessResult: null });
  };

  // Guess submission to server with Gemini similarity evaluator
  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || loadingAI) return;

    setLoadingAI(true);
    try {
      const response = await fetch("/api/ai/evaluate-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetWord: currentWord,
          guessWord: guessInput,
        }),
      });

      const resData = await response.json();
      setLoadingAI(false);

      onUpdateState({
        lastGuessResult: {
          guess: guessInput,
          score: resData.score,
          correct: resData.correct,
          message: resData.message,
          timestamp: Date.now(),
        },
      });

      // Clear guesser input
      setGuessInput("");

      if (resData.correct) {
        // Direct victory!
        const scorerName = room.player2?.name || "Guesser";
        onFinishGame(scorerName, 50);
      }
    } catch (err) {
      console.error(err);
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white" id="drawing-duel">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-xs font-mono">
          MINIGAME: DUELO DE DIBUJO
        </span>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-2xl font-display font-medium text-rose-200">Dibuja y Adivina Inteligente</h3>
        <p className="text-xs text-rose-300 mt-1">
          {isArtist
            ? "¡Tú eres el artista! Dibuja la palabra secreta sin letras de forma descriptiva."
            : `¡Te toca adivinar! Escribe lo que ves y la IA evaluará qué tan cerca estás.`}
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Play board / Canvas */}
        <div className="md:col-span-8 flex flex-col items-center">
          <div className="w-full relative bg-slate-950 rounded-2xl p-2 border border-slate-800">
            <canvas
              ref={canvasRef}
              width={420}
              height={300}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className={`w-full h-auto bg-slate-950/40 rounded-xl ${
                isArtist ? "cursor-crosshair" : "cursor-not-allowed"
              }`}
            />

            {isArtist && (
              <div className="absolute top-4 left-4 bg-rose-600 border border-rose-400/30 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                <Lightbulb className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-slate-100">Palabra secreta: </span>
                <strong className="text-white uppercase font-bold text-sm tracking-wide">{currentWord}</strong>
              </div>
            )}
          </div>

          {/* Artist Palette */}
          {isArtist ? (
            <div className="w-full flex justify-between items-center mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex gap-2">
                {["#f43f5e", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#ffb703", "#ffffff"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border border-slate-700 cursor-pointer hover:scale-110 active:scale-95 transition ${
                      selectedColor === color ? "ring-2 ring-white" : ""
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={cycleWord}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer text-slate-200 transition"
                >
                  Cambiar Palabra
                </button>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900 rounded-lg text-xs font-semibold cursor-pointer text-red-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpiar
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full text-center text-[10px] text-slate-500 mt-2 font-mono">
              El panel de dibujo está transmitiendo la señal de tu pareja en tiempo real...
            </div>
          )}
        </div>

        {/* Guesser Sidebar & AI logs */}
        <div className="md:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-mono">Evaluador de Turno</h4>

            {/* AI feedback indicator */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center min-h-[140px] flex flex-col justify-center gap-2">
              {lastEvaluatedGuess ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-slate-400">
                    Último intento: <strong className="text-slate-100 uppercase">"{lastEvaluatedGuess.guess}"</strong>
                  </div>

                  {/* Meter bar */}
                  <div className="relative pt-1">
                    <div className="flex mb-1 items-center justify-between">
                      <span className="text-xs font-semibold text-rose-400">Cercanía Semántica</span>
                      <span className="text-xs font-bold text-rose-300">{lastEvaluatedGuess.score}%</span>
                    </div>
                    <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-800">
                      <div
                        style={{ width: `${lastEvaluatedGuess.score}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-305 ${
                          lastEvaluatedGuess.score > 70 ? "bg-green-500" : lastEvaluatedGuess.score > 40 ? "bg-amber-500" : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-rose-200 font-display italic mt-2">
                    "{lastEvaluatedGuess.message}"
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 leading-relaxed italic">
                  Escribe un intento a la derecha. El asistente de IA leerá la idea y te dirá qué tan "caliente/cerca" estás del resultado real.
                </div>
              )}
            </div>
          </div>

          {/* Guesser interactive panel */}
          {!isArtist ? (
            <form onSubmit={handleSubmitGuess} className="mt-4 flex gap-2">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                disabled={loadingAI}
                placeholder="¿Qué crees que es?"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 text-xs px-3 py-2.5 rounded-lg outline-none text-white font-medium"
              />
              <button
                type="submit"
                disabled={loadingAI}
                id="drawing-submit-btn"
                className="px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition shadow-lg shadow-rose-900/20"
              >
                {loadingAI ? <Sparkles className="w-4 h-4 animate-spin-slow" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <div className="mt-4 p-3 bg-rose-950/20 rounded-xl border border-rose-900/30 text-[11px] text-rose-300 leading-relaxed text-center">
              Tu pareja está tecleando respuestas alternativas ahora mismo. No des pistas! 😊
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
