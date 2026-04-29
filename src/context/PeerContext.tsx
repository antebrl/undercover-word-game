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
  sendToHost: (data: any) => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
  const { playSound } = useSound();
  const { t } = useTranslation();
  
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<Record<string, DataConnection>>({});
  const [hostId, setHostId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const { gameState, setGameState, addPlayer, removePlayer, submitMrWhiteGuess, submitVote, submitDescription } = useGame();

  useEffect(() => {
    const newPeer = new Peer();
    
    newPeer.on("open", (id) => {
      console.log("My peer ID is:", id);
      setPeer(newPeer);
    });

    newPeer.on("error", (error) => {
      console.error("Peer error:", error);
      toast.error(t("peer.connectionError"));
    });

    //HOST CONNECTION EVENTS
    newPeer.on("connection", (conn) => {
      console.log("Incoming connection from:", conn.peer);

      // Monitor ICE connection state - [unexpected disconnect handling]
      const pc = conn.peerConnection;
      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
        if (["disconnected", "failed"].includes(pc.iceConnectionState)) {
          console.log("ICE disconnect detected");
          removePlayer(conn.peer);
          conn.close();
        }
      };
      
      conn.on("open", () => {
        setConnections(prev => ({ ...prev, [conn.peer]: conn }));

        if (gameState) {
          conn.send({ type: "GAME_STATE", state: gameState });
        }
      });

      conn.on("close", () => {
        console.log("Connection closed with:", conn.peer);

        removePlayer(conn.peer);
        toast.error(t("peer.playerDisconnected", { name: gameState.players.find(p => p.id === conn.peer)?.name || t("peer.unknownPlayer") }));

        setConnections(prev => {
          const newConnections = { ...prev };
          delete newConnections[conn.peer];
          return newConnections;
        });
      });

      conn.on("data", (data: any) => {
        console.debug("Received data:", data);
        switch (data.type) {
          case "JOIN_GAME":
            console.log("New player joining:", data.username);
            playSound("/sounds/player-joined.mp3");
            addPlayer(data.username, conn.peer);
            conn.send({ type: "GAME_STATE", state: gameState });
            break;
          case "GAME_STATE":
            console.debug("Received game state:", data.state);
            setGameState(data.state);
            break;
          case "SUBMIT_VOTE":
            console.debug("Received vote:", data);
            submitVote(data.voterId, data.targetId);
            break;
          case "SUBMIT_DESCRIPTION":
            console.debug("Received description:", data);
            submitDescription(data.playerId, data.description);
            break;
          case "MR_WHITE_GUESS":
            console.debug("Received Mr. White guess:", data);
            submitMrWhiteGuess(data.guess);
            break;
          default:
            console.log("Unknown data type:", data.type);
        }
      });
    });

    //Cleanup on host disconnect
    const cleanupHost = () => {
      if (!newPeer.disconnected) {
        console.log("Disconnecting peer");
        newPeer.destroy();
      }
      window.removeEventListener('beforeunload', cleanupHost);
    };
    window.addEventListener('beforeunload', cleanupHost);

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
    toast.success(t("peer.gameHosted", { id: peer.id }));
  };

  const joinGame = (hostId: string, username: string) => {
    if (!peer) return;
    
    const conn = peer.connect(hostId);
    console.log("Joining game with peer ID:", peer.id);

    const cleanupClient = () => {
      if (!peer.disconnected) {
        console.log("Disconnecting peer");
        peer.destroy();
      }
      window.removeEventListener('beforeunload', cleanupClient);
    };
    window.addEventListener('beforeunload', cleanupClient);
    
    //Client connection events
    conn.on("open", () => {
      setConnections(prev => ({ ...prev, [hostId]: conn }));
      setHostId(hostId);
      conn.send({ type: "JOIN_GAME", username });
      toast.success(t("peer.connected"));
    });

    conn.on("data", (data: any) => {
      console.debug("Received data in connection:", data);
      if (data.type === "GAME_STATE") {
        console.debug("Setting received game state:", data.state);
        setGameState(data.state);
      }
    });

    conn.on("close", () => {
      console.log("Connection closed with host");
      setConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[hostId];
        return newConnections;
      });
      setHostId(null);
      setIsHost(false);
      toast.error(t("peer.hostClosedConnection"));
    });
  };

  const sendGameState = (state: GameState) => {
    console.debug("Sending game state to all connections:", state);
    Object.values(connections).forEach(conn => {
      conn.send({ type: "GAME_STATE", state });
    });
  };

  const sendToHost = (data: any) => {
    if (!hostId || !connections[hostId]) {
      console.error("No connection to host");
      return;
    }
    console.log("Sending data to host:", data);
    connections[hostId].send(data);
  };

  useEffect(() => {
    if (isHost && Object.keys(connections).length > 0) {
      console.log("Host sending updated game state to all connections");
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
        sendToHost,
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