import React, { useState } from "react";
import { Room } from "../types";
import { Lock, Eye, EyeOff, ShieldCheck, Key, Copy, Check, RotateCw, Plus, Trash2, ArrowUpRight, HelpCircle } from "lucide-react";

interface GameCredential {
  id: string;
  platform: string;
  username: string;
  password?: string;
  gameUrl?: string;
  createdByName?: string;
}

interface CredentialsSafeProps {
  room: Room;
  currentPlayerName: string;
  onUpdateRoomState: (stateUpdate: any) => void;
}

export default function CredentialsSafe({
  room,
  currentPlayerName,
  onUpdateRoomState,
}: CredentialsSafeProps) {
  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null); // "user" | "pass"
  const [showForm, setShowForm] = useState(false);

  // Sync state retrieval
  const credentialsList: GameCredential[] = room.gameState?.savedCredentials || [];

  // Random Secure Password Generator
  const generateSecurePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
    let pass = "";
    // Build a secure 16 char string with couple touch
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * 26)); // lower
      pass += chars.charAt(Math.floor(Math.random() * 26) + 26); // upper
      pass += chars.charAt(Math.floor(Math.random() * 10) + 52); // numbers
      pass += chars.charAt(Math.floor(Math.random() * 9) + 62); // non-alphanumeric
    }
    // Shuffle a bit
    pass = pass.split("").sort(() => 0.5 - Math.random()).join("");
    // Prefix custom touch
    setCustomPassword(`Safe-${pass}`);
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !username) return;

    const newCred: GameCredential = {
      id: Math.random().toString(36).substr(2, 9),
      platform,
      username,
      password: customPassword || "DuoPlayPass123!",
      gameUrl: gameUrl || undefined,
      createdByName: currentPlayerName,
    };

    const updatedList = [...credentialsList, newCred];
    onUpdateRoomState({
      gameState: {
        ...(room.gameState || {}),
        savedCredentials: updatedList,
      },
    });

    // Reset Form
    setPlatform("");
    setUsername("");
    setCustomPassword("");
    setGameUrl("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updatedList = credentialsList.filter((c) => c.id !== id);
    onUpdateRoomState({
      gameState: {
        ...(room.gameState || {}),
        savedCredentials: updatedList,
      },
    });
  };

  const handleCopyText = (text: string, id: string, type: "user" | "pass") => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="p-6 glass-morphism rounded-3xl border border-rose-500/20 text-white space-y-6" id="credentials-safe">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/20 text-rose-450 rounded-2xl border border-rose-500/30 animate-pulse-heart">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-rose-200">Caja Fuerte de Cuentas Sincronizada</h3>
            <p className="text-xs text-rose-350 mt-0.5">Creación de contraseñas de alta seguridad y accesos unificados para Eve & Manu</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!customPassword) generateSecurePassword();
          }}
          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-550 hover:to-violet-550 rounded-xl text-xs font-bold uppercase transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          id="btn-add-credential-toggle"
        >
          {showForm ? "✕ Cerrar Formulario" : <><Plus className="w-4 h-4" /> Registrar Cuenta</>}
        </button>
      </div>

      {/* Origin-security notice disclaimer to explain technical guidelines */}
      <div className="p-4 bg-slate-950/70 rounded-2xl border border-rose-500/10 text-xs text-slate-350 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200 text-xs block mb-1">ℹ️ Nota de Seguridad de Conexión</span>
          Por políticas de origen cruzado de los navegadores (<span className="text-rose-400 font-mono">Same-Origin Policy</span>), las apps web independientes no pueden realizar inicios de sesión automáticos ni auto-escribir datos en formularios ajenos. 
          Por ello, guardamos sus contraseñas unificadas aquí de forma sincronizada: <strong>ambos pueden consultarlas, copiarlas con un solo toque y abrir el juego de inmediato.</strong> ¡Práctico, seguro y privado!
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddCredential} className="p-5 bg-black/45 border border-white/10 rounded-2xl space-y-4 animate-fade-in relative z-10">
          <div className="text-sm font-semibold text-rose-300 pb-2 border-b border-white/5">
            🔑 Agregar Credencial Compartida
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Plataforma / Juego o Sitio Web *</label>
              <input
                type="text"
                required
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Ej. Gartic Phone, Lichess, Plato, Nintendo"
                className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs outline-none focus:border-rose-500 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Correo Electrónico / Nombre de Usuario *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. manu_y_eve_duo@gmail.com"
                className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs outline-none focus:border-rose-500 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Contraseña Segura Recomendada *</span>
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono hover:underline text-[9px]"
                >
                  <RotateCw className="w-2.5 h-2.5" /> Regenerar
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Se generará contraseña fuerte"
                  className="w-full bg-slate-950 border border-white/10 p-2.5 pr-10 rounded-xl text-xs font-mono outline-none focus:border-rose-500 text-slate-100"
                />
                <div className="absolute right-3 top-2.5 text-slate-400">
                  <Key className="w-3.5 h-3.5 text-rose-450 animate-pulse" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">URL Oficial de Juego (Opcional)</label>
              <input
                type="url"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                placeholder="Ej. https://garticphone.com"
                className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs outline-none focus:border-rose-500 text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider"
            >
              💾 Guardar en Cofre
            </button>
          </div>
        </form>
      )}

      {/* Saved Credentials Table/Grid */}
      {credentialsList.length === 0 ? (
        <div className="p-8 text-center bg-black/25 rounded-2xl border border-white/5 space-y-2">
          <Key className="w-8 h-8 mx-auto text-rose-400/40" />
          <p className="text-xs text-slate-400">Aún no hay credenciales de juego compartidas.</p>
          <p className="text-[10px] text-slate-500">¿Qué tal si crean una cuenta para jugar Lichess o Plato juntos?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentialsList.map((cred) => {
            const showPass = !!showPasswordMap[cred.id];
            const isLatestCopyUser = copiedId === cred.id && copiedType === "user";
            const isLatestCopyPass = copiedId === cred.id && copiedType === "pass";

            return (
              <div
                key={cred.id}
                className="p-4 bg-slate-950/65 rounded-2xl border border-white/10 hover:border-rose-500/25 transition relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/20 text-xs">🎮</span>
                      <strong className="text-xs uppercase font-display text-rose-100 tracking-wide">{cred.platform}</strong>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition"
                      title="Eliminar del cofre"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* User field */}
                    <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-xl">
                      <div className="overflow-hidden mr-2">
                        <span className="text-[9px] text-slate-500 uppercase block font-mono">Usuario / Correo</span>
                        <span className="font-mono text-slate-200 block truncate">{cred.username}</span>
                      </div>
                      <button
                        onClick={() => handleCopyText(cred.username, cred.id, "user")}
                        className="px-2 py-1 bg-white/5 hover:bg-white/12 border border-white/10 rounded-lg flex items-center gap-1 transition text-[10px] font-mono hover:text-rose-300"
                        title="Copiar usuario"
                      >
                        {isLatestCopyUser ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        {isLatestCopyUser ? "Copiado" : "Copiar"}
                      </button>
                    </div>

                    {/* Pass field */}
                    <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-xl">
                      <div className="overflow-hidden mr-2">
                        <span className="text-[9px] text-slate-500 uppercase block font-mono">Contraseña</span>
                        <input
                          type={showPass ? "text" : "password"}
                          readOnly
                          value={cred.password || ""}
                          className="bg-transparent text-xs font-mono text-rose-300 outline-none w-full border-none pointer-events-none select-none"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(cred.id)}
                          className="p-1.5 bg-white/5 hover:bg-white/12 border border-white/10 rounded-lg text-slate-400"
                          title={showPass ? "Ocultar" : "Mostrar"}
                        >
                          {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleCopyText(cred.password || "", cred.id, "pass")}
                          className="px-2 py-1 bg-white/5 hover:bg-white/12 border border-white/10 rounded-lg flex items-center gap-1 transition text-[10px] font-mono hover:text-rose-300"
                          title="Copiar contraseña"
                        >
                          {isLatestCopyPass ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                          {isLatestCopyPass ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">Guardado por {cred.createdByName || "Novio"}</span>
                  {cred.gameUrl && (
                    <a
                      href={cred.gameUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      Abrir Web <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
