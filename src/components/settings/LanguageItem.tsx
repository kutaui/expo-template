import { Text } from '@/components/ui/text';
import { Check } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

interface LanguageItemProps {
  languageCode: string;
  languageName: string;
  isSelected: boolean;
  onPress: (code: string) => void;
}

export const LanguageItem = React.memo(({ languageCode, languageName, isSelected, onPress }: LanguageItemProps) => {
  const handlePress = React.useCallback(() => {
    onPress(languageCode);
  }, [onPress, languageCode]);

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center justify-between py-4 border-b border-border/50"
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={languageName}
      accessibilityState={{ selected: isSelected }}
    >
      <Text className={`text-base ${isSelected ? 'font-semibold text-[#E07A5F]' : 'text-foreground'}`}>
        {languageName}
      </Text>
      {isSelected && (
        <View pointerEvents="none">
          <Check size={20} color="#E07A5F" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
});

LanguageItem.displayName = 'LanguageItem';
