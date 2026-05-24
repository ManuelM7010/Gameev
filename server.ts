import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable JSON body parsing
app.use(express.json());

// Initialize Gemini Client safely with lazy check
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return aiClient;
}

// In-memory persistent states for Rooms and Active Stream Listeners
interface Player {
  uid: string;
  name: string;
  avatar: string;
  score: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface Room {
  roomId: string;
  status: "waiting" | "playing" | "finished";
  mood: "romantic" | "spicy" | "funny" | "intellectual";
  player1: Player | null;
  player2: Player | null;
  gameType: string;
  gameState: any;
  chat: ChatMessage[];
  updatedAt: number;
}

const rooms: Record<string, Room> = {};
const listeners: Record<string, Array<{ uid: string; res: any }>> = {};

// Helper to broadcast room updates to all connected SSE clients safely
function broadcast(roomId: string) {
  const rId = roomId.toUpperCase();
  const room = rooms[rId];
  if (!room) return;
  const roomListeners = listeners[rId] || [];
  const payload = `data: ${JSON.stringify(room)}\n\n`;
  
  const activeListeners: Array<{ uid: string; res: any }> = [];
  
  roomListeners.forEach((listener) => {
    try {
      listener.res.write(payload);
      activeListeners.push(listener);
    } catch (err) {
      console.warn(`Pruning connection for uid ${listener.uid} in room ${rId} due to closed stream:`, err);
      try {
        listener.res.end();
      } catch (_) {}
    }
  });
  
  listeners[rId] = activeListeners;
}

// Cleanup room helper (periodic intervals could sweep or we check on active joins)
function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Global leaderboard
const rankings: Array<{ coupleId: string; names: string; score: number; gamesPlayed: number; date: string }> = [
  { coupleId: "R1-R2", names: "Sofi & Mateo", score: 480, gamesPlayed: 14, date: "2026-05-24" },
  { coupleId: "R3-R4", names: "Valen & Lucas", score: 420, gamesPlayed: 11, date: "2026-05-24" },
  { coupleId: "R5-R6", names: "Camila & Juani", score: 380, gamesPlayed: 9, date: "2026-05-24" }
];

// --- API ENDPOINTS ---

// Leaderboard list
app.get("/api/rankings", (req, res) => {
  res.json(rankings.sort((a, b) => b.score - a.score));
});

// Update couple ranking score
app.post("/api/rankings/update", (req, res) => {
  const { names, points } = req.body;
  if (!names) {
    return res.status(400).json({ error: "Names required" });
  }
  const existing = rankings.find((r) => r.names.toLowerCase() === names.toLowerCase());
  if (existing) {
    existing.score += points || 10;
    existing.gamesPlayed += 1;
    existing.date = new Date().toISOString().split("T")[0];
  } else {
    rankings.push({
      coupleId: `couple-${Date.now()}`,
      names,
      score: points || 10,
      gamesPlayed: 1,
      date: new Date().toISOString().split("T")[0]
    });
  }
  res.json({ success: true, rankings });
});

// Create Room
app.post("/api/rooms/create", (req, res) => {
  const { player, mood } = req.body;
  if (!player || !player.uid) {
    return res.status(400).json({ error: "Host player registration is required." });
  }

  const roomId = generateRoomId();
  const newRoom: Room = {
    roomId,
    status: "waiting",
    mood: mood || "romantic",
    player1: {
      uid: player.uid,
      name: player.name || "Invitado",
      avatar: player.avatar || "❤️",
      score: 0,
    },
    player2: null,
    gameType: "lobby",
    gameState: {},
    chat: [],
    updatedAt: Date.now(),
  };

  rooms[roomId] = newRoom;
  res.json(newRoom);
});

// Join Room
app.post("/api/rooms/join", (req, res) => {
  const { roomId, player } = req.body;
  if (!roomId || !player || !player.uid) {
    return res.status(400).json({ error: "Código de sala y datos del jugador son requeridos." });
  }

  const targetId = roomId.toUpperCase();
  const room = rooms[targetId];
  if (!room) {
    return res.status(404).json({ error: "¡Sala no encontrada! Revisa el código." });
  }

  if (room.player1 && room.player1.uid === player.uid) {
    // Host re-joining
    return res.json(room);
  }

  if (room.player2 && room.player2.uid !== player.uid) {
    return res.status(400).json({ error: "Esta sala ya está completa." });
  }

  room.player2 = {
    uid: player.uid,
    name: player.name || "Pareja",
    avatar: player.avatar || "💖",
    score: 0,
  };
  room.status = "playing";
  room.updatedAt = Date.now();

  broadcast(targetId);
  res.json(room);
});

// Sync Room Actions & Games States
app.post("/api/rooms/updateState", (req, res) => {
  const { roomId, gameType, gameState, player1Score, player2Score, mood, status } = req.body;
  const targetId = roomId?.toUpperCase();
  const room = rooms[targetId];

  if (!room) {
    return res.status(404).json({ error: "Sala no encontrada." });
  }

  if (gameType !== undefined) room.gameType = gameType;
  if (gameState !== undefined) {
    if (req.body.overwriteState || gameType !== undefined) {
      room.gameState = gameState;
    } else {
      room.gameState = { ...room.gameState, ...gameState };
    }
  }
  if (mood !== undefined) room.mood = mood;
  if (status !== undefined) room.status = status;

  if (player1Score !== undefined && room.player1) room.player1.score = player1Score;
  if (player2Score !== undefined && room.player2) room.player2.score = player2Score;

  room.updatedAt = Date.now();
  broadcast(targetId);
  res.json(room);
});

// Live Chat Sending
app.post("/api/rooms/chat", (req, res) => {
  const { roomId, senderId, senderName, text } = req.body;
  const targetId = roomId?.toUpperCase();
  const room = rooms[targetId];

  if (!room) {
    return res.status(404).json({ error: "Sala no encontrada." });
  }

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    senderId,
    senderName,
    text,
    timestamp: Date.now(),
  };

  room.chat.push(newMessage);
  // Keep last 50 chat messages
  if (room.chat.length > 50) {
    room.chat.shift();
  }

  room.updatedAt = Date.now();
  broadcast(targetId);
  res.json({ success: true });
});

// SSE Stream Setup for immediate push triggers
app.get("/api/rooms/stream/:roomId", (req, res) => {
  const roomId = req.params.roomId.toUpperCase();
  const uid = req.query.uid as string;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  // Send initial hook
  const room = rooms[roomId];
  if (room) {
    res.write(`data: ${JSON.stringify(room)}\n\n`);
  } else {
    res.write(`data: null\n\n`);
  }

  if (!listeners[roomId]) {
    listeners[roomId] = [];
  }

  listeners[roomId].push({ uid, res });

  // Heartbeat interval to maintain active stream and protect socket degradation
  const intervalId = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(intervalId);
    if (listeners[roomId]) {
      listeners[roomId] = listeners[roomId].filter((item) => item.res !== res);
      if (listeners[roomId].length === 0) {
        delete listeners[roomId];
      }
    }
  });
});

// AI Evaluate Guess (Semantic approximation for drawing guessing)
app.post("/api/ai/evaluate-guess", async (req, res) => {
  const { targetWord, guessWord } = req.body;
  if (!targetWord || !guessWord) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  if (targetWord.toLowerCase().trim() === guessWord.toLowerCase().trim()) {
    return res.json({ correct: true, score: 100, message: "¡Totalmente correcto!" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Offline AI simulation fallback if no network / keys are loaded
    const ratio = Math.random() > 0.5 ? 40 : 20;
    return res.json({ correct: false, score: ratio, message: "Intento registrado." });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Compara la palabra secreta "${targetWord}" con la palabra propuesta por el jugador "${guessWord}".
      Evalúa la cercanía semántica e indica en un JSON si son similares, sinónimos, o la distancia.
      Responde estrictamente en formato JSON utilizando las siguientes propiedades:
      {
        "correct": boolean (true si se refieren a exactamente lo mismo o es un sinónimo muy claro),
        "score": number (de 0 a 100 indicando la cercanía o proximidad semántica),
        "message": "Mensaje gracioso o inspirador en español para la pareja indicando cuánto se acercó"
      }`
    });

    const outputText = response.text || "{}";
    const cleanedText = outputText.replace(/```json|```/gi, "").trim();
    const result = JSON.parse(cleanedText);
    res.json(result);
  } catch (err) {
    console.error("Gemini Drawing evaluation error:", err);
    res.json({ correct: false, score: 15, message: "¡Una respuesta interesante! Intenten de nuevo." });
  }
});

// Generate mood-specific tailored questions for Couple Modes (Romantic, Spicy, Chaos)
app.post("/api/ai/get-challenges", async (req, res) => {
  const { mood, player1Name, player2Name } = req.body;
  const ai = getGeminiClient();

  const mockChallenges: Record<string, string[]> = {
    romantic: [
      `¿Cuál fue el primer pensamiento de ${player1Name} al conocer a ${player2Name}?`,
      `Describe un viaje o escapada perfecta de fin de semana para los dos.`,
      `¿Qué pequeño detalle diario hace que ${player2Name} se sienta súper amado/a por ${player1Name}?`
    ],
    spicy: [
      `Completa la frase: "Me vuelvo loco/a cuando me miras haciendo..."`,
      `Verdad o Reto: Elige un lugar de la casa inédito para un beso intenso de 20 segundos.`,
      `Describe en tres adjetivos sugerentes la química de ustedes hoy.`
    ],
    funny: [
      `${player1Name} debe imitar los gestos de enojo de ${player2Name} durante 10 segundos.`,
      `¿Quién es más propenso a gastrarse toda la quincena en cosas absurdas online?`,
      `Hacer un duelo de miradas serias de 15 segundos. ¡El que se ría pierde!`
    ],
    intellectual: [
      `Resuelve este dilema de equipo: Si naufragan en una isla, ¿quién arma el refugio y quién caza?`,
      `Consensúen en 30 segundos cuál es el mayor logro que han conseguido juntos.`,
      `Adivinanza rápida: ¿Qué se rompe cuando dices su nombre? (El silencio)`
    ]
  };

  if (!ai) {
    return res.json({ challenges: mockChallenges[mood] || mockChallenges.romantic });
  }

  try {
    const prompt = `Tienes una pareja integrada por ${player1Name || "Jugador 1"} y ${player2Name || "Jugador 2"}.
    Actualmente están jugando un juego de pareja en el modo de viborilla/mood "${mood}".
    Genera una lista de 4 preguntas, desafíos o prompts interactivos, llamativos y realistas dirigidos a ellos.
    - Si el modo es "romantic", haz preguntas profundas o retos amorosos adorables.
    - Si el modo es "spicy", haz retos sexys o preguntas atrevidas SOFT (divertidas y picantes, elegantes, NUNCA explícitas ni pornográficas).
    - Si el modo es "funny", haz retos absurdos, imitaciones o dilemas de risa caóticos.
    - Si el modo es "intellectual", propón acertijos, dilemas de debates existenciales o retos mentales rápidos.
    Responde estrictamente en formato JSON utilizando el esquema:
    {
      "challenges": ["pregunta/reto 1", "pregunta/reto 2", "pregunta/reto 3", "pregunta/reto 4"]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const outputText = response.text || "{}";
    const cleanedText = outputText.replace(/```json|```/gi, "").trim();
    const result = JSON.parse(cleanedText);
    res.json(result);
  } catch (err) {
    console.error("Gemini challenge generator error:", err);
    res.json({ challenges: mockChallenges[mood] || mockChallenges.romantic });
  }
});

// Serve frontend assets in production/development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    // Development middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static distribution assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HeartSync] Game server running on port ${PORT}`);
  });
}

setupVite();
