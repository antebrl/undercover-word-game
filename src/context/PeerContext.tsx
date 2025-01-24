import React, { createContext, useContext, useEffect, useState } from "react";
import { Peer, DataConnection } from "peerjs";
import { useGame } from "./GameContext";
import { toast } from "sonner";
import { GameState } from "../types/game";

interface PeerContextType {
  peer: Peer | null;
  connections: Record<string, DataConnection>;
  hostId: string | null;
  isHost: boolean;
  hostGame: (username: string) => void;
  joinGame: (hostId: string, username: string) => void;
  sendGameState: (state: GameState) => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<Record<string, DataConnection>>({});
  const [hostId, setHostId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const { gameState, setGameState, addPlayer } = useGame();

  useEffect(() => {
    const newPeer = new Peer();
    
    newPeer.on("open", (id) => {
      console.log("My peer ID is:", id);
      setPeer(newPeer);
    });

    newPeer.on("error", (error) => {
      console.error("Peer error:", error);
      toast.error("Connection error occurred");
    });

    newPeer.on("connection", (conn) => {
      console.log("Incoming connection from:", conn.peer);
      
      conn.on("open", () => {
        setConnections(prev => ({ ...prev, [conn.peer]: conn }));
        
        if (gameState) {
          conn.send({ type: "GAME_STATE", state: gameState });
        }
      });

      conn.on("data", (data: any) => {
        if (data.type === "JOIN_GAME") {
          console.log("New player joining:", data.username, "with peer ID:", conn.peer);
          addPlayer(data.username, conn.peer);
          conn.send({ type: "GAME_STATE", state: gameState });
        } else if (data.type === "GAME_STATE") {
          console.log("Received game state:", data.state);
          setGameState(data.state);
        }
      });
    });

    return () => {
      newPeer.destroy();
    };
  }, []);

  const hostGame = (username: string) => {
    if (!peer) return;
    console.log("Hosting game with peer ID:", peer.id);
    setIsHost(true);
    setHostId(peer.id);
    addPlayer(username, peer.id);
    toast.success(`Game hosted! Share this ID with players: ${peer.id}`);
  };

  const joinGame = (hostId: string, username: string) => {
    if (!peer) return;
    
    const conn = peer.connect(hostId);
    console.log("Joining game with peer ID:", peer.id);
    
    conn.on("open", () => {
      setConnections(prev => ({ ...prev, [hostId]: conn }));
      setHostId(hostId);
      conn.send({ type: "JOIN_GAME", username });
      toast.success("Connected to game!");
    });

    conn.on("data", (data: any) => {
      if (data.type === "GAME_STATE") {
        console.log("Received initial game state:", data.state);
        setGameState(data.state);
      }
    });
  };

  const sendGameState = (state: GameState) => {
    Object.values(connections).forEach(conn => {
      conn.send({ type: "GAME_STATE", state });
    });
  };

  useEffect(() => {
    if (isHost && Object.keys(connections).length > 0) {
      sendGameState(gameState);
    }
  }, [gameState, isHost, connections]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        connections,
        hostId,
        isHost,
        hostGame,
        joinGame,
        sendGameState,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return context;
};