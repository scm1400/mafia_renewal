const LOCALIZE_KEYS = {
   
}
const LOCALIZE_CONTAINER: { [key: string]: object } = {
    ko: null,
    ja: null,
    en: null
};

export class Localizer {
    static getLanguageCode(player): string {
        return player.language === "ko" || player.language === "ja" ? player.language : "en";
    }

    static prepareLocalizationContainer(player): void {
        const language = this.getLanguageCode(player);
        if (LOCALIZE_CONTAINER[language] === null) {
            LOCALIZE_CONTAINER[language] = Object.keys(LOCALIZE_KEYS).reduce(this.localizeKey.bind(null, player), {});
        }
    }

    static getLocalizeString(player, key: string): string {
        const language = this.getLanguageCode(player);
        return LOCALIZE_CONTAINER[language][key] ?? "";
    }

    static getLocalizeContainer(player): object {
        const language = this.getLanguageCode(player);
        return LOCALIZE_CONTAINER[language];
    }

    static localizeKey(player, acc: object, key: string): object {
        acc[key] = player.localize(key);
        return acc;
    }
}