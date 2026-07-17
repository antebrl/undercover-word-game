import { useState, useEffect } from "react";
import { usePeer } from "../context/PeerContext";
import { useGame } from "../context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, UserPlus, Wifi, WifiOff, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

type View = "home" | "host" | "join" | "offline";

export const MultiplayerSetup = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { hostGame, joinGame } = usePeer();
  const { initOfflinePlayers } = useGame();

  const hasGameId = !!searchParams.get("gameId");
  const [view, setView] = useState<View>(hasGameId ? "join" : "home");
  const [joinId, setJoinId] = useState(searchParams.get("gameId") ?? "");
  const [username, setUsername] = useState("");
  const [offlinePlayers, setOfflinePlayers] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const id = searchParams.get("gameId");
    if (id) { setJoinId(id); setView("join"); }
  }, [searchParams]);

  const addOfflinePlayer = () => {
    const name = newName.trim();
    if (!name) return;
    if (offlinePlayers.length >= 10) { toast.error(t("gameSetup.maxPlayers")); return; }
    if (offlinePlayers.includes(name)) { toast.error(t("multiplayerSetup.duplicateName")); return; }
    setOfflinePlayers(p => [...p, name]);
    setNewName("");
  };

  const startOffline = () => {
    if (offlinePlayers.length < 4) { toast.error(t("multiplayerSetup.offlineMinPlayers")); return; }
    initOfflinePlayers(offlinePlayers);
  };

  return (
    <Card className="max-w-md mx-auto p-6 space-y-6 animate-fade-in glass-morphism">
      <h2 className="text-2xl font-bold text-center text-gradient">{t("welcome")}</h2>

      {/* ── Home ── */}
      {view === "home" && (
        <div className="space-y-4">
          <Button onClick={() => setView("host")} className="w-full bg-primary hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" /> {t("multiplayerSetup.hostNewGame")}
          </Button>

          <Divider label={t("multiplayerSetup.joinExistingGame")} />

          <Button onClick={() => setView("join")} className="w-full bg-secondary hover:bg-secondary/90">
            <Wifi className="mr-2 h-4 w-4" /> {t("multiplayerSetup.joinGame")}
          </Button>

          <Divider label={t("multiplayerSetup.or")} />

          <Button onClick={() => setView("offline")} variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10">
            <WifiOff className="mr-2 h-4 w-4" /> {t("multiplayerSetup.offlineMode")}
          </Button>
        </div>
      )}

      {/* ── Host ── */}
      {view === "host" && (
        <div className="space-y-4 animate-fade-in">
          <Input value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && hostGame(username.trim())}
            placeholder={t("multiplayerSetup.enterUsername")} maxLength={25}
            className="bg-secondary/20 border-secondary/30" />
          <Button onClick={() => { if (!username.trim()) { toast.error(t("multiplayerSetup.enterUsernameError")); return; } hostGame(username.trim()); }}
            className="w-full bg-primary hover:bg-primary/90">
            {t("multiplayerSetup.startHosting")}
          </Button>
          <Button variant="ghost" onClick={() => setView("home")} className="w-full">{t("multiplayerSetup.back")}</Button>
        </div>
      )}

      {/* ── Join ── */}
      {view === "join" && (
        <div className="space-y-4 animate-fade-in">
          <Input value={username} onChange={e => setUsername(e.target.value)}
            placeholder={t("multiplayerSetup.enterUsername")} maxLength={25}
            className="bg-secondary/20 border-secondary/30" />
          <Input value={joinId} onChange={e => setJoinId(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { if (!joinId.trim()) { toast.error(t("multiplayerSetup.enterGameIdError")); return; } if (!username.trim()) { toast.error(t("multiplayerSetup.enterUsernameError")); return; } joinGame(joinId.trim(), username.trim()); } }}
            placeholder={t("multiplayerSetup.enterGameId")}
            className="bg-secondary/20 border-secondary/30" />
          <Button onClick={() => { if (!joinId.trim()) { toast.error(t("multiplayerSetup.enterGameIdError")); return; } if (!username.trim()) { toast.error(t("multiplayerSetup.enterUsernameError")); return; } joinGame(joinId.trim(), username.trim()); }}
            className="w-full bg-primary hover:bg-primary/90">{t("multiplayerSetup.joinGame")}</Button>
          <Button variant="ghost" onClick={() => setView("home")} className="w-full">{t("multiplayerSetup.back")}</Button>
        </div>
      )}

      {/* ── Offline ── */}
      {view === "offline" && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-lg bg-white/5 p-3 text-white/70 text-sm">
            📱 {t("multiplayerSetup.offlineDesc")}
          </div>

          {offlinePlayers.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {offlinePlayers.map((name, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                  <span className="text-white text-sm">{i + 1}. {name}</span>
                  <button onClick={() => setOfflinePlayers(p => p.filter((_, j) => j !== i))}
                    className="text-white/40 hover:text-red-400 transition-colors p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addOfflinePlayer()}
              placeholder={t("multiplayerSetup.enterUsername")} maxLength={20}
              className="flex-1 bg-secondary/20 border-secondary/30" />
            <Button onClick={addOfflinePlayer} className="bg-white/10 hover:bg-white/20 border border-white/10 px-4">+</Button>
          </div>

          <p className="text-center text-white/40 text-xs">
            {offlinePlayers.length}/10 {t("playerList.players", { count: offlinePlayers.length })}
            {offlinePlayers.length < 4 && ` - ${t("multiplayerSetup.offlineMinPlayers")}`}
          </p>

          <Button onClick={startOffline} disabled={offlinePlayers.length < 4}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40">
            <Users className="mr-2 h-4 w-4" />
            {t("multiplayerSetup.startOffline", { count: offlinePlayers.length })}
          </Button>
          <Button variant="ghost" onClick={() => setView("home")} className="w-full">{t("multiplayerSetup.back")}</Button>
        </div>
      )}
    </Card>
  );
};

const Divider = ({ label }: { label: string }) => (
  <div className="relative flex items-center">
    <span className="flex-grow border-t border-white/10" />
    <span className="px-4 text-xs uppercase text-muted-foreground">{label}</span>
    <span className="flex-grow border-t border-white/10" />
  </div>
);
