import React, { useState, useEffect } from "react";
import { Room, Player } from "../../types";
import { Flag, Zap, Snowflake, HelpCircle, Shield, Sparkles, Flame, Eye, Skull } from "lucide-react";

interface RacerGameProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

const KARTS = [
  { id: "flame", name: "🔥 Flame Rider (Speed Boost +)", icon: "🏎️", description: "Los hongos de nitro son +25% potentes." },
  { id: "peach", name: "🌸 Peach Heart (Defensa +)", icon: "🚗", description: "Es inmune al primer plátano de la pista." },
  { id: "yoshi", name: "🦖 Yoshi Swift (Tap Rápido +)", icon: "🏍️", description: "Cada click normal otorga 3.5% de avance en lugar de 3%." },
  { id: "bowser", name: "🚜 Bowser Monster (Peso +)", icon: "🚜", description: "Al usar caparazones, le quitas un 5% de progreso al rival." },
];

const ITEMS = [
  { id: "red_shell", name: "🔴 Caparazón Rojo", icon: "🐢", soundPhrase: "¡Lanzaste un caparazón teledirigido!", actionText: "Congela y hace retroceder al oponente" },
  { id: "banana", name: "🍌 Plátano Resbaloso", icon: "🍌", soundPhrase: "¡Dejaste un plátano en el asfalto!", actionText: "Pone una trampa que hace resbalar 10% al tocarla" },
  { id: "star", name: "🌟 Estrella Arcoíris", icon: "🌟", soundPhrase: "¡Poder estelar activo!", actionText: "Inmunidad y aumento masivo instantáneo" },
  { id: "mushroom", name: "🍄 Súper Hongo", icon: "🍄", soundPhrase: "¡Champiñón activado!", actionText: "Da un gran subidón de velocidad" },
  { id: "lightning", name: "⚡ Rayo Reductor", icon: "⚡", soundPhrase: "¡Rayos y centellas!", actionText: "Encoge al rival, reduciendo su tapping a la mitad" },
];

export default function RacerGame({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: RacerGameProps) {
  const [countdown, setCountdown] = useState<number | null>(3);
  const finishLine = 100;

  const gameState = room.gameState || {};
  const p1Progress = gameState.p1Progress || 0;
  const p2Progress = gameState.p2Progress || 0;
  const p1Freeze = gameState.p1Freeze || 0; // timestamp
  const p2Freeze = gameState.p2Freeze || 0; // timestamp
  const p1Debuff = gameState.p1Debuff || ""; // "shrunk" | ""
  const p2Debuff = gameState.p2Debuff || ""; // "shrunk" | ""
  const p1Kart = gameState.p1Kart || "flame";
  const p2Kart = gameState.p2Kart || "flame";
  const p1Shield = gameState.p1Shield || false;
  const p2Shield = gameState.p2Shield || false;
  const p1Inventory = gameState.p1Inventory || ""; // Rolled itemId
  const p2Inventory = gameState.p2Inventory || ""; // Rolled itemId
  
  // Banana traps
  const bananaTraps = gameState.bananaTraps || []; // list of { position: number, placedBy: "p1" | "p2" }

  const winner = gameState.winner || null;

  // Local selectors
  const [selectedKart, setSelectedKart] = useState<string>("flame");
  const [kartConfirmed, setKartConfirmed] = useState<boolean>(false);
  const [rollingItem, setRollingItem] = useState<boolean>(false);
  const [gameLog, setGameLog] = useState<string>("¡Elige tu kart y prepárate para correr!");

  const activeFreeze = isPlayer1 ? p1Freeze > Date.now() : p2Freeze > Date.now();
  const otherFreeze = isPlayer1 ? p2Freeze > Date.now() : p1Freeze > Date.now();
  
  const activeDebuff = isPlayer1 ? p1Debuff : p2Debuff;
  const currentKartId = isPlayer1 ? p1Kart : p2Kart;
  const currentKart = KARTS.find(k => k.id === currentKartId) || KARTS[0];

  const myInventory = isPlayer1 ? p1Inventory : p2Inventory;
  const myShield = isPlayer1 ? p1Shield : p2Shield;

  // Handle speed countdown when both karts are configured
  useEffect(() => {
    if (gameState.p1Kart && gameState.p2Kart) {
      if (countdown === null) return;
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCountdown(null);
      }
    }
  }, [countdown, gameState.p1Kart, gameState.p2Kart]);

  // Handle auto-rolling items periodically during the race based on progress points (e.g. crossing 25%, 50%, 75%)
  const lastRolledMilestone = React.useRef<number>(0);
  const myProgress = isPlayer1 ? p1Progress : p2Progress;

  useEffect(() => {
    if (countdown !== null || winner) return;
    
    const milestone = Math.floor(myProgress / 20);
    if (milestone > lastRolledMilestone.current && milestone <= 4 && !myInventory) {
      lastRolledMilestone.current = milestone;
      rollRandomItem();
    }
  }, [myProgress, countdown, winner, myInventory]);

  // Handle self banana trap collision check in game-loop simulation
  useEffect(() => {
    if (countdown !== null || winner) return;
    const currentProgress = isPlayer1 ? p1Progress : p2Progress;
    
    // Check if player landed on a banana trap
    const hitTrap = bananaTraps.find((trap: any) => 
      Math.abs(trap.position - currentProgress) < 4 && 
      ((isPlayer1 && trap.placedBy !== "p1") || (!isPlayer1 && trap.placedBy !== "p2"))
    );

    if (hitTrap) {
      // Remove that banana trap
      const filteredTraps = bananaTraps.filter((t: any) => t !== hitTrap);
      
      const update: any = { bananaTraps: filteredTraps };
      
      // If we have Peach Kart, we can avoid the first banana!
      const myKartId = isPlayer1 ? p1Kart : p2Kart;
      if (myKartId === "peach") {
        setGameLog("🛡️ ¡Pistola de Peach! Esquivaste el plátano automáticamente.");
      } else if (isPlayer1 && p1Shield) {
        update.p1Shield = false;
        setGameLog("🛡️ ¡Escudo estelar bloqueó el plátano!");
      } else if (!isPlayer1 && p2Shield) {
        update.p2Shield = false;
        setGameLog("🛡️ ¡Escudo estelar bloqueó el plátano!");
      } else {
        // Punish
        const currentProgVal = isPlayer1 ? p1Progress : p2Progress;
        const nextProg = Math.max(0, currentProgVal - 10);
        
        if (isPlayer1) {
          update.p1Progress = nextProg;
          update.p1Freeze = Date.now() + 1500; // spin out
        } else {
          update.p2Progress = nextProg;
          update.p2Freeze = Date.now() + 1500; // spin out
        }
        setGameLog("🍌 ¡Sliiiip! Resbalaste en un plátano y perdiste 10% de avance.");
      }
      onUpdateState(update);
    }
  }, [p1Progress, p2Progress, bananaTraps, countdown, winner]);

  // Roll item
  const rollRandomItem = () => {
    setRollingItem(true);
    let counter = 0;
    const interval = setInterval(() => {
      // visual shuffle effects
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        
        const update: any = {};
        if (isPlayer1) {
          update.p1Inventory = randomItem.id;
        } else {
          update.p2Inventory = randomItem.id;
        }
        onUpdateState(update);
        setRollingItem(false);
        setGameLog(`🎁 ¡Súper Caja de sorpresa! Recibiste: [${randomItem.icon} ${randomItem.name}]`);
      }
    }, 150);
  };

  const confirmKartSelection = () => {
    setKartConfirmed(true);
    const update: any = {};
    if (isPlayer1) {
      update.p1Kart = selectedKart;
    } else {
      update.p2Kart = selectedKart;
    }
    // Set baseline state if first player joins
    if (!gameState.p1Progress) update.p1Progress = 0;
    if (!gameState.p2Progress) update.p2Progress = 0;
    onUpdateState(update);
    setGameLog("🚗 ¡Kart confirmado! Esperando a que tu pareja elija el suyo...");
  };

  // Perform normal tab speed boost
  const handleKeyTap = () => {
    if (countdown !== null || winner || activeFreeze) return;

    // Custom kart bonuses
    const myKartId = isPlayer1 ? p1Kart : p2Kart;
    const defaultIncrement = myKartId === "yoshi" ? 3.5 : 3.0;
    const isShrunk = activeDebuff === "shrunk";
    const increment = isShrunk ? (defaultIncrement / 2.0) : defaultIncrement;

    const currentProgress = isPlayer1 ? p1Progress : p2Progress;
    const nextProgress = Math.min(finishLine, currentProgress + increment);

    const update: any = {};
    if (isPlayer1) {
      update.p1Progress = nextProgress;
    } else {
      update.p2Progress = nextProgress;
    }

    // Check for victory
    if (nextProgress >= finishLine && !winner) {
      update.winner = currentPlayer.name;
      onUpdateState(update);
      onFinishGame(currentPlayer.name, 50);
    } else {
      onUpdateState(update);
    }
  };

  // Execute rolled item box weapon!
  const useItemWeapon = () => {
    if (!myInventory || winner || countdown !== null) return;
    
    const update: any = {
      [isPlayer1 ? "p1Inventory" : "p2Inventory"]: "" // deplete item
    };
    
    const opponentProgress = isPlayer1 ? p2Progress : p1Progress;
    const myProgressVal = isPlayer1 ? p1Progress : p2Progress;
    const myKartId = isPlayer1 ? p1Kart : p2Kart;
    
    switch (myInventory) {
      case "red_shell":
        // Bowser weight bonus check
        const damageVal = myKartId === "bowser" ? 6 : 0;
        
        // Attack opponent
        if (isPlayer1) {
          if (p2Shield) {
            update.p2Shield = false;
            setGameLog("🐢 ¡Tu pareja bloqueó el caparazón con su Escudo Estelar!");
          } else {
            update.p2Freeze = Date.now() + 2500;
            if (damageVal > 0) update.p2Progress = Math.max(0, p2Progress - damageVal);
            setGameLog("🐢 ¡Lanzaste un Caparazón Rojo! Tu pareja ha sido congelada por 2.5s.");
          }
        } else {
          if (p1Shield) {
            update.p1Shield = false;
            setGameLog("🐢 ¡Tu pareja bloqueó el caparazón con su Escudo Estelar!");
          } else {
            update.p1Freeze = Date.now() + 2500;
            if (damageVal > 0) update.p1Progress = Math.max(0, p1Progress - damageVal);
            setGameLog("🐢 ¡Lanzaste un Caparazón Rojo! Tu pareja ha sido congelada por 2.5s.");
          }
        }
        break;

      case "banana":
        // Drop a banana skin at player's current progress track coordinate
        const newBanana = {
          position: Math.round(myProgressVal - 4),
          placedBy: isPlayer1 ? "p1" : "p2"
        };
        update.bananaTraps = [...bananaTraps, newBanana];
        setGameLog("🍌 Pusiste una cáscara de plátano en el carril.");
        break;

      case "star":
        // Gives self massive speed boost + Shield active
        const starBoost = 15;
        const starTarget = Math.min(finishLine, myProgressVal + starBoost);
        
        if (isPlayer1) {
          update.p1Progress = starTarget;
          update.p1Shield = true;
          // Clear existing debuffs
          update.p1Debuff = "";
        } else {
          update.p2Progress = starTarget;
          update.p2Shield = true;
          // Clear existing debuffs
          update.p2Debuff = "";
        }
        
        setGameLog("⭐ ¡Modo ESTRELLA activo! Ganas inmunidad temporal y avanzas +15%.");
        if (starTarget >= finishLine && !winner) {
          update.winner = currentPlayer.name;
          onUpdateState(update);
          onFinishGame(currentPlayer.name, 50);
          return;
        }
        break;

      case "mushroom":
        // Speed boost
        const boostMultiplier = myKartId === "flame" ? 18 : 12;
        const mushTarget = Math.min(finishLine, myProgressVal + boostMultiplier);
        
        if (isPlayer1) {
          update.p1Progress = mushTarget;
        } else {
          update.p2Progress = mushTarget;
        }
        
        setGameLog(`🍄 ¡Usaste Champiñón! Súper acelerón de +${boostMultiplier}% de avance.`);
        if (mushTarget >= finishLine && !winner) {
          update.winner = currentPlayer.name;
          onUpdateState(update);
          onFinishGame(currentPlayer.name, 50);
          return;
        }
        break;

      case "lightning":
        // Shrink opponent reducing their taps
        if (isPlayer1) {
          if (p2Shield) {
            update.p2Shield = false;
            setGameLog("⚡ ¡Tu rayo rugió pero rebotó contra el escudo estelar!");
          } else {
            update.p2Debuff = "shrunk";
            setGameLog("⚡ ¡Rayo relámpago impactado! Tu pareja se redujo a tamaño miniatura.");
          }
        } else {
          if (p1Shield) {
            update.p1Shield = false;
            setGameLog("⚡ ¡Tu rayo rugió pero rebotó contra el escudo estelar!");
          } else {
            update.p1Debuff = "shrunk";
            setGameLog("⚡ ¡Rayo relámpago impactado! Tu pareja se redujo a tamaño miniatura.");
          }
        }
        
        // Remove shrink debuff automatically after 4 seconds
        setTimeout(() => {
          onUpdateState({
            [isPlayer1 ? "p2Debuff" : "p1Debuff"]: ""
          });
        }, 4000);
        break;
        
      default:
        break;
    }
    
    onUpdateState(update);
  };

  // Skip and select kart first layout
  const opposingKartJoinedId = isPlayer1 ? p2Kart : p1Kart;
  const opposingKartJoined = opposingKartJoinedId ? KARTS.find(k => k.id === opposingKartJoinedId) : null;

  if (!kartConfirmed || !gameState[isPlayer1 ? "p1Kart" : "p2Kart"]) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white space-y-6" id="racer-lobby-custom">
        <div className="text-center space-y-1.5">
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold">
            🏎️ SELECCIÓN DE KART: DUO KART CHAMPIONSHIP
          </span>
          <h3 className="text-2xl font-display font-medium text-rose-200">Elige tu Vehículo</h3>
          <p className="text-xs text-slate-300">Cada vehículo posee habilidades exclusivas. ¡Elijan sabiamente!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {KARTS.map((kt) => (
            <button
              key={kt.id}
              onClick={() => setSelectedKart(kt.id)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${
                selectedKart === kt.id
                  ? "bg-gradient-to-br from-rose-900/40 to-slate-950 border-rose-500 shadow-lg shadow-rose-900/10"
                  : "bg-slate-950/60 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{kt.icon}</span>
                <span className="text-xs font-bold text-rose-100">{kt.name.split(" (")[0]}</span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">{kt.description}</p>
              
              {selectedKart === kt.id && (
                <div className="absolute right-3 bottom-2 text-rose-500 font-mono text-[9px] uppercase font-bold tracking-widest">
                  ★ Seleccionado
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Display selected kart bonuses */}
        <div className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl text-xs space-y-2">
          <div className="font-bold text-rose-300">🔎 Bono Activo Especial:</div>
          <p className="text-slate-300">
            {KARTS.find(k => k.id === selectedKart)?.description}
          </p>
          <div className="text-[10px] text-slate-500">
            {opposingKartJoined ? (
              <span className="text-emerald-400 font-mono">✅ Tu pareja ya eligió su Kart: {opposingKartJoined.name}</span>
            ) : (
              <span className="text-amber-400 animate-pulse font-mono">⌛ Tu pareja está eligiendo su Kart...</span>
            )}
          </div>
        </div>

        <button
          onClick={confirmKartSelection}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-550 text-white font-display text-xs font-bold uppercase rounded-xl shadow-md transition cursor-pointer"
          id="btn-confirm-kart"
        >
          🎮 ¡Confirmar mi Kart e Ir a la Pista! ➔
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white space-y-5" id="racer-game-mario-kart">
      <div className="flex items-center gap-2 w-full justify-between pb-2 border-b border-white/5">
        <span className="px-3 py-1 bg-rose-500/20 text-rose-450 rounded-full text-xs font-mono font-bold tracking-widest flex items-center gap-1.5">
          🏁 DUO KART STAGE (VALLEY OF COGNITION)
        </span>
        <div className="text-xs text-rose-300 font-bold font-mono">
          {isPlayer1 ? "P1" : "P2"} Lane | {currentKart.icon}
        </div>
      </div>

      <div className="w-full text-center">
        <h4 className="text-lg font-display text-rose-100 flex items-center justify-center gap-1.5">
          <span>{currentKart.icon}</span>
          Carreras Locas: Copa Champiñón
        </h4>
        <div className="p-2 bg-black/45 border border-white/5 rounded-xl text-[10.5px] font-mono text-slate-300 max-w-md mx-auto mt-2 leading-tight">
          📢 {gameLog}
        </div>
      </div>

      {countdown !== null ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="text-8xl font-display font-bold text-rose-500 animate-bounce tracking-widest">
            {countdown === 0 ? "🏁 ¡YA!" : countdown}
          </div>
          <p className="text-xs text-slate-400 mt-4 font-mono uppercase tracking-wider">¡Acelera a tope apenas sople el viento!</p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {/* TRACK 1 (Player 1) */}
          <div className="relative bg-slate-950/80 p-3 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
              <span className="font-semibold flex items-center gap-1">
                {room.player1?.avatar} {room.player1?.name} {isPlayer1 && "(Tú)"} 
                <span className="text-[10px] text-slate-500 font-mono ml-1">[{KARTS.find(v => v.id === p1Kart)?.icon}]</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-rose-400">
                {p1Shield && <span className="text-rose-450 text-[10px] animate-pulse">🌟 Escudo</span>}
                {p1Debuff === "shrunk" && <span className="text-yellow-400 text-[10px] shrink-0 animate-bounce">⚡ Enano</span>}
                {Math.round(p1Progress)}%
              </span>
            </div>
            
            {/* Track lane */}
            <div className="relative h-14 bg-slate-900/60 rounded-lg flex items-center px-4 border-dashed border-y border-slate-800">
              {/* Start Line */}
              <div className="absolute left-10 top-0 bottom-0 border-l border-slate-700 border-dashed"></div>
              
              {/* Finish Line Indicator */}
              <div className="absolute right-12 top-0 bottom-0 flex items-center text-emerald-500/20">
                <Flag className="w-6 h-6 animate-pulse" />
              </div>

              {/* Render banana traps on trail */}
              {bananaTraps.map((bt: any, idx: number) => (
                <div
                  key={idx}
                  className="absolute text-sm animate-pulse z-20"
                  style={{ left: `calc(10% + (${bt.position} * 0.75))` }}
                >
                  🍌
                </div>
              ))}
              
              {/* Runner */}
              <div
                className="absolute transition-all duration-200 ease-out flex items-center z-10"
                style={{ left: `calc(10% + (${p1Progress} * 0.75))` }}
              >
                <div className="relative flex flex-col items-center">
                  {p1Freeze > Date.now() && (
                    <span className="absolute -top-7 bg-cyan-500 border border-white/20 text-white text-[9px] px-2 py-0.5 rounded-full animate-bounce">
                      🥶 Spin Out!
                    </span>
                  )}
                  <div className={`text-3xl filter transition-transform ${p1Debuff === "shrunk" ? "scale-50 opacity-80" : ""} drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]`}>
                    {KARTS.find(k => k.id === p1Kart)?.icon || "🏎️"}{room.player1?.avatar}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TRACK 2 (Player 2) */}
          <div className="relative bg-slate-950/80 p-3 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
              <span className="font-semibold flex items-center gap-1">
                {room.player2?.avatar} {room.player2?.name} {!isPlayer1 && "(Tú)"}
                <span className="text-[10px] text-slate-500 font-mono ml-1">[{KARTS.find(v => v.id === p2Kart)?.icon}]</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-rose-450">
                {p2Shield && <span className="text-rose-400 text-[10px] animate-pulse">🌟 Escudo</span>}
                {p2Debuff === "shrunk" && <span className="text-yellow-400 text-[10px] shrink-0 animate-bounce">⚡ Enano</span>}
                {Math.round(p2Progress)}%
              </span>
            </div>
            
            {/* Track lane */}
            <div className="relative h-14 bg-slate-900/60 rounded-lg flex items-center px-4 border-dashed border-y border-slate-800">
              {/* Start Line */}
              <div className="absolute left-10 top-0 bottom-0 border-l border-slate-700 border-dashed"></div>
              
              {/* Finish Line Indicator */}
              <div className="absolute right-12 top-0 bottom-0 flex items-center text-emerald-500/20">
                <Flag className="w-6 h-6 animate-pulse" />
              </div>

              {/* Render banana traps on trail */}
              {bananaTraps.map((bt: any, idx: number) => (
                <div
                  key={idx}
                  className="absolute text-sm animate-pulse z-20"
                  style={{ left: `calc(10% + (${bt.position} * 0.75))` }}
                >
                  🍌
                </div>
              ))}

              {/* Runner */}
              <div
                className="absolute transition-all duration-200 ease-out flex items-center z-10"
                style={{ left: `calc(10% + (${p2Progress} * 0.75))` }}
              >
                <div className="relative flex flex-col items-center">
                  {p2Freeze > Date.now() && (
                    <span className="absolute -top-7 bg-cyan-500 border border-white/20 text-white text-[9px] px-2 py-0.5 rounded-full animate-bounce">
                      🥶 Spin Out!
                    </span>
                  )}
                  <div className={`text-3xl filter transition-transform ${p2Debuff === "shrunk" ? "scale-50 opacity-80" : ""} drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]`}>
                    {KARTS.find(k => k.id === p2Kart)?.icon || "🏎️"}{room.player2?.avatar || "💖"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {winner ? (
            <div className="text-center p-5 bg-gradient-to-br from-rose-950 to-slate-950 rounded-2xl border border-rose-500/20 space-y-2">
              <p className="text-xl font-display text-rose-400 font-bold flex items-center justify-center gap-2">
                🏆 ¡LAUREL DE VICTORIA! 🏆
              </p>
              <p className="text-sm">
                Ganador: <span className="font-extrabold text-rose-100">{winner}</span>
              </p>
              <p className="text-[10px] text-slate-400">Puntajes sincronizados. Volviendo al rincón de juego en segundos...</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="flex gap-3">
                {/* Main accelerator button */}
                <button
                  onClick={handleKeyTap}
                  disabled={activeFreeze}
                  id="racer-speed-button"
                  className={`flex-1 py-8 text-xl font-display font-extrabold uppercase tracking-widest rounded-2xl border shadow-xl transform active:scale-95 transition-all duration-150 relative overflow-hidden group cursor-pointer ${
                    activeFreeze
                      ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-rose-600 to-rose-500 text-white border-rose-450 hover:shadow-rose-500/25"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {activeFreeze ? "🥶 DESLIZANDO..." : <>🚀 ACELERAR (TAP)</>}
                  </span>
                  
                  {activeDebuff === "shrunk" && !activeFreeze && (
                    <span className="absolute bottom-1 right-2 text-[9px] text-yellow-300 font-mono">⚡ ¡REDUCIDO!</span>
                  )}
                </button>

                {/* Rolled Weapon Item Slots */}
                <div className="w-32 bg-slate-950 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                  <div className="text-[8px] text-slate-400 font-mono uppercase tracking-widest mb-1 font-bold">ITEM ROLLED</div>
                  {rollingItem ? (
                    <div className="text-xl animate-spin">📦</div>
                  ) : myInventory ? (
                    <button
                      onClick={useItemWeapon}
                      className="w-full h-full flex flex-col items-center justify-center bg-rose-600/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition cursor-pointer active:scale-95 p-1 text-center"
                      id="btn-use-item-racer"
                    >
                      <span className="text-3xl animate-bounce filter drop-shadow">
                        {ITEMS.find(item => item.id === myInventory)?.icon}
                      </span>
                      <span className="text-[9px] text-rose-300 font-bold block leading-tight truncate w-full">
                        {ITEMS.find(item => item.id === myInventory)?.name.split(" ")[1]}
                      </span>
                      <span className="text-[8px] text-slate-400 block font-mono">UTILIZAR ➔</span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 opacity-35">
                      <span className="text-xl">📦</span>
                      <span className="text-[8px] text-slate-500">Vacío</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Powerups instruction details */}
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] text-slate-400 leading-relaxed text-center">
                ✨ **Pista de Carreras**: ¡Recibes una **Caja de Items Sorpresa** aleatoria automáticamente cada vez que avanzas un 20% del trayecto! ¡Lanza plátanos, usa rayos o vuélvete estelar!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
