import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
	{ code: "en", label: "EN" },
	{ code: "de", label: "DE" },
	{ code: "fr", label: "FR" },
];

export const LanguageSwitcher = () => {
	const { i18n, t } = useTranslation();
	const currentLanguage = i18n.resolvedLanguage ?? i18n.language;

	const handleChangeLanguage = (languageCode: string) => {
		void i18n.changeLanguage(languageCode);
	};

	return (
		<div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-white shadow-lg backdrop-blur-md">

			<Select
				value={currentLanguage}
				onValueChange={handleChangeLanguage}
			>
				<SelectTrigger
					className="h-9 w-[70px] rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 focus:ring-white/30"
					aria-label={t("language")}
				>
					<SelectValue placeholder={t("language")} />
				</SelectTrigger>

				<SelectContent>
					{languages.map((language) => (
						<SelectItem key={language.code} value={language.code}>
							{language.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};