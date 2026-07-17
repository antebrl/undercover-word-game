import React, { createContext, useContext, useEffect, useState } from "react";
import { Peer, DataConnection } from "peerjs";
import { useGame } from "./GameContext";
import { toast } from "sonner";
import { GameState } from "../types/game";
import { useSound } from "./SoundContext";
import { useTranslation } from "react-i18next";

interface PeerContextType {
  peer: Peer | null;
  connections: Record<string, DataConnection>;
  hostId: string | null;
  isHost: boolean;
  hostGame: (username: string) => void;
  joinGame: (hostId: string, username: string) => void;
  sendGameState: (state: GameState) => void;
  sendToHost: (data: unknown) => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
  const { playSound } = useSound();
  const { t } = useTranslation();
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<Record<string, DataConnection>>({});
  const [hostId, setHostId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const {
    gameState, setGameState, addPlayer, removePlayer,
    submitMrWhiteGuess, submitVote, submitDescription,
    resolveJusticeDecision, resolveRevengerDecision, resolveFalafelDecision,
  } = useGame();

  useEffect(() => {
    const newPeer = new Peer();
    newPeer.on("open", () => setPeer(newPeer));
    newPeer.on("error", () => toast.error(t("peer.connectionError")));

    newPeer.on("connection", (conn) => {
      const pc = conn.peerConnection;
      pc.oniceconnectionstatechange = () => {
        if (["disconnected", "failed"].includes(pc.iceConnectionState)) {
          removePlayer(conn.peer);
          conn.close();
        }
      };

      conn.on("open", () => {
        setConnections(prev => ({ ...prev, [conn.peer]: conn }));
        if (gameState) conn.send({ type: "GAME_STATE", state: gameState });
      });

      conn.on("close", () => {
        removePlayer(conn.peer);
        toast.error(t("peer.playerDisconnected", {
          name: gameState.players.find(p => p.id === conn.peer)?.name || t("peer.unknownPlayer"),
        }));
        setConnections(prev => { const n = { ...prev }; delete n[conn.peer]; return n; });
      });

      conn.on("data", (data: unknown) => {
        const msg = data as Record<string, unknown>;
        switch (msg.type) {
          case "JOIN_GAME":
            playSound("/sounds/player-joined.mp3");
            addPlayer(msg.username as string, conn.peer);
            conn.send({ type: "GAME_STATE", state: gameState });
            break;
          case "GAME_STATE":
            setGameState(msg.state as GameState);
            break;
          case "SUBMIT_VOTE":
            submitVote(msg.voterId as string, msg.targetId as string);
            break;
          case "SUBMIT_DESCRIPTION":
            submitDescription(msg.playerId as string, msg.description as string);
            break;
          case "MR_WHITE_GUESS":
            submitMrWhiteGuess(msg.guess as string);
            break;
          // Special role decisions (host resolves, clients notify host)
          case "JUSTICE_DECISION":
            resolveJusticeDecision(msg.chosenId as string);
            break;
          case "REVENGER_DECISION":
            resolveRevengerDecision(msg.targetId as string);
            break;
          case "FALAFEL_DECISION":
            resolveFalafelDecision(msg.targetId as string);
            break;
          default:
            console.log("Unknown message type:", msg.type);
        }
      });
    });

    const cleanup = () => { if (!newPeer.disconnected) newPeer.destroy(); };
    window.addEventListener("beforeunload", cleanup);
    return () => { newPeer.destroy(); window.removeEventListener("beforeunload", cleanup); };
  }, []);

  const hostGame = (username: string) => {
    if (!peer) return;
    setIsHost(true);
    setHostId(peer.id);
    addPlayer(username, peer.id);
    toast.success(t("peer.gameHosted", { id: peer.id }));
  };

  const joinGame = (hId: string, username: string) => {
    if (!peer) return;
    const conn = peer.connect(hId);

    const cleanup = () => { if (!peer.disconnected) peer.destroy(); };
    window.addEventListener("beforeunload", cleanup);

    conn.on("open", () => {
      setConnections(prev => ({ ...prev, [hId]: conn }));
      setHostId(hId);
      conn.send({ type: "JOIN_GAME", username });
      toast.success(t("peer.connected"));
    });

    conn.on("data", (data: unknown) => {
      const msg = data as Record<string, unknown>;
      if (msg.type === "GAME_STATE") setGameState(msg.state as GameState);
    });

    conn.on("close", () => {
      setConnections(prev => { const n = { ...prev }; delete n[hId]; return n; });
      setHostId(null);
      setIsHost(false);
      toast.error(t("peer.hostClosedConnection"));
    });
  };

  const sendGameState = (state: GameState) => {
    Object.values(connections).forEach(conn => conn.send({ type: "GAME_STATE", state }));
  };

  const sendToHost = (data: unknown) => {
    if (!hostId || !connections[hostId]) return;
    connections[hostId].send(data);
  };

  // Broadcast state changes to all clients whenever the host's state changes
  useEffect(() => {
    if (isHost && Object.keys(connections).length > 0) {
      sendGameState(gameState);
    }
  }, [gameState, isHost, connections]);

  return (
    <PeerContext.Provider value={{ peer, connections, hostId, isHost, hostGame, joinGame, sendGameState, sendToHost }}>
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error("usePeer must be used within a PeerProvider");
  return ctx;
};
