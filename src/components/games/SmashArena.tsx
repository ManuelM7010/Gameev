import React, { useState, useEffect, useRef } from "react";
import { Room, Player } from "../../types";
import { Shield, Zap, Sparkles, Heart, RefreshCw, Star, Info } from "lucide-react";

interface SmashArenaProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

const CHARACTERS = [
  { id: "mario", name: "🔴 Plumber Bro (Mario)", avatar: "👨‍🔧", attack: "🔥 Bola de Fuego", stats: "Equilibrado y rápido.", damageMultiplier: 1.0 },
  { id: "peach", name: "🌸 Rose Princess (Peach)", avatar: "👸", attack: "🍳 Sartén Volador", stats: "Levedad aérea. Doble salto alto.", damageMultiplier: 0.8 },
  { id: "yoshi", name: "🦖 Dino Swift (Yoshi)", avatar: "🦖", attack: "🥚 Lanzamiento de Huevo", stats: "Ataque veloz de rebote.", damageMultiplier: 1.1 },
  { id: "bowser", name: "🐢 Koopa King (Bowser)", avatar: "🐢", attack: "🔥 Aliento de Dragón", stats: "Pesado. Golpes con gran empuje.", damageMultiplier: 1.3 },
];

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerIsP1: boolean;
  color: string;
  size: number;
  damage: number;
}

export default function SmashArena({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: SmashArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  
  const gameState = room.gameState || {};
  const winner = gameState.winner || null;
  const p1Character = gameState.p1Character || "";
  const p2Character = gameState.p2Character || "";
  
  // Smash state
  const p1Lives = gameState.p1Lives !== undefined ? gameState.p1Lives : 3;
  const p2Lives = gameState.p2Lives !== undefined ? gameState.p2Lives : 3;
  const p1Percent = gameState.p1Percent !== undefined ? gameState.p1Percent : 0;
  const p2Percent = gameState.p2Percent !== undefined ? gameState.p2Percent : 0;

  // Local Character variables
  const [selectedChar, setSelectedChar] = useState("mario");
  const [charConfirmed, setCharConfirmed] = useState(false);
  const [arenaLog, setArenaLog] = useState("¡Elige tu campeón de Smash!");

  // Track physical position on local reference to avoid high-frequency React synchronization Lag
  const xPos = useRef(isPlayer1 ? 160 : 340);
  const yPos = useRef(160);
  const xVel = useRef(0);
  const yVel = useRef(0);
  
  // Double jump tracking
  const doubleJumpUsed = useRef(false);

  // Active projectiles
  const projectiles = useRef<Projectile[]>([]);

  // Periodically send position update in room
  useEffect(() => {
    if (countdown !== null || !p1Character || !p2Character || winner) return;

    const interval = setInterval(() => {
      onUpdateState({
        [isPlayer1 ? "p1Pos" : "p2Pos"]: { x: xPos.current, y: yPos.current }
      });
    }, 120);

    return () => clearInterval(interval);
  }, [countdown, p1Character, p2Character, winner]);

  // Sync lives and percent into room whenever they change locally, but do so with authority
  const updateDamageAndLives = (p1L: number, p2L: number, p1P: number, p2P: number) => {
    onUpdateState({
      p1Lives: p1L,
      p2Lives: p2L,
      p1Percent: p1P,
      p2Percent: p2P
    });
  };

  // Live countdown timer on start
  useEffect(() => {
    if (!p1Character || !p2Character) return;
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
    }
  }, [countdown, p1Character, p2Character]);

  // Main Canvas & Physics loop
  useEffect(() => {
    if (countdown !== null || !p1Character || !p2Character || winner) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gravity = 0.45;
    const friction = 0.90;
    
    // Arena platform coordinates (Middle of the screen)
    const platformX = 80;
    const platformY = 220;
    const platformW = 340;
    const platformH = 15;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- DRAW BACKGROUND SPACE ---
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#090d16");
      gradient.addColorStop(1, "#181024");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Star particles decor in background
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      for (let i = 0; i < 20; i++) {
        const sx = (Math.sin(i * 3500) * 0.5 + 0.5) * canvas.width;
        const sy = (Math.cos(i * 1200) * 0.5 + 0.5) * (canvas.height - 80);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // --- DRAW FLOATING MAIN ARENA PLATFORM ---
      // Platform border neon glow
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#271b42"; // Deep purple platform
      ctx.fillRect(platformX, platformY, platformW, platformH);
      ctx.shadowBlur = 0; // Reset shadow

      // Platform details line (futuristic yellow smash theme)
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(platformX + 20, platformY + 2, platformW - 40, 2);

      // Platform bottom support block
      ctx.fillStyle = "#1e1530";
      ctx.beginPath();
      ctx.moveTo(platformX + 40, platformY + platformH);
      ctx.lineTo(platformX + platformW - 40, platformY + platformH);
      ctx.lineTo(platformX + platformW - 100, platformY + platformH + 25);
      ctx.lineTo(platformX + 100, platformY + platformH + 25);
      ctx.closePath();
      ctx.fill();

      // --- COMPUTE PHYSICS FOR LOCAL PLAYER ---
      yVel.current += gravity; // Pull down
      xVel.current *= friction; // Horizontal deceleration

      xPos.current += xVel.current;
      yPos.current += yVel.current;

      // Platform Collisions (Only land when falling downwards)
      const isAbovePlatform = xPos.current + 18 >= platformX && xPos.current - 18 <= platformX + platformW;
      const isCollidingY = yPos.current + 18 >= platformY && yPos.current + 8 <= platformY + platformH;

      if (isAbovePlatform && isCollidingY && yVel.current > 0) {
        yPos.current = platformY - 18;
        yVel.current = 0;
        doubleJumpUsed.current = false; // Reset double jump
      }

      // Fall off check (Lost life!)
      const limitBlastZone = canvas.height + 40;
      const limitSidesBlastZone = canvas.width + 40;

      if (yPos.current > limitBlastZone || xPos.current < -30 || xPos.current > limitSidesBlastZone) {
        // Explode respawn!
        xPos.current = canvas.width / 2;
        yPos.current = 60;
        xVel.current = 0;
        yVel.current = 0;

        // Perform score deduction
        if (isPlayer1) {
          const nextLives = Math.max(0, p1Lives - 1);
          setArenaLog("💥 ¡Te mandaron a volar fuera de la pantalla!");
          
          if (nextLives === 0) {
            onFinishGame(room.player2?.name || "Pareja", 50);
            updateDamageAndLives(nextLives, p2Lives, 0, p2Percent);
          } else {
            updateDamageAndLives(nextLives, p2Lives, 0, p2Percent);
          }
        } else {
          const nextLives = Math.max(0, p2Lives - 1);
          setArenaLog("💥 ¡Te mandaron a volar fuera de la pantalla!");
          
          if (nextLives === 0) {
            onFinishGame(room.player1?.name || "Pareja", 50);
            updateDamageAndLives(p1Lives, nextLives, p1Percent, 0);
          } else {
            updateDamageAndLives(p1Lives, nextLives, p1Percent, 0);
          }
        }
      }

      // Keep inside bounds
      if (xPos.current < -35) xPos.current = -35;
      if (xPos.current > canvas.width + 35) xPos.current = canvas.width + 35;

      // --- PROJECTILE ENGINE MOVEMENT & COLLISIONS ---
      const activeProjs = projectiles.current;
      for (let pIndex = activeProjs.length - 1; pIndex >= 0; pIndex--) {
        const proj = activeProjs[pIndex];
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Draw bullet
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Collision Check: Bullet hitting opposing player locally
        const oppX = isPlayer1 ? (gameState.p2Pos?.x || 340) : (gameState.p1Pos?.x || 160);
        const oppY = isPlayer1 ? (gameState.p2Pos?.y || 160) : (gameState.p1Pos?.y || 160);

        // Does bullet hit? (Only check own bullet vs other player to avoid race condition)
        if (proj.ownerIsP1 === isPlayer1) {
          const distance = Math.hypot(proj.x - oppX, proj.y - oppY);
          if (distance < 24) {
            // Hit Opponent!
            const impactForceDirection = proj.vx > 0 ? 1 : -1;
            
            // Increment Opponent's damage % and apply immediate knockback over Room State
            const hitDamage = proj.damage;
            const oppPercent = isPlayer1 ? p2Percent : p1Percent;
            const newOppPercent = oppPercent + hitDamage;

            // Smash Knockback Formula: Base push + (percentage multiplier!)
            const baseForce = 7;
            const finalKnockForce = baseForce * (1 + newOppPercent / 55) * impactForceDirection;

            const update: any = {
              [isPlayer1 ? "p2Percent" : "p1Percent"]: newOppPercent
            };

            // Calculate direct pushback coordinates
            if (isPlayer1) {
              update.p2Pos = { x: oppX + finalKnockForce, y: oppY - 4 };
            } else {
              update.p1Pos = { x: oppX + finalKnockForce, y: oppY - 4 };
            }

            onUpdateState(update);
            setArenaLog(`💥 ¡Golpe Directo! Daño infligido: +${hitDamage}% (Total: ${newOppPercent}%)`);

            activeProjs.splice(pIndex, 1); // remove
            continue;
          }
        }

        // Out of bounds bullet cleanup
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
          activeProjs.splice(pIndex, 1);
        }
      }

      // --- DRAW PLAYER 1 ---
      const p1X = isPlayer1 ? xPos.current : (gameState.p1Pos?.x || 160);
      const p1Y = isPlayer1 ? yPos.current : (gameState.p1Pos?.y || 160);
      const charP1 = CHARACTERS.find(c => c.id === p1Character) || CHARACTERS[0];

      ctx.save();
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ec4899"; // Pink bubble halo
      ctx.beginPath();
      ctx.arc(p1X, p1Y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Avatar render
      ctx.font = "20px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(charP1.avatar, p1X, p1Y);

      // Name above head
      ctx.font = "9px monospace";
      ctx.fillStyle = "#f43f5e";
      ctx.fillText(room.player1?.name || "Player 1", p1X, p1Y - 26);

      // --- DRAW PLAYER 2 ---
      const p2X = !isPlayer1 ? xPos.current : (gameState.p2Pos?.x || 340);
      const p2Y = !isPlayer1 ? yPos.current : (gameState.p2Pos?.y || 160);
      const charP2 = CHARACTERS.find(c => c.id === p2Character) || CHARACTERS[1];

      ctx.save();
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#6366f1"; // Violet blue bubble halo
      ctx.beginPath();
      ctx.arc(p2X, p2Y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = "20px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(charP2.avatar, p2X, p2Y);

      // Name above head
      ctx.font = "9px monospace";
      ctx.fillStyle = "#6366f1";
      ctx.fillText(room.player2?.name || "Player 2", p2X, p2Y - 26);

      // --- PROGRESS / STATUS PANEL BOTTOM OF ARENA CANVAS ---
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 32);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(10, canvas.height - 40, canvas.width - 20, 32);

      // Render P1 lives & damage %
      ctx.font = "11px monospace";
      ctx.fillStyle = "#f43f5e";
      ctx.textAlign = "left";
      ctx.fillText(`${charP1.avatar} P1 [${p1Percent}%] ${"❤️".repeat(p1Lives)}`, 20, canvas.height - 21);

      // Render P2 lives & damage %
      ctx.fillStyle = "#6366f1";
      ctx.textAlign = "right";
      ctx.fillText(`${"💖".repeat(p2Lives)} [${p2Percent}%] P2 ${charP2.avatar}`, canvas.width - 20, canvas.height - 21);

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [countdown, p1Character, p2Character, p1Lives, p2Lives, p1Percent, p2Percent, gameState.p1Pos, gameState.p2Pos, winner]);

  // Action methods
  const jump = () => {
    // Standard upward velocity
    const maxFloor = 205;
    if (yPos.current >= maxFloor - 5) {
      yVel.current = -12;
      doubleJumpUsed.current = false;
    } else if (!doubleJumpUsed.current) {
      // Peach Float Jump or high leap bonus
      const booster = (isPlayer1 ? p1Character : p2Character) === "peach" ? -14 : -11;
      yVel.current = booster;
      doubleJumpUsed.current = true;
      setArenaLog("✨ ¡Doble Salto Aéreo!");
    }
  };

  const moveLeft = () => {
    xVel.current = -5.5;
  };

  const moveRight = () => {
    xVel.current = 5.5;
  };

  // Shoots fireball/frying pan projectile in the direction towards the opponent
  const shootAttack = () => {
    if (winner || countdown !== null) return;

    const myChar = isPlayer1 ? p1Character : p2Character;
    const charMeta = CHARACTERS.find(c => c.id === myChar) || CHARACTERS[0];

    const oppX = isPlayer1 ? (gameState.p2Pos?.x || 340) : (gameState.p1Pos?.x || 160);
    const direction = oppX > xPos.current ? 1 : -1;

    let bulColor = "#ef4444";
    let bulSize = 6;
    let bulDamage = 10 * charMeta.damageMultiplier;
    let speed = 9;

    // Character exclusive modifiers
    if (myChar === "mario") {
      bulColor = "#f97316"; // Bright orange fireball
      bulSize = 7;
      bulDamage = 12;
    } else if (myChar === "peach") {
      bulColor = "#ec4899"; // Princess pink frying pan ring
      bulSize = 5;
      bulDamage = 10;
      speed = 11;
    } else if (myChar === "yoshi") {
      bulColor = "#22c55e"; // Green dino egg
      bulSize = 8;
      bulDamage = 13;
      speed = 8;
    } else if (myChar === "bowser") {
      bulColor = "#eab308"; // Flaming yellow dragon breath
      bulSize = 10;
      bulDamage = 18;
      speed = 6.5;
    }

    const newBullet: Projectile = {
      x: xPos.current + (direction * 22),
      y: yPos.current,
      vx: direction * speed,
      vy: -0.5, // slight arc
      ownerIsP1: isPlayer1,
      color: bulColor,
      size: bulSize,
      damage: bulDamage,
    };

    projectiles.current.push(newBullet);
    setArenaLog(`⚔️ ¡Usaste: ${charMeta.attack}!`);
  };

  const confirmCharacter = () => {
    setCharConfirmed(true);
    const update: any = {};
    if (isPlayer1) {
      update.p1Character = selectedChar;
    } else {
      update.p2Character = selectedChar;
    }
    // Setup general lives
    if (!gameState.p1Percent) {
      update.p1Percent = 0;
      update.p1Lives = 3;
    }
    if (!gameState.p2Percent) {
      update.p2Percent = 0;
      update.p2Lives = 3;
    }

    // Set fallback initial coordinates
    update.p1Pos = { x: 160, y: 160 };
    update.p2Pos = { x: 340, y: 160 };

    onUpdateState(update);
    setArenaLog("👾 ¡Personaje Listo! Esperando a que tu pareja confirme...");
  };

  const opposingJoinedChar = isPlayer1 ? p2Character : p1Character;

  // LOBBY OF CHARACTER CHOICE
  if (!charConfirmed || !gameState[isPlayer1 ? "p1Character" : "p2Character"]) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white space-y-6" id="smash-selector-lobby">
        <div className="text-center space-y-1.5">
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
            ⚔️ SMASH BROS DUO: SELECCIÓN DE LUCHADOR
          </span>
          <h3 className="text-2xl font-display font-medium text-rose-200">Elige tu Avatar</h3>
          <p className="text-xs text-slate-300">Cada personaje cuenta con disparos y multiplicadores de daño únicos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedChar(char.id)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${
                selectedChar === char.id
                  ? "bg-gradient-to-br from-violet-900/40 to-slate-950 border-violet-500 shadow-lg shadow-violet-900/10"
                  : "bg-slate-950/60 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{char.avatar}</span>
                <span className="text-xs font-bold text-violet-100">{char.name}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal"><strong className="text-rose-300">Disparo:</strong> {char.attack}</p>
              <p className="text-[10px] text-slate-400 mt-1">{char.stats}</p>
              {selectedChar === char.id && (
                <div className="absolute right-3 top-2 text-violet-400 font-mono text-[9px] uppercase font-bold">
                  ● LISTO
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl text-xs space-y-1">
          <span className="text-violet-400 font-bold block">🔎 Estadísticas Seleccionadas:</span>
          <p className="text-slate-300 leading-tight">
            {CHARACTERS.find(c => c.id === selectedChar)?.stats} Fuerza: x{CHARACTERS.find(c => c.id === selectedChar)?.damageMultiplier}
          </p>
          <div className="text-[10px] text-slate-500 pt-1.5 border-t border-white/5 mt-1">
            {opposingJoinedChar ? (
              <span className="text-emerald-400 font-mono">✅ Tu pareja listó a: {CHARACTERS.find(c => c.id === opposingJoinedChar)?.name}</span>
            ) : (
              <span className="text-amber-400 animate-pulse font-mono">⌛ Tu pareja está eligiendo luchador...</span>
            )}
          </div>
        </div>

        <button
          onClick={confirmCharacter}
          className="w-full py-3.5 bg-violet-600 hover:bg-violet-550 text-white font-display text-xs font-bold uppercase rounded-xl shadow-md transition cursor-pointer"
          id="btn-confirm-char"
        >
          💥 ¡Confirmar Luchador e Iniciar Combate!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white space-y-4" id="smash-arena-game-play">
      <div className="flex items-center gap-2 w-full justify-between pb-2 border-b border-white/5">
        <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-mono font-bold tracking-widest flex items-center gap-1.5">
          👾 SMASH DUO ARENA v1.2
        </span>
        <div className="text-xs text-violet-300 font-bold font-mono">
          Vidas: {isPlayer1 ? p1Lives : p2Lives} | Daño: {isPlayer1 ? p1Percent : p2Percent}%
        </div>
      </div>

      <div className="text-center space-y-1">
        <h4 className="text-base font-display text-rose-200">¡Saca a tu pareja de la plataforma flotante!</h4>
        <div className="p-2 bg-black/45 border border-white/5 rounded-xl text-[10.5px] font-mono text-slate-300 max-w-md mx-auto leading-none">
          📢 {arenaLog}
        </div>
      </div>

      {countdown !== null ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="text-8xl font-display font-bold text-rose-500 animate-pulse">
            {countdown === 0 ? "¡Smash!" : countdown}
          </div>
          <p className="text-xs text-slate-400 mt-4 font-mono uppercase tracking-wider">¡El daño acumulado te hará volar más lejos!</p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Main battle drawing board */}
          <div className="flex justify-center bg-slate-950 rounded-2xl p-1.5 border border-slate-800">
            <canvas
              ref={canvasRef}
              width={500}
              height={300}
              className="w-full h-auto bg-slate-950/40 rounded-xl"
            />
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[9.5px] text-slate-400 leading-normal text-center flex items-center justify-center gap-1.5">
            <Info className="w-4 h-4 text-violet-400 shrink-0" />
            <span>⚡ **Regla del Caos**: ¡A mayor porcentaje de daño, los golpes te mandarán flotando a la zona de caída con **fuerza incrementada**! double jumps redefinidos.</span>
          </div>

          {winner ? (
            <div className="text-center p-4 bg-gradient-to-br from-violet-950 to-slate-950 rounded-2xl border border-violet-500/20 space-y-2">
              <p className="text-lg font-display text-violet-300 font-bold">🎉 ¡COMBATE FINALIZADO! 🎉</p>
              <p className="text-sm">
                Ganador: <span className="font-extrabold text-white">{winner}</span>
              </p>
              <p className="text-[10px] text-slate-400">Puntaje sumado a tu rincón de pareja. Saliendo al lobby...</p>
            </div>
          ) : (
            /* Controls button zone */
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={moveLeft}
                id="smash-btn-left"
                className="py-3.5 bg-slate-800 hover:bg-slate-750 hover:shadow active:scale-95 border border-slate-700/60 rounded-xl text-center font-bold text-xs select-none cursor-pointer"
              >
                ◀ Izq
              </button>
              <button
                onClick={jump}
                id="smash-btn-jump"
                className="py-3.5 bg-slate-800 hover:bg-slate-750 hover:shadow active:scale-95 border border-slate-700/60 rounded-xl text-center font-bold text-xs select-none cursor-pointer"
              >
                ▲ Salto Duo
              </button>
              <button
                onClick={moveRight}
                id="smash-btn-right"
                className="py-3.5 bg-slate-800 hover:bg-slate-750 hover:shadow active:scale-95 border border-slate-700/60 rounded-xl text-center font-bold text-xs select-none cursor-pointer"
              >
                Der ▶
              </button>
              <button
                onClick={shootAttack}
                id="smash-btn-fire"
                className="py-3.5 bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-555 hover:to-rose-555 text-white font-display font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 text-center flex items-center justify-center gap-1 select-none cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 animate-pulse" /> DISPARO
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
