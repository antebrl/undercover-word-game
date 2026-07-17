import { SpecialRole } from "@/types/game";

const SPECIAL_ROLE_META: Record<SpecialRole, { emoji: string; label: string; color: string }> = {
  none:          { emoji: "",    label: "",              color: "" },
  justice:       { emoji: "⚖️",  label: "Justice",       color: "text-yellow-400" },
  lovers:        { emoji: "❤️",  label: "Lovers",        color: "text-pink-400" },
  revenger:      { emoji: "💀",  label: "Revenger",      color: "text-red-400" },
  ghost:         { emoji: "👻",  label: "Ghost",         color: "text-blue-300" },
  joyFool:       { emoji: "🤡",  label: "Joy Fool",      color: "text-orange-400" },
  boomerang:     { emoji: "",  label: "Boomerang",     color: "text-green-400" },
  duelist:       { emoji: "⚔️",  label: "Duelist",       color: "text-purple-400" },
  falafelVendor: { emoji: "🥙",  label: "Falafel Vendor", color: "text-amber-400" },
  mrMeme:        { emoji: "🎭",  label: "Mr. Meme",      color: "text-cyan-400" },
};

interface SpecialRoleBadgeProps {
  role: SpecialRole;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const SpecialRoleBadge = ({
  role,
  showLabel = false,
  size = "md",
}: SpecialRoleBadgeProps) => {
  if (!role || role === "none") return null;
  const meta = SPECIAL_ROLE_META[role];
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";

  return (
    <span className={`inline-flex items-center gap-1 ${meta.color} ${textSize} font-medium`}>
      <span>{meta.emoji}</span>
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
};

export const getSpecialRoleMeta = (role: SpecialRole) => SPECIAL_ROLE_META[role];
