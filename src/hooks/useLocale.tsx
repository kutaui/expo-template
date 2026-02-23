import { createContext, useContext, useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales, Locale } from "expo-localization";
import type { TranslateOptions } from "i18n-js";
import { I18n } from "i18n-js";

import array from "@/lib/array";

type ReturnTypes = {
    t: (key: string, options?: { [key: string]: string | number }) => string;
    locale: string;
    changeLocale: (localeParam: string) => void;
    languageTag: string;
    availableLocales: string[];
};

const DEFAULT_LANGUAGE_CODE = "en";
const DEFAULT_LANGUAGE_TAG = "en-US";
const LOCALE_STORAGE_KEY = "user_locale";

const LocaleContext = createContext({} as ReturnTypes);
const translationGetters = {
    ar: require("../assets/locale/ar.json"),
    ca: require("../assets/locale/ca.json"),
    cn: require("../assets/locale/cn.json"),
    cs: require("../assets/locale/cs.json"),
    da: require("../assets/locale/da.json"),
    de: require("../assets/locale/de.json"),
    el: require("../assets/locale/el.json"),
    en: require("../assets/locale/en.json"),
    es: require("../assets/locale/es.json"),
    fi: require("../assets/locale/fi.json"),
    fr: require("../assets/locale/fr.json"),
    he: require("../assets/locale/he.json"),
    hi: require("../assets/locale/hi.json"),
    hr: require("../assets/locale/hr.json"),
    hu: require("../assets/locale/hu.json"),
    id: require("../assets/locale/id.json"),
    it: require("../assets/locale/it.json"),
    ja: require("../assets/locale/ja.json"),
    ko: require("../assets/locale/ko.json"),
    ms: require("../assets/locale/ms.json"),
    nl: require("../assets/locale/nl.json"),
    no: require("../assets/locale/no.json"),
    pl: require("../assets/locale/pl.json"),
    pt: require("../assets/locale/pt.json"),
    ro: require("../assets/locale/ro.json"),
    ru: require("../assets/locale/ru.json"),
    sk: require("../assets/locale/sk.json"),
    sv: require("../assets/locale/sv.json"),
    th: require("../assets/locale/th.json"),
    tr: require("../assets/locale/tr.json"),
    uk: require("../assets/locale/uk.json"),
    vi: require("../assets/locale/vi.json"),
};

const i18n = new I18n(translationGetters);
i18n.enableFallback = true;

i18n.missingTranslation.register("fallback", (i18nParam, scope, options) => {
    const originalLocale = i18nParam.locale;
    i18nParam.locale = DEFAULT_LANGUAGE_CODE;
    const result = i18nParam.t(scope, Object.assign({}, options, { missingBehavior: "guess" }));
    i18nParam.locale = originalLocale;
    return result as string;
});
i18n.missingBehavior = "fallback";

const deviceLocale = array.first(getLocales()) as Locale;

function getDefaultLocale() {
    const keys = Object.keys(translationGetters);

    if (!deviceLocale.languageCode) {
        return DEFAULT_LANGUAGE_CODE;
    }

    if (keys.includes(deviceLocale.languageCode)) {
        return deviceLocale?.languageCode;
    }

    return DEFAULT_LANGUAGE_CODE;
}

const defaultLocale = getDefaultLocale();

export const LocaleProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [locale, setLocale] = useState<string>(defaultLocale);

    i18n.locale = locale;

    useEffect(() => {
        loadSavedLocale();
    }, []);

    async function loadSavedLocale() {
        try {
            const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
            if (savedLocale && Object.keys(translationGetters).includes(savedLocale)) {
                setLocale(savedLocale);
            }
        } catch (error) {
            console.error("Failed to load saved locale:", error);
        }
    }

    async function changeLocale(localeParam: string) {
        try {
            await AsyncStorage.setItem(LOCALE_STORAGE_KEY, localeParam);
            setLocale(localeParam);
        } catch (error) {
            console.error("Failed to save locale:", error);
            setLocale(localeParam);
        }
    }

    function t(scope: string, options?: TranslateOptions) {
        return i18n.t(scope, options);
    }

    return (
        <LocaleContext.Provider
            value={{
                t: t,
                locale,
                changeLocale,
                languageTag: deviceLocale?.languageTag || DEFAULT_LANGUAGE_TAG,
                availableLocales: Object.keys(translationGetters),
            }}
        >
            {children}
        </LocaleContext.Provider>
    );
};

export default function useLocale(scope: string): ReturnTypes {
    const context = useContext(LocaleContext);

    if (!context) {
        throw new Error("useLocale must be used within a LocaleProvider");
    }

    const t = (key: string, options?: TranslateOptions) => {
        const fullKey = scope ? `${scope}.${key}` : key;
        return context.t(fullKey, options);
    };

    return {
        ...context,
        t,
    };
}
