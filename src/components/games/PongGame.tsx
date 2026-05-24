import React, { useState, useEffect, useRef } from "react";
import { Room, Player } from "../../types";
import { Shield, Zap, Sparkles, Trophy, ArrowRight, ArrowLeft, Star, Volume2 } from "lucide-react";

interface PongGameProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

const ITEMS_PONG = [
  { id: "mushroom", name: "🍄 Hongo Gigante", color: "#22c55e", desc: "Hace tu paleta un 40% más grande." },
  { id: "lightning", name: "⚡ Rayo Reductor", color: "#eab308", desc: "Reduce y congela el movimiento del rival." },
  { id: "fireball", name: "🔥 Bola Fuego", color: "#ef4444", desc: "Dispara la pelota con el triple de velocidad." },
  { id: "shield", name: "🛡️ Barrera Estelar", color: "#3b82f6", desc: "Crea una pared temporal detrás de ti." }
];

export default function PongGame({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  
  const gameState = room.gameState || {};
  const winner = gameState.winner || null;
  const p1Character = gameState.p1Character || "mario";
  const p2Character = gameState.p2Character || "peach";
  
  // Scores
  const p1Score = gameState.p1PongScore !== undefined ? gameState.p1PongScore : 0;
  const p2Score = gameState.p2PongScore !== undefined ? gameState.p2PongScore : 0;

  // Items/powerups state
  const p1ActiveItem = gameState.p1ActiveItem || "";
  const p2ActiveItem = gameState.p2ActiveItem || "";
  const randomPowerupX = gameState.powerupX !== undefined ? gameState.powerupX : -100;
  const randomPowerupY = gameState.powerupY !== undefined ? gameState.powerupY : -100;
  const powerupType = gameState.powerupType || "";
  const isPowerupActive = gameState.isPowerupActive || false;

  // We choose characters just like in Smash or Mario Kart to make it super fun!
  const [characterSelected, setCharacterSelected] = useState(false);
  const [chosenChar, setChosenChar] = useState("mario");
  const [pongLog, setPongLog] = useState("¡Duelo Pong Retro! Selecciona tu personaje del Reino Champiñón.");

  // Paddle constants
  const paddleWidth = 10;
  const paddleHeightDefault = 60;
  
  // P1 uses left, P2 uses right paddle
  const p1PaddleY = useRef(120);
  const p2PaddleY = useRef(120);

  // Ball states computed locally by P1 (host) and synced to database
  const ballX = useRef(250);
  const ballY = useRef(150);
  const ballVX = useRef(4);
  const ballVY = useRef(2);

  // Keys press tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const CHARACTERS = [
    { id: "mario", name: "🔴 Mario Paddle", avatar: "👨‍🔧", color: "#ef4444", power: "Doble velocidad de tiro" },
    { id: "peach", name: "🌸 Peach Giant", avatar: "👸", color: "#ec4899", power: "Paleta extra alargada" },
    { id: "yoshi", name: "🦖 Yoshi Swift", avatar: "🦖", color: "#22c55e", power: "Velocidad de movimiento +" },
    { id: "bowser", name: "🐢 Bowser Heavy", avatar: "🐢", color: "#eab308", power: "Empequeñece la pelota al golpearla" },
  ];

  // Confirm Character Choice
  const handleConfirmChar = () => {
    setCharacterSelected(true);
    const updateKey = isPlayer1 ? "p1Character" : "p2Character";
    onUpdateState({
      [updateKey]: chosenChar,
    });
    setPongLog(`¡Confirmaste a ${CHARACTERS.find(c => c.id === chosenChar)?.name}! Esperando oponente.`);
  };

  // Sync positions periodically into Room state
  useEffect(() => {
    if (countdown !== null || !gameState.p1Character || !gameState.p2Character || winner) return;

    const syncInterval = setInterval(() => {
      onUpdateState({
        [isPlayer1 ? "p1PaddleY" : "p2PaddleY"]: isPlayer1 ? p1PaddleY.current : p2PaddleY.current
      });
    }, 120);

    return () => clearInterval(syncInterval);
  }, [countdown, gameState.p1Character, gameState.p2Character, winner]);

  // Read coordinates of the opponent's paddle instantly
  useEffect(() => {
    if (isPlayer1 && gameState.p2PaddleY !== undefined) {
      p2PaddleY.current = gameState.p2PaddleY;
    }
    if (!isPlayer1 && gameState.p1PaddleY !== undefined) {
      p1PaddleY.current = gameState.p1PaddleY;
    }
  }, [gameState.p1PaddleY, gameState.p2PaddleY]);

  // Handle countdown
  useEffect(() => {
    if (!gameState.p1Character || !gameState.p2Character) return;
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
    }
  }, [countdown, gameState.p1Character, gameState.p2Character]);

  // Keyboard Event Listeners for smooth real-time control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Sync ball position from host (P1) to general database
  useEffect(() => {
    if (!isPlayer1 || countdown !== null || winner || !gameState.p1Character || !gameState.p2Character) return;

    const ballSync = setInterval(() => {
      onUpdateState({
        ballX: ballX.current,
        ballY: ballY.current,
        ballVX: ballVX.current,
        ballVY: ballVY.current
      });
    }, 100);

    return () => clearInterval(ballSync);
  }, [countdown, winner, gameState.p1Character, gameState.p2Character]);

  // If not Player 1, align local pointers to synchronized room values
  useEffect(() => {
    if (!isPlayer1 && gameState.ballX !== undefined) {
      ballX.current = gameState.ballX;
      ballY.current = gameState.ballY;
      ballVX.current = gameState.ballVX || 4;
      ballVY.current = gameState.ballVY || 2;
    }
  }, [gameState.ballX, gameState.ballY]);

  // Core Game Loop (Drawing & Physics)
  useEffect(() => {
    if (countdown !== null || !gameState.p1Character || !gameState.p2Character || winner) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;

    const loop = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#010409");
      grad.addColorStop(1, "#0d1117");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Net lines (Dotted middle separator line)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Draw players names & score on canvas
      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.textAlign = "center";
      ctx.fillText(p1Score.toString(), canvas.width / 4, 60);
      ctx.fillText(p2Score.toString(), (3 * canvas.width) / 4, 60);

      // Speed limits and dimensions
      const sensitivity = 5;
      const speedModifierP1 = p1ActiveItem === "lightning" ? 0.4 : 1;
      const speedModifierP2 = p2ActiveItem === "lightning" ? 0.4 : 1;

      // Handle Key Movements
      if (isPlayer1) {
        // Player 1 keyboard: 'w' or 's' (or W, S uppercase)
        if (keysPressed.current["w"] || keysPressed.current["W"]) {
          p1PaddleY.current = Math.max(0, p1PaddleY.current - sensitivity * speedModifierP1);
        }
        if (keysPressed.current["s"] || keysPressed.current["S"]) {
          p1PaddleY.current = Math.min(canvas.height - (p1ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault), p1PaddleY.current + sensitivity * speedModifierP1);
        }
      } else {
        // Player 2 keyboard: ArrowUp, ArrowDown
        if (keysPressed.current["ArrowUp"]) {
          p2PaddleY.current = Math.max(0, p2PaddleY.current - sensitivity * speedModifierP2);
        }
        if (keysPressed.current["ArrowDown"]) {
          p2PaddleY.current = Math.min(canvas.height - (p2ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault), p2PaddleY.current + sensitivity * speedModifierP2);
        }
      }

      // Physics - Computed ONLY by Player 1 to ensure standard deterministic behavior
      if (isPlayer1) {
        // Move Ball
        let ballSpeedMultiplier = 1;
        if (p1ActiveItem === "fireball" && ballVX.current > 0) ballSpeedMultiplier = 2.0;
        if (p2ActiveItem === "fireball" && ballVX.current < 0) ballSpeedMultiplier = 2.0;

        ballX.current += ballVX.current * ballSpeedMultiplier;
        ballY.current += ballVY.current * ballSpeedMultiplier;

        // Wall collisions
        if (ballY.current <= 5) {
          ballY.current = 5;
          ballVY.current = -ballVY.current;
        }
        if (ballY.current >= canvas.height - 5) {
          ballY.current = canvas.height - 5;
          ballVY.current = -ballVY.current;
        }

        // Left paddle collision
        const p1H = p1ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault;
        if (ballX.current <= 30 && ballX.current >= 15) {
          if (ballY.current >= p1PaddleY.current && ballY.current <= p1PaddleY.current + p1H) {
            // bounce
            ballX.current = 31;
            ballVX.current = -ballVX.current + 0.4; // slowly speed up
            // alter angle based on hitting point
            const relativeIntersectY = (p1PaddleY.current + p1H / 2) - ballY.current;
            const normalizedIntersectY = relativeIntersectY / (p1H / 2);
            ballVY.current = -normalizedIntersectY * 5;
            
            // Trigger character specific sound/log
            setPongLog("🎾 ¡P1 rebotó la pelota con un fantástico giro!");
          }
        }

        // Right paddle collision
        const p2H = p2ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault;
        if (ballX.current >= canvas.width - 30 && ballX.current <= canvas.width - 15) {
          if (ballY.current >= p2PaddleY.current && ballY.current <= p2PaddleY.current + p2H) {
            // bounce
            ballX.current = canvas.width - 31;
            ballVX.current = -ballVX.current - 0.4;
            // alter angle
            const relativeIntersectY = (p2PaddleY.current + p2H / 2) - ballY.current;
            const normalizedIntersectY = relativeIntersectY / (p2H / 2);
            ballVY.current = -normalizedIntersectY * 5;

            setPongLog("🎾 ¡P2 bloqueó la bola con precisión estelar!");
          }
        }

        // Powerup box collision (spawn item on capture)
        if (isPowerupActive && Math.abs(ballX.current - randomPowerupX) < 25 && Math.abs(ballY.current - randomPowerupY) < 25) {
          // Ball hit powerup block! Whoever struck the ball last gets it
          const recipient = ballVX.current > 0 ? "p1" : "p2";
          
          onUpdateState({
            isPowerupActive: false,
            [recipient === "p1" ? "p1ActiveItem" : "p2ActiveItem"]: powerupType,
            powerupX: -100,
            powerupY: -100
          });
          setPongLog(`🎁 ¡${recipient === "p1" ? room.player1?.name : room.player2?.name} capturó el poder **${ITEMS_PONG.find(e => e.id === powerupType)?.name}**!`);
        }

        // Goal score checks
        if (ballX.current < 0) {
          // P2 scores
          const nextScore = p2Score + 1;
          onUpdateState({
            p2PongScore: nextScore,
            p1ActiveItem: "", // reset items
            p2ActiveItem: "",
          });
          setPongLog(`⚽ ¡GOL de ${room.player2?.name || "P2"}! (+1 Punto)`);
          
          if (nextScore >= 5) {
            onFinishGame(room.player2?.name || "Jugador 2", 100);
          } else {
            resetBall(canvas);
          }
        } else if (ballX.current > canvas.width) {
          // P1 scores
          const nextScore = p1Score + 1;
          onUpdateState({
            p1PongScore: nextScore,
            p1ActiveItem: "",
            p2ActiveItem: "",
          });
          setPongLog(`⚽ ¡GOL de ${room.player1?.name || "P1"}! (+1 Punto)`);
          
          if (nextScore >= 5) {
            onFinishGame(room.player1?.name || "Jugador 1", 100);
          } else {
            resetBall(canvas);
          }
        }

        // Randomly spawn item powerup block on canvas middle lines
        if (!isPowerupActive && Math.random() < 0.001) {
          const randomItem = ITEMS_PONG[Math.floor(Math.random() * ITEMS_PONG.length)];
          onUpdateState({
            isPowerupActive: true,
            powerupX: 150 + Math.random() * 200,
            powerupY: 50 + Math.random() * 200,
            powerupType: randomItem.id
          });
        }
      }

      // --- DRAW PLAYER 1 PADDLE (Left, Red/Mario theme or character color) ---
      const p1CurrentColor = CHARACTERS.find(c => c.id === p1Character)?.color || "#ef4444";
      const h1 = p1ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault;
      ctx.fillStyle = p1CurrentColor;
      ctx.beginPath();
      ctx.roundRect(15, p1PaddleY.current, paddleWidth, h1, 5);
      ctx.fill();
      // Glow if shield is active
      if (p1ActiveItem === "shield") {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(8, p1PaddleY.current - 10, paddleWidth + 14, h1 + 20, 8);
        ctx.stroke();
      }

      // --- DRAW PLAYER 2 PADDLE (Right, Pink/Peach theme or character color) ---
      const p2CurrentColor = CHARACTERS.find(c => c.id === p2Character)?.color || "#ec4899";
      const h2 = p2ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault;
      ctx.fillStyle = p2CurrentColor;
      ctx.beginPath();
      ctx.roundRect(canvas.width - 25, p2PaddleY.current, paddleWidth, h2, 5);
      ctx.fill();
      // Glow if shield is active
      if (p2ActiveItem === "shield") {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(canvas.width - 32, p2PaddleY.current - 10, paddleWidth + 14, h2 + 20, 8);
        ctx.stroke();
      }

      // --- DRAW POWERUP ITEM BLOCK IF ACTIVE ---
      if (isPowerupActive) {
        ctx.fillStyle = "#facc15"; // Yellow question mark box
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(randomPowerupX - 12, randomPowerupY - 12, 24, 24, 6);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw ? on item box
        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", randomPowerupX, randomPowerupY);
      }

      // --- DRAW BALL (Stretched glow based on speed) ---
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      // Use ball radius based on bowser reduce item
      const bRad = 6;
      ctx.arc(ballX.current, ballY.current, bRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [countdown, gameState.p1Character, gameState.p2Character, p1Score, p2Score, p1ActiveItem, p2ActiveItem, isPowerupActive, winner]);

  const resetBall = (canvas: HTMLCanvasElement) => {
    ballX.current = canvas.width / 2;
    ballY.current = canvas.height / 2;
    ballVX.current = (Math.random() > 0.5 ? 4 : -4);
    ballVY.current = (Math.random() > 0.5 ? 3 : -3);
  };

  // Paddle visual controls
  const movePaddleUp = () => {
    const minHeight = 0;
    if (isPlayer1) {
      p1PaddleY.current = Math.max(minHeight, p1PaddleY.current - 35);
    } else {
      p2PaddleY.current = Math.max(minHeight, p2PaddleY.current - 35);
    }
  };

  const movePaddleDown = () => {
    const canvasHeight = 300;
    const currentHeight = isPlayer1 ? (p1ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault) : (p2ActiveItem === "mushroom" ? paddleHeightDefault * 1.4 : paddleHeightDefault);
    if (isPlayer1) {
      p1PaddleY.current = Math.min(canvasHeight - currentHeight, p1PaddleY.current + 35);
    } else {
      p2PaddleY.current = Math.min(canvasHeight - currentHeight, p2PaddleY.current + 35);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden space-y-4" id="pong-root-box">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-display font-extrabold tracking-tight text-white flex items-center gap-2">
            🏓 PONG STAR <span className="text-[10px] bg-amber-500/20 text-yellow-300 font-mono border border-yellow-500/25 px-2 py-0.5 rounded font-bold">ARCADE CO-OP VS</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Primer jugador en anotar **5 puntos** gana la corona del Reino de los Novios.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="text-right">
            <span className="text-[9px] text-slate-550 block font-mono">ESTADO</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-rose-300 font-bold">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Versión Retro
            </span>
          </div>
        </div>
      </div>

      {!gameState.p1Character || !gameState.p2Character ? (
        // CHARACTER CHOOSE SCREEN
        <div className="space-y-6 py-6 max-w-lg mx-auto">
          <div className="text-center space-y-2">
            <h4 className="text-base font-bold text-slate-200">Elige tu Avatar de Batalla</h4>
            <p className="text-xs text-slate-400">Cada personaje cuenta con una estética de color única para su paleta.</p>
          </div>

          <div className="grid grid-cols-2 gap-3" id="characters-pong-grid">
            {CHARACTERS.map((char) => {
              const isSelected = chosenChar === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => !characterSelected && setChosenChar(char.id)}
                  disabled={characterSelected}
                  className={`p-4 rounded-2xl border text-left transition transform active:scale-95 cursor-pointer ${
                    isSelected
                      ? "bg-slate-800 border-rose-500 text-white shadow-lg"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                  id={`char-btn-${char.id}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-3xl">{char.avatar}</span>
                    {isSelected && <span className="text-xs text-rose-400 font-bold">SÍ</span>}
                  </div>
                  <h5 className="text-xs font-bold">{char.name}</h5>
                  <p className="text-[10px] text-slate-500 mt-1 italic">{char.power}</p>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleConfirmChar}
              disabled={characterSelected}
              className={`px-8 py-3 rounded-xl font-bold font-display text-sm tracking-wide transition cursor-pointer ${
                characterSelected
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              }`}
            >
              Confirmar Personaje ➔
            </button>
          </div>
        </div>
      ) : (
        // GAMEPLAY SCREEN
        <div className="space-y-4">
          {countdown !== null ? (
            <div className="h-[300px] flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-slate-800 py-12 text-center animate-pulse">
              <span className="text-6xl font-display font-extrabold text-white">{countdown === 0 ? "¡YA!" : countdown}</span>
              <p className="text-xs text-slate-500 mt-3 uppercase tracking-widest font-bold">Sincronizando arena de juego...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Gameplay Board container */}
              <div className="relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 max-w-full flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={300}
                  className="w-full h-auto aspect-[5/3]"
                />
              </div>

              {/* TACTILE CONTROLS FOR PLAYERS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-2">
                  <div className="text-left">
                    <span className="text-[9px] text-rose-300 font-bold block">{room.player1?.name || "Player 1"}</span>
                    <span className="text-[8px] text-slate-400 block font-mono">Teclas: [W] Arriba | [S] Abajo</span>
                  </div>
                  {isPlayer1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={movePaddleUp}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-lg active:scale-95 transition cursor-pointer"
                      >
                        🔼 SUBIR
                      </button>
                      <button
                        onClick={movePaddleDown}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-lg active:scale-95 transition cursor-pointer"
                      >
                        🔽 BAJAR
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-2">
                  <div className="text-right">
                    <span className="text-[9px] text-rose-300 font-bold block">{room.player2?.name || "Player 2"}</span>
                    <span className="text-[8px] text-slate-400 block font-mono">Teclas: [🔼] Arriba | [🔽] Abajo</span>
                  </div>
                  {!isPlayer1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={movePaddleUp}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-lg active:scale-95 transition cursor-pointer"
                      >
                        🔼 SUBIR
                      </button>
                      <button
                        onClick={movePaddleDown}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-lg active:scale-95 transition cursor-pointer"
                      >
                        🔽 BAJAR
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sincronized Logger */}
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[11px] font-mono text-center text-slate-400">
            🔔 {pongLog}
          </div>
        </div>
      )}
    </div>
  );
}
