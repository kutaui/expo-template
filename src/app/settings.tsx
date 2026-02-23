import Aptabase from "@aptabase/react-native";
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { ChevronRight, Crown, Globe, Mail, Sparkles } from 'lucide-react-native';
import * as React from 'react';
import { Linking, Pressable, ScrollView, View, useColorScheme } from 'react-native';

import { Header } from '@/components/Header';
import { LanguageBottomSheet } from '@/components/settings/LanguageBottomSheet';
import { Text } from '@/components/ui/text';
import { LANGUAGE_NAMES } from "@/constants/languages";
import useLocale from '@/hooks/useLocale';



export default function SettingsScreen() {
    const { t, locale } = useLocale('view.settings');
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const bottomSheetRef = React.useRef<BottomSheetModal>(null);

    const currentLanguageName = LANGUAGE_NAMES[locale] || locale;

    React.useEffect(() => {
        Aptabase.trackEvent("settings_opened");
    }, []);

    const handleOpenLanguageSheet = React.useCallback(() => {
        bottomSheetRef.current?.present();
    }, []);

    const handleUpgrade = React.useCallback(() => {
        Aptabase.trackEvent("upgrade_clicked", { source: "settings" });
        router.push('/paywall');
    }, [router]);

    return (
        <View className="flex-1 bg-background">
            <Header title={t('labels.title')} showBack />
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Language Selector */}
                <Pressable
                    onPress={handleOpenLanguageSheet}
                    className="bg-card rounded-2xl p-4 mb-4 flex-row items-center justify-between border border-border"
                    style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                >
                    <View className="flex-row items-center gap-3">
                        <View
                            className="p-2.5 rounded-xl"
                            style={{ backgroundColor: isDark ? '#2c2c2e' : '#f3f4f6' }}
                        >
                            <Globe size={22} color={isDark ? '#F4A261' : '#E07A5F'} />
                        </View>
                        <View>
                            <Text className="text-base font-semibold text-foreground">
                                {t('labels.language')}
                            </Text>
                            <Text className="text-sm text-muted-foreground">
                                {currentLanguageName}
                            </Text>
                        </View>
                    </View>
                    <View pointerEvents="none">
                        <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                    </View>
                </Pressable>

                {/* Support */}
                <Pressable
                    onPress={async () => {
                        try {
                            await Linking.openURL('mailto:support@outfitanalyse.com');
                        } catch (error) {
                            console.error('Error opening email:', error);
                        }
                    }}
                    className="bg-card rounded-2xl p-4 mt-4 flex-row items-center justify-between border border-border"
                    style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                >
                    <View className="flex-row items-center gap-3">
                        <View
                            className="p-2.5 rounded-xl"
                            style={{ backgroundColor: isDark ? '#2c2c2e' : '#f3f4f6' }}
                        >
                            <Mail size={22} color={isDark ? '#6b7280' : '#9ca3af'} />
                        </View>
                        <View>
                            <Text className="text-base font-semibold text-foreground">
                                {t('labels.support')}
                            </Text>
                            <Text className="text-sm text-muted-foreground">
                                support@outfitanalyse.com
                            </Text>
                        </View>
                    </View>
                    <View pointerEvents="none">
                        <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
                    </View>
                </Pressable>
            </ScrollView>

            <LanguageBottomSheet bottomSheetRef={bottomSheetRef} />
        </View>
    );
}
