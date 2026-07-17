import { useGame } from "@/context/GameContext";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const MrWhiteGuess = () => {
  const { gameState } = useGame();
  const { t } = useTranslation();

  if (!gameState.mrWhiteGuess) return null;

  const isCorrect = gameState.mrWhiteGuess.toLowerCase() === gameState.majorityWord.toLowerCase();
  return (
    <div className={`mt-4 p-4 rounded-lg ${isCorrect ? "bg-green-500/20" : "bg-red-500/20"}`}>
      <div className="flex items-center gap-2">
        {isCorrect
          ? <CheckCircle className="text-green-500 flex-shrink-0" />
          : <XCircle className="text-red-500 flex-shrink-0" />}
        <p className="text-white">
          {t("gameEnd.mrWhiteGuessed")} <span className="font-bold">{gameState.mrWhiteGuess}</span>
        </p>
      </div>
    </div>
  );
};
