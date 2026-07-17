import { useGame } from "../context/GameContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePeer } from "../context/PeerContext";
import { PlayerList } from "./shared/PlayerList";
import { useEffect, useState } from "react";
import { useSound } from "@/context/SoundContext";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SpecialRoleBadge } from "./shared/SpecialRoleBadge";
import { isEmojiOnly } from "@/roles/special/MrMemeRole";
import { canPlayerSpeak } from "@/roles";
import { useIsHost } from "@/hooks/useIsHost";
import { Eye, EyeOff } from "lucide-react";

export const WordReveal = () => {
  const { gameState, setPhase, submitDescription, rerollWords } = useGame();
  const { peer, sendToHost } = usePeer();
  const { playSound } = useSound();
  const { t } = useTranslation();
  const isHost = useIsHost();
  const isOffline = gameState.gameMode === "offline";

  const [description, setDescription] = useState("");
  const [wordVisible, setWordVisible] = useState(!isOffline);

  useEffect(() => {
    if (gameState.currentRound === 1) playSound("/sounds/word-reveal.mp3");
    else playSound("/sounds/new-page.mp3");
    setWordVisible(!isOffline);
  }, []);

  // In offline mode, no current player concept everyone is on the same screen
  const currentPlayer = isOffline ? undefined : gameState.players.find(p => p.id === peer?.id);

  const speakingOrderPlayers = (gameState.speakingOrder ?? [])
    .map(id => gameState.players.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined && canPlayerSpeak(p));

  const currentSpeakerIndex = speakingOrderPlayers.findIndex(p => !p.submittedDescription);
  const myIndex = currentPlayer ? speakingOrderPlayers.findIndex(p => p.id === currentPlayer.id) : -1;
  const isMyTurn = myIndex !== -1 && currentSpeakerIndex === myIndex;
  const isSilenced = currentPlayer?.temporaryEffect === "silenced";
  const isMrMeme = currentPlayer?.specialRole === "mrMeme";

  const handleSubmitDescription = () => {
    if (!description.trim()) return;
    const player = currentPlayer ?? speakingOrderPlayers[currentSpeakerIndex];
    if (!player) return;

    if (description.trim().toLowerCase() === player.word?.toLowerCase()) {
      toast.error(t("wordReveal.cannotUseWordDirectly")); return;
    }
    if (player.specialRole === "mrMeme" && !isEmojiOnly(description.trim())) {
      toast.error(t("wordReveal.mrMemeEmojiOnly")); return;
    }

    if (isHost) submitDescription(player.id, description.trim());
    else sendToHost({ type: "SUBMIT_DESCRIPTION", playerId: player.id, description: description.trim() });
    setDescription("");
  };

  if (!isOffline && !peer) return <div className="text-white text-center">{t("wordReveal.connecting")}</div>;
  if (!isOffline && !currentPlayer) return (
    <div className="text-white text-center">
      <p>{t("wordReveal.waitingForData")}</p>
      <p className="text-sm opacity-70">{t("wordReveal.yourId")} {peer?.id}</p>
    </div>
  );

  const displayPlayer = currentPlayer ?? speakingOrderPlayers[currentSpeakerIndex];
  const showInput = isOffline ? currentSpeakerIndex >= 0 : isMyTurn;

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-white">
        {currentPlayer?.isEliminated ? t("wordReveal.titleEliminated") : t("wordReveal.titleDiscussion")}
      </h2>

      {/* Show the current player's word card (online) or a summary card (offline) */}
      {!isOffline && displayPlayer && (
        <Card className="p-6 text-center glass-morphism space-y-4">
          {/* Special role banner player always knows their special role */}
          {currentPlayer?.specialRole && currentPlayer.specialRole !== "none" && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-white/50 text-xs mb-1">{t("wordReveal.yourSpecialRole")}</p>
              <SpecialRoleBadge role={currentPlayer.specialRole} showLabel size="md" />
            </div>
          )}

          {currentPlayer?.temporaryEffect && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              🥙 {t(`falafel.effects.${currentPlayer.temporaryEffect}`)}
            </div>
          )}

          {currentPlayer?.role === "mrwhite" ? (
            <p className="text-lg text-white">
              {t("wordReveal.youAre")} <span className="font-bold text-primary">{t("wordReveal.mrWhite")}</span>
            </p>
          ) : (
            <div>
              <p className="text-white/70 text-sm mb-2">
                {currentPlayer?.isEliminated ? t("wordReveal.yourWordWas") : t("wordReveal.yourWordIs")}
              </p>
              {isOffline && !currentPlayer?.isEliminated ? (
                <div className="flex items-center justify-center gap-3">
                  {wordVisible
                    ? <><span className="font-bold text-primary text-2xl">{currentPlayer?.word}</span>
                        <button onClick={() => setWordVisible(false)} className="text-white/40 hover:text-white/70"><EyeOff className="h-5 w-5" /></button></>
                    : <button onClick={() => setWordVisible(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <Eye className="h-4 w-4" /> {t("offline.tapToReveal")}
                      </button>}
                </div>
              ) : (
                <span className="font-bold text-primary text-2xl">{currentPlayer?.word}</span>
              )}
            </div>
          )}

          <p className="text-sm text-white/60">
            {currentPlayer?.role === "mrwhite"
              ? <>{t("wordReveal.listenCarefully")}<br />{t("wordReveal.figureOutSecretWord")}</>
              : <>{isMrMeme ? t("wordReveal.mrMemeInstruction") : t("wordReveal.describeWithoutSaying")}<br />{t("wordReveal.beClever")}</>}
          </p>
        </Card>
      )}

      <div className="space-y-4 mt-4">
        <h3 className="text-xl font-semibold text-white text-center">
          {showInput && !isSilenced ? t("wordReveal.yourTurn") : t("wordReveal.speakingOrder")}
        </h3>

        {showInput && !isSilenced && (
          <div className="relative flex h-10 w-full">
            <Input value={description} onChange={e => setDescription(e.target.value.slice(0, 100))}
              onKeyDown={e => e.key === "Enter" && handleSubmitDescription()}
              placeholder={isMrMeme ? t("wordReveal.mrMemePlaceholder") : t("wordReveal.enterWordOrPhrase")}
              maxLength={100}
              className="h-full w-full rounded-[7px] border px-3 py-2.5 pr-24 text-sm" />
            {description.trim() && (
              <button onClick={handleSubmitDescription} type="button"
                className="absolute right-1 top-1 rounded bg-primary hover:bg-primary/90 py-2 px-4 text-xs font-bold uppercase text-white">
                {t("wordReveal.submit")}
              </button>
            )}
          </div>
        )}

        {showInput && isSilenced && (
          <div className="p-3 rounded-lg bg-white/5 text-center text-white/50 text-sm">🤐 {t("wordReveal.silenced")}</div>
        )}

        <PlayerList players={speakingOrderPlayers} currentPlayerId={peer?.id} speakingOrder showSpecialRoles />
      </div>

      {isHost && (
        <div className="space-y-2 pt-2">
          <Button onClick={() => setPhase("voting")} size="lg" className="w-full bg-primary hover:bg-primary/90 text-lg font-medium">
            {t("wordReveal.startVoting")}
          </Button>
          {gameState.currentRound === 1 && !isOffline && (
            <Button onClick={() => { rerollWords(); toast.success(t("wordReveal.rerolled")); }}
              variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary/10">
              {t("wordReveal.rerollWords")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
