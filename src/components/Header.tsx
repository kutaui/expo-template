import { cn } from "@/lib/utils";
import useLocale from "@/hooks/useLocale";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import * as React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export type HeaderProps = {
    title?: string;
    showBack?: boolean;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
};

function Header({
    title,
    showBack = false,
    onBackPress,
    rightElement,
}: HeaderProps) {
    const router = useRouter();
    const { t } = useLocale('common');
    const { top } = useSafeAreaInsets();
    // Force light mode icon color since app is light-theme only
    const iconColor = '#2D2D2D';

    function handleBackPress() {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    }

    return (
        <View className="bg-background" style={{ paddingTop: top }}>
            <View
                className={cn(
                    "flex-row items-center justify-between px-4 bg-background border-b border-border h-14"
                )}
            >
                <View className="flex-1 justify-center items-start">
                    {showBack && (
                        <Button
                            onPress={handleBackPress}
                            className="p-1 -ml-1"
                            accessibilityRole="button"
                            accessibilityLabel={t('labels.goBack')}
                            accessibilityHint="Navigates to the previous screen"
                            hitSlop={20}
                            variant='ghost'
                        >
                            <View pointerEvents="none">
                                <ChevronLeft size={24} color={iconColor} />
                            </View>
                        </Button>
                    )}
                </View>

                {title && (
                    <View
                        className="absolute left-0 right-0 justify-center items-center px-16"
                        pointerEvents="none"
                    >
                        <Text
                            className="text-xl font-semibold text-foreground text-center"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {title}
                        </Text>
                    </View>
                )}

                <View className="flex-1 justify-center items-end">{rightElement}</View>
            </View>
        </View>
    );
}

export { Header };
