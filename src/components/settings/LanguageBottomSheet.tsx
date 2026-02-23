import { trackEvent } from "@aptabase/react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View, useColorScheme } from 'react-native';

import { LanguageItem } from '@/components/settings/LanguageItem';
import { Text } from '@/components/ui/text';
import { LANGUAGE_NAMES } from '@/constants/languages';
import useLocale from '@/hooks/useLocale';

type LanguageBottomSheetProps = {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
};

export function LanguageBottomSheet({ bottomSheetRef }: LanguageBottomSheetProps) {
    const { t, locale, changeLocale, availableLocales } = useLocale('view.settings');
    const isDark = useColorScheme() === 'dark';
    const snapPoints = React.useMemo(() => ['70%'], []);

    // Use ref to keep the handler stable and prevent re-renders of all items
    const localeRef = React.useRef(locale);
    React.useEffect(() => {
        localeRef.current = locale;
    }, [locale]);

    const handleSelectLanguage = React.useCallback((languageCode: string) => {
        trackEvent("language_changed", { from: localeRef.current, to: languageCode });
        changeLocale(languageCode);
        bottomSheetRef.current?.dismiss();
    }, [changeLocale, bottomSheetRef]);

    const renderBackdrop = React.useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    // Sort languages alphabetically by their native name
    const sortedLocales = React.useMemo(() => {
        return [...availableLocales].sort((a, b) => {
            const nameA = LANGUAGE_NAMES[a] || a;
            const nameB = LANGUAGE_NAMES[b] || b;
            return nameA.localeCompare(nameB);
        });
    }, [availableLocales]);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={{
                backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
            }}
            handleIndicatorStyle={{
                backgroundColor: isDark ? '#48484a' : '#c7c7cc',
            }}
        >
            <View className="px-5 pb-3 border-b border-border">
                <Text className="text-xl font-bold text-foreground text-center">
                    {t('labels.selectLanguage')}
                </Text>
            </View>
            <BottomSheetScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 40 }}
            >
                {sortedLocales.map((languageCode) => (
                    <LanguageItem
                        key={languageCode}
                        languageCode={languageCode}
                        languageName={LANGUAGE_NAMES[languageCode] || languageCode}
                        isSelected={locale === languageCode}
                        onPress={handleSelectLanguage}
                    />
                ))}
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}
