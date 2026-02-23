import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

// NOTE: group-* is not supported yet by Uniwind

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-2xl shadow-none overflow-hidden', // Added overflow-hidden for gradient clipping
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary/90 shadow-sm shadow-orange-500/20',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive/90 dark:bg-destructive/60 shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'border-border/50 bg-primary/10 active:bg-primary/20 border shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-primary/20',
          })
        ),
        secondary: cn(
          'bg-secondary/10 active:bg-secondary/20 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-secondary/20' })
        ),
        ghost: cn(
          'active:bg-accent dark:active:bg-accent/50',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' })
        ),
        link: '',
      },
      size: {
        default: cn('h-12 px-6 py-2 sm:h-11', Platform.select({ web: 'has-[>svg]:px-4' })),
        sm: cn('h-9 gap-1.5 rounded-xl px-3 sm:h-8', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-14 rounded-2xl px-8 sm:h-12', Platform.select({ web: 'has-[>svg]:px-6' })),
        xl: cn('h-16 rounded-2xl px-8 sm:h-14', Platform.select({ web: 'has-[>svg]:px-6' })),
        icon: 'h-10 w-10 sm:h-9 sm:w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-base font-semibold tracking-wide',
    Platform.select({
      android: 'font-sans',
      ios: 'font-sans-ios',
      default: 'font-sans',
      web: 'pointer-events-none transition-colors',
    })
  ),
  {
    variants: {
      variant: {
        default: 'text-white',
        destructive: 'text-white',
        outline: cn(
          'text-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: 'text-sm',
        lg: 'text-lg',
        xl: 'text-xl',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    gradient?: boolean;
    gradientColors?: readonly [string, string, ...string[]];
    loading?: boolean;
    loadingText?: string;
  };

function Button({ className, variant, size, gradient, gradientColors, loading, loadingText, ...props }: ButtonProps) {
  const isFilled = !variant || variant === 'default' || variant === 'destructive';
  const spinnerColor = isFilled ? 'white' : '#E07A5F';

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn((props.disabled || loading) && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        accessibilityState={{ disabled: !!props.disabled || loading, busy: loading }}
        disabled={props.disabled || loading}
        {...props}
      >
        {(state) => (
          <>
            {gradient && (
              <LinearGradient
                colors={gradientColors || ['#E07A5F', '#CB6045']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            {loading ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator color={spinnerColor} />
                {loadingText && <Text>{loadingText}</Text>}
              </View>
            ) : typeof props.children === 'function' ? (
              props.children(state)
            ) : (
              props.children
            )}
          </>
        )}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };

