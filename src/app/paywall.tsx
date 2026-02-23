import useLocale from '@/hooks/useLocale';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import Aptabase from "@aptabase/react-native";
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Check, CheckCircle, Lock, Star, X, XCircle } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Switch, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaywallModal() {
  const { t } = useLocale('component.paywall');
  const { t: tCommon } = useLocale('common');
  const { offerings, selectedPackage, setSelectedPackage, purchasePackage, restorePurchases, loading, purchasing } = useSubscriptions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [error, setError] = React.useState<string | null>(null);
  const [freeTrialEnabled, setFreeTrialEnabled] = React.useState(false);
  const [view, setView] = React.useState<'plans' | 'timeline'>('plans');
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [showErrorDialog, setShowErrorDialog] = React.useState(false);
  const [dialogMessage, setDialogMessage] = React.useState('');

  const [isRestoring, setIsRestoring] = React.useState(false);

  React.useEffect(() => {
    Aptabase.trackEvent("paywall_opened");
    analytics.startPaywallViewTimer();

    // Track first paywall visit
    analytics.trackFirstPaywallVisit();
  }, []);

  const handleClose = () => {
    Aptabase.trackEvent("paywall_closed");
    analytics.endPaywallView();
    router.back();
  };

  const handlePurchase = React.useCallback(async () => {
    if (!selectedPackage) return;

    const { isMonthly, period } = getPackageData(selectedPackage);
    const withTrial = (isMonthly || period === 'week') && freeTrialEnabled;

    Aptabase.trackEvent("purchase_initiated", {
      package: selectedPackage.identifier,
      with_trial: withTrial
    });

    setError(null);
    const result = await purchasePackage(selectedPackage, withTrial);

    if (result.success) {
      Aptabase.trackEvent("purchase_completed", { package: selectedPackage.identifier });
      setShowSuccessDialog(true);
    } else if (result.cancelled) {
      Aptabase.trackEvent("purchase_cancelled");
      // User cancelled, do nothing
    } else if (result.error) {
      Aptabase.trackEvent("purchase_failed", { error: result.error });
      setDialogMessage(result.error);
      setShowErrorDialog(true);
    }
  }, [selectedPackage, purchasePackage, freeTrialEnabled]);

  const handleRestore = React.useCallback(async () => {
    Aptabase.trackEvent("restore_initiated");
    setIsRestoring(true);
    setError(null);
    try {
      const result = await restorePurchases();

      if (result.success) {
        Aptabase.trackEvent("restore_completed");
        setShowSuccessDialog(true);
      } else if (result.error) {
        Aptabase.trackEvent("restore_failed");
        setDialogMessage(result.error);
        setShowErrorDialog(true);
      }
    } finally {
      setIsRestoring(false);
    }
  }, [restorePurchases]);

  const handleSuccessClose = React.useCallback(() => {
    setShowSuccessDialog(false);
    router.back();
  }, [router]);

  // Tier selection state
  const [selectedTier, setSelectedTier] = React.useState<'basic' | 'pro'>('basic');

  // Get offering based on selected tier
  const currentOffering = React.useMemo(() => {
    if (selectedTier === 'pro') {
      return offerings.find((o: any) => o.identifier === 'pro') ||
        offerings.find((o: any) => o.identifier?.toLowerCase().includes('pro'));
    }
    return offerings.find((o: any) => o.identifier === 'basic') ||
      offerings.find((o: any) => o.identifier === 'default') ||
      offerings[0];
  }, [offerings, selectedTier]);

  // Get the monthly package for timeline view
  const monthlyPackage = React.useMemo(() => {
    return currentOffering?.availablePackages?.find((pkg: any) => {
      const identifier = pkg.product?.identifier?.toLowerCase() || '';
      return identifier.includes('monthly') || identifier.includes('month');
    });
  }, [currentOffering]);

  // Update selected package when tier changes
  React.useEffect(() => {
    if (currentOffering?.availablePackages && currentOffering.availablePackages.length > 0) {
      // Prefer monthly package
      const monthlyPkg = currentOffering.availablePackages.find((pkg: any) => {
        const identifier = pkg.product?.identifier?.toLowerCase() || '';
        return identifier.includes('monthly') || identifier.includes('month');
      });
      setSelectedPackage(monthlyPkg || currentOffering.availablePackages[0]);
    }
  }, [currentOffering, setSelectedPackage]);

  // Features based on selected tier
  const tierFeatures = React.useMemo(() => {
    if (selectedTier === 'pro') {
      return [
        { label: t('features.unlimitedAnalysis'), highlight: false },
        { label: t('features.personalizedTips'), highlight: false },
        { label: t('features.smartInsights'), highlight: false },
        { label: t('features.aiGeneration') || 'AI Outfit Enhancement', highlight: true },
      ];
    }
    return [
      { label: t('features.unlimitedAnalysis'), highlight: false },
      { label: t('features.personalizedTips'), highlight: false },
      { label: t('features.smartInsights'), highlight: false },
    ];
  }, [selectedTier, t]);

  // Calculate trial end date (3 days from now)
  const trialEndDate = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  const getPackageData = (pkg: any) => {
    if (!pkg?.product?.identifier) return { isYearly: false, isMonthly: false, period: 'week', monthlyPrice: null };

    const identifier = pkg.product.identifier.toLowerCase();
    const isYearly = identifier.includes('yearly') || identifier.includes('annual');
    const isMonthly = identifier.includes('monthly') || identifier.includes('month');

    let period = 'week';
    if (isYearly) period = 'year';
    else if (isMonthly) period = 'month';
    else if (identifier.includes('week')) period = 'week';

    // Calculate monthly equivalent for yearly
    // NOTE: react-native-purchases typically provides price / priceString. 
    // We'll approximate from the raw price if available.
    const price = pkg.product.price || 0;
    const monthlyPrice = isYearly && price > 0 ? (price / 12).toFixed(2) : null;

    return { isYearly, isMonthly, period, monthlyPrice };
  };
  return (
    <View className="flex-1 bg-white">
      <Button
        onPress={handleClose}
        size="icon"
        className={cn("absolute right-5 top-5 z-50 bg-black/10 rounded-full", Platform.OS === 'android' ? 'mt-3' : '')}
        accessibilityLabel={tCommon('actions.close')}
        accessibilityHint="Closes the paywall screen"
      >
        <View pointerEvents="none">
          <X size={24} className="text-black" />
        </View>
      </Button>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View className="absolute top-0 left-0 right-0 h-[55%] z-0">
          <Image
            source={require('../assets/images/paywall_header.jpg')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={view === 'timeline'
              ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#ffffff', '#ffffff']
              : ['transparent', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', '#ffffff']}
            locations={view === 'timeline'
              ? [0, 0.35, 0.6, 1]
              : [0, 0.6, 0.9, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' }}
          />
        </View>
        <View className="px-6 pb-6 pt-20">
          {view === 'plans' ? (
            <>
              {/* Tier Selector Tabs */}
              <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-6">
                <Pressable
                  onPress={() => {
                    setSelectedTier('basic');
                    Aptabase.trackEvent("tier_selected", { tier: 'basic' });
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl items-center justify-center",
                    selectedTier === 'basic' ? "bg-white shadow-sm" : "bg-transparent"
                  )}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedTier === 'basic' }}
                  accessibilityLabel={t('tabs.basic')}
                >
                  <Text className={cn(
                    "font-bold text-sm",
                    selectedTier === 'basic' ? "text-black" : "text-gray-500"
                  )}>
                    {t('tabs.basic') || 'Basic'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectedTier('pro');
                    Aptabase.trackEvent("tier_selected", { tier: 'pro' });
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl items-center justify-center flex-row gap-1.5",
                    selectedTier === 'pro' ? "bg-white shadow-sm" : "bg-transparent"
                  )}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedTier === 'pro' }}
                  accessibilityLabel={t('tabs.pro')}
                >
                  <Star size={14} color={selectedTier === 'pro' ? '#F4A261' : '#9ca3af'} fill={selectedTier === 'pro' ? '#F4A261' : 'none'} />
                  <Text className={cn(
                    "font-bold text-sm",
                    selectedTier === 'pro' ? "text-black" : "text-gray-500"
                  )}>
                    {t('tabs.pro') || 'Pro'}
                  </Text>
                </Pressable>
              </View>

              {/* Main Title */}
              <Text className="text-3xl font-extrabold text-center text-black mb-4 leading-9 tracking-tight px-10">
                {selectedTier === 'pro' ? (t('labels.proTitle') || 'Unlock Pro') : t('labels.title')}
              </Text>

              {/* Feature List */}
              <View className="mb-8 px-2">
                <Text className="text-lg font-bold text-center text-gray-900 mb-1 mt-6">
                  {t('labels.features')}
                </Text>

                <View className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 gap-4 shadow-sm shadow-gray-100">
                  {tierFeatures.map((feature, i) => (
                    <View key={i} className="flex-row items-center gap-3.5">
                      <View className={cn(
                        "p-1.5 rounded-full",
                        feature.highlight ? "bg-[#E07A5F]" : "bg-[#FFF5E6]"
                      )}>
                        <Check
                          size={14}
                          color={feature.highlight ? "white" : "#E07A5F"}
                          strokeWidth={3}
                        />
                      </View>
                      <Text className={cn(
                        "text-gray-800 text-[15px] flex-1",
                        feature.highlight ? "font-bold text-[#E07A5F]" : "font-medium"
                      )}>
                        {feature.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Trial Toggle Box */}
              <View className="bg-cyan-600/10 rounded-2xl p-3 px-4 flex-row items-center justify-between mb-4 border border-cyan-600/20">
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <Text className="font-semibold text-sm text-black">
                    {freeTrialEnabled ? t('labels.freeTrialEnabled') : t('labels.freeTrialDisabled')}
                  </Text>
                </View>
                <Switch
                  value={freeTrialEnabled}
                  onValueChange={(val) => {
                    setFreeTrialEnabled(val);
                    Aptabase.trackEvent("free_trial_toggled", { enabled: val });
                  }}
                  trackColor={{ false: '#e2e8f0', true: '#06b6d4' }}
                  thumbColor={'white'}
                  ios_backgroundColor="#e2e8f0"
                  accessibilityLabel={t('labels.freeTrialEnabled')}
                />
              </View>

              {freeTrialEnabled && (
                <View className="flex-row justify-center mb-4 px-4 items-center gap-1.5">
                  <View className="bg-green-500/20 p-0.5 rounded-full">
                    <Check size={10} className="text-green-600" strokeWidth={3} />
                  </View>
                  <Text className="text-xs text-gray-500 font-medium">
                    {t('labels.trialNotification')}
                  </Text>
                </View>
              )}

              {/* Subscription Options - Compact List */}
              <View className="gap-4 mb-6">
                {currentOffering?.availablePackages.map((pkg: any) => {
                  const { isYearly, isMonthly, monthlyPrice, period } = getPackageData(pkg);
                  const isSelected = selectedPackage?.identifier === pkg.identifier;
                  const hasTrial = (isMonthly || period === 'week') && freeTrialEnabled;

                  const periodLabel = period === 'year' ? t('labels.yearly') : (period === 'month' ? t('labels.monthly') : t('labels.weekly'));
                  const priceLabel = pkg.product.priceString;

                  return (
                    <View key={pkg.identifier} className="relative">
                      {hasTrial && freeTrialEnabled && (
                        <View className="absolute -top-2.5 right-4 z-10 bg-cyan-600 px-3 py-1 rounded-full shadow-sm">
                          <Text className="text-white text-[10px] font-extrabold uppercase tracking-wide">
                            {t('labels.threeDayFreeTrial')}
                          </Text>
                        </View>
                      )}

                      <Pressable
                        onPress={() => {
                          setSelectedPackage(pkg);
                          Aptabase.trackEvent("package_selected", {
                            package: pkg.identifier,
                            period: period
                          });
                        }}
                        className={cn(
                          "flex-row items-center justify-between p-4 pt-5 rounded-2xl border bg-white shadow-sm transition-all",
                          isSelected ? "border-[#E07A5F] border-[1.5px]" : "border-gray-100"
                        )}
                        style={isSelected ? { elevation: 2 } : {}}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`${periodLabel}, ${priceLabel}`}
                      >
                        <View className="flex-row items-center gap-3 flex-1">
                          <View className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center",
                            isSelected ? "border-[#E07A5F] bg-[#E07A5F]" : "border-gray-300 bg-transparent"
                          )}>
                            {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                          </View>

                          <View>
                            <Text className="font-bold text-base capitalize text-black">
                              {periodLabel}
                            </Text>
                            {isYearly ? (
                              <Text className="text-gray-500 text-xs font-medium">
                                {pkg.product.priceString} {t('labels.perYear')}
                              </Text>
                            ) : (
                              <Text className="text-gray-500 text-xs font-medium">
                                {pkg.product.priceString} / {period}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View className="items-end">
                          {isYearly && monthlyPrice ? (
                            <Text className="font-bold text-base text-black">${monthlyPrice}/mo</Text>
                          ) : (
                            <Text className="font-bold text-base text-black">{pkg.product.priceString}</Text>
                          )}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {/* Continue Button */}
              <Button
                onPress={handlePurchase}
                disabled={!selectedPackage}
                loading={purchasing}
                className="w-full h-12 rounded-2xl bg-[#E07A5F] shadow-md shadow-orange-200 active:scale-95 transition-transform"
              >
                <Text className="font-bold text-white text-base">
                  {(() => {
                    const selectedData = selectedPackage ? getPackageData(selectedPackage) : null;
                    const selectedHasTrial = (selectedData?.isMonthly || selectedData?.period === 'week') && freeTrialEnabled;
                    return selectedHasTrial ? t('actions.startFreeTrial') : t('actions.continue');
                  })()}
                </Text>
              </Button>
              {(() => {
                const selectedData = selectedPackage ? getPackageData(selectedPackage) : null;
                const selectedHasTrial = (selectedData?.isMonthly || selectedData?.period === 'week') && freeTrialEnabled;
                return selectedHasTrial ? (
                  <Text className="text-center text-gray-400 text-xs mt-2 font-medium">
                    {t('labels.noPaymentNow')}
                  </Text>
                ) : null;
              })()}

              {/* How trial works link - always show when trial is enabled */}
              {freeTrialEnabled && (
                <Pressable
                  onPress={() => {
                    Aptabase.trackEvent("view_timeline_clicked");
                    setView('timeline');
                  }}
                  className="mt-4"
                  accessibilityRole="button"
                  accessibilityLabel={t('actions.howTrialWorks')}
                  accessibilityHint="Shows the timeline of the free trial"
                  hitSlop={20}
                >
                  <Text className="text-center text-[#E07A5F] font-semibold text-sm">
                    {t('actions.howTrialWorks')}
                  </Text>
                </Pressable>
              )}

              {/* Footer */}
              <View className="flex-row justify-center gap-6 mt-6 opacity-60">
                <Pressable
                  onPress={handleRestore}
                  accessibilityRole="button"
                  accessibilityLabel={t('actions.restorePurchases')}
                  hitSlop={20}
                >
                  <Text className="text-xs text-gray-500 font-medium">{t('actions.restorePurchases')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL('https://outfitanalyse.com/terms')}
                  accessibilityRole="button"
                  accessibilityLabel={t('labels.terms')}
                  hitSlop={20}
                >
                  <Text className="text-xs text-gray-500 font-medium">{t('labels.terms')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL('https://outfitanalyse.com/privacy')}
                  accessibilityRole="button"
                  accessibilityLabel={t('labels.privacy')}
                  hitSlop={20}
                >
                  <Text className="text-xs text-gray-500 font-medium">{t('labels.privacy')}</Text>
                </Pressable>
              </View>

              {error && <Text className="text-red-500 text-center mt-4 text-xs font-medium">{error}</Text>}
            </>
          ) : (() => {
            /* Timeline View - Show trial timeline for both Monthly and Weekly when trial enabled */
            const selectedData = selectedPackage ? getPackageData(selectedPackage) : null;
            const isMonthly = selectedData?.isMonthly;
            const isWeekly = selectedData?.period === 'week';
            const showTrialTimeline = freeTrialEnabled && (isMonthly || isWeekly);

            return showTrialTimeline ? (
              /* MONTHLY TIMELINE - With Free Trial */
              <>
                {/* Title */}
                <Text className="text-2xl font-extrabold text-center text-black mb-2 leading-8 tracking-tight px-10">
                  {t('timeline.title')}
                </Text>

                {/* Subtitle */}
                <Text className="text-base text-center text-gray-600 mb-8 leading-6">
                  {t('timeline.subtitle')}{' '}
                  <Text className="text-cyan-600 font-semibold">{t('timeline.subtitleHighlight')}</Text>
                  {t('timeline.subtitleEnd')}
                </Text>

                {/* Timeline */}
                <View className="mb-8">
                  {/* Timeline Item 1 - Install */}
                  <View className="flex-row">
                    <View className="items-center mr-4">
                      <View className="w-10 h-10 rounded-full bg-black items-center justify-center">
                        <Check size={20} color="white" strokeWidth={3} />
                      </View>
                      <View className="w-0.5 flex-1 bg-gray-200 my-2" />
                    </View>
                    <View className="flex-1 pb-6">
                      <Text className="font-bold text-base text-black">{t('timeline.install.title')}</Text>
                      <Text className="text-gray-500 text-sm mt-1">{t('timeline.install.description')}</Text>
                    </View>
                  </View>

                  {/* Timeline Item 2 - Access */}
                  <View className="flex-row">
                    <View className="items-center mr-4">
                      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                        <Lock size={18} color="#374151" />
                      </View>
                      <View className="w-0.5 flex-1 bg-gray-200 my-2" />
                    </View>
                    <View className="flex-1 pb-6">
                      <Text className="font-bold text-base text-black">
                        <Text className="text-gray-500 font-normal">{t('timeline.access.day')}</Text> {t('timeline.access.title')}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1">{t('timeline.access.description')}</Text>
                    </View>
                  </View>

                  {/* Timeline Item 3 - Reminder */}
                  <View className="flex-row">
                    <View className="items-center mr-4">
                      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                        <Bell size={18} color="#374151" />
                      </View>
                      <View className="w-0.5 flex-1 bg-gray-200 my-2" />
                    </View>
                    <View className="flex-1 pb-6">
                      <Text className="font-bold text-base text-black">
                        <Text className="text-gray-500 font-normal">{t('timeline.reminder.day')}</Text> {t('timeline.reminder.title')}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1">{t('timeline.reminder.description')}</Text>
                    </View>
                  </View>

                  {/* Timeline Item 4 - Ends */}
                  <View className="flex-row">
                    <View className="items-center mr-4">
                      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                        <Star size={18} color="#374151" />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-base text-black">
                        <Text className="text-gray-500 font-normal">{t('timeline.ends.day')}</Text> {t('timeline.ends.title')}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1">
                        {t('timeline.ends.description', { date: trialEndDate })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price Info */}
                <View className="items-center mb-6">
                  <Text className="text-gray-500 text-sm">{t('timeline.priceInfo')}</Text>
                  <Text className="text-xl font-bold text-black">
                    {selectedPackage?.product?.priceString || '$4.99'}{selectedData?.period === 'month' ? t('labels.perMonth') : t('labels.perWeek')}
                  </Text>
                </View>

                {/* Continue Button */}
                <Button
                  onPress={handlePurchase}
                  disabled={!selectedPackage}
                  loading={purchasing}
                  className="w-full h-12 rounded-2xl bg-[#E07A5F] shadow-md shadow-orange-200 active:scale-95 transition-transform"
                >
                  <Text className="font-bold text-white text-base">
                    {freeTrialEnabled ? t('actions.startFreeTrial') : t('actions.continue')}
                  </Text>
                </Button>
                {freeTrialEnabled && (
                  <Text className="text-center text-gray-400 text-xs mt-2 font-medium">
                    {t('labels.noPaymentNow')}
                  </Text>
                )}

                {/* View All Plans link */}
                <Pressable
                  onPress={() => setView('plans')}
                  className="mt-4"
                  accessibilityRole="button"
                  accessibilityLabel={t('actions.viewAllPlans')}
                  hitSlop={20}
                >
                  <Text className="text-center text-[#E07A5F] font-semibold text-sm">
                    {t('actions.viewAllPlans')}
                  </Text>
                </Pressable>

                {/* Footer */}
                <View className="flex-row justify-center gap-6 mt-6 opacity-60">
                  <Pressable
                    onPress={handleRestore}
                    accessibilityRole="button"
                    accessibilityLabel={t('actions.restorePurchases')}
                    hitSlop={20}
                  >
                    <Text className="text-xs text-gray-500 font-medium">{t('actions.restorePurchases')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL('https://outfitanalyse.com/terms')}
                    accessibilityRole="button"
                    accessibilityLabel={t('labels.terms')}
                    hitSlop={20}
                  >
                    <Text className="text-xs text-gray-500 font-medium">{t('labels.terms')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL('https://outfitanalyse.com/privacy')}
                    accessibilityRole="button"
                    accessibilityLabel={t('labels.privacy')}
                    hitSlop={20}
                  >
                    <Text className="text-xs text-gray-500 font-medium">{t('labels.privacy')}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              /* MONTHLY/WEEKLY/YEARLY TIMELINE - No Trial, Simple */
              <>
                {/* Title */}
                <Text className="text-2xl font-extrabold text-center text-black mb-4 leading-8 tracking-tight">
                  {selectedData?.period === 'week' ? (t('timeline.weekly.title') || 'Start Immediately') :
                    selectedData?.period === 'month' ? (t('timeline.monthly.title') || 'Start Immediately') :
                      (t('timeline.title'))}
                </Text>

                {/* Subtitle */}
                <Text className="text-base text-center text-gray-600 mb-8 leading-6">
                  {selectedData?.period === 'week'
                    ? (t('timeline.weekly.subtitle') || 'Get instant access to all premium features. Your subscription starts right away.')
                    : selectedData?.period === 'month'
                      ? (t('timeline.monthly.subtitle') || 'Get instant access to all premium features. Your subscription starts right away.')
                      : t('timeline.subtitle')}
                </Text>

                {/* Trial Promo for Weekly users */}
                {selectedData?.period === 'week' && monthlyPackage && (
                  <View className="bg-[#FFF5E6] border border-[#E07A5F]/20 rounded-xl p-3 mb-6">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-[#9A3412] font-semibold text-xs mb-0.5">
                          {t('timeline.weekly.trialNote') || 'Want a free trial?'}
                        </Text>
                        <Text className="text-[#E07A5F] text-[11px] leading-4">
                          {t('timeline.weekly.trialDescription') || 'Switch to monthly plan to get 3 days free.'}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          setSelectedPackage(monthlyPackage);
                          setFreeTrialEnabled(true);
                          Aptabase.trackEvent("free_trial_toggled", { enabled: true });
                          Aptabase.trackEvent("package_selected", {
                            package: monthlyPackage.identifier,
                            period: 'month'
                          });
                        }}
                        className="bg-primary px-3 py-1.5 rounded-lg active:opacity-80"
                        accessibilityRole="button"
                        accessibilityLabel={t('timeline.weekly.switchButton') || 'Switch & Try'}
                        accessibilityHint="Switch to monthly plan with free trial"
                      >
                        <Text className="text-white text-xs font-bold">
                          {t('timeline.weekly.switchButton') || 'Switch & Try'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Simple Feature List */}
                <View className="mb-8 bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                  <View className="flex-row items-center gap-3.5 mb-4">
                    <View className="p-1.5 rounded-full bg-[#FFF5E6]">
                      <Check size={14} color="#E07A5F" strokeWidth={3} />
                    </View>
                    <Text className="text-gray-800 text-[15px] flex-1 font-medium">
                      {t('features.unlimitedAnalysis')}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3.5 mb-4">
                    <View className="p-1.5 rounded-full bg-[#FFF5E6]">
                      <Check size={14} color="#E07A5F" strokeWidth={3} />
                    </View>
                    <Text className="text-gray-800 text-[15px] flex-1 font-medium">
                      {t('features.personalizedTips')}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3.5">
                    <View className="p-1.5 rounded-full bg-[#FFF5E6]">
                      <Check size={14} color="#E07A5F" strokeWidth={3} />
                    </View>
                    <Text className="text-gray-800 text-[15px] flex-1 font-medium">
                      {t('features.smartInsights')}
                    </Text>
                  </View>
                </View>

                {/* Price Info */}
                <View className="items-center mb-6">
                  <Text className="text-xl font-bold text-black">
                    {selectedPackage?.product?.priceString || '$2.99'}
                    {selectedData?.period === 'year' ? t('labels.perYear') :
                      selectedData?.period === 'month' ? t('labels.perMonth') :
                        t('labels.perWeek')}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {t('timeline.weekly.startsNow') || 'Starts immediately'}
                  </Text>
                </View>

                {/* Continue Button */}
                <Button
                  onPress={handlePurchase}
                  disabled={!selectedPackage}
                  loading={purchasing}
                  className="w-full h-12 rounded-2xl bg-[#E07A5F] shadow-md shadow-orange-200 active:scale-95 transition-transform"
                >
                  <Text className="font-bold text-white text-base">{t('actions.continue')}</Text>
                </Button>

                {/* View All Plans link */}
                <Pressable
                  onPress={() => setView('plans')}
                  className="mt-4"
                  accessibilityRole="button"
                  accessibilityLabel={t('actions.viewAllPlans')}
                  hitSlop={20}
                >
                  <Text className="text-center text-[#E07A5F] font-semibold text-sm">
                    {t('actions.viewAllPlans')}
                  </Text>
                </Pressable>

                {/* Footer */}
                <View className="flex-row justify-center gap-6 mt-6 opacity-60">
                  <Pressable
                    onPress={handleRestore}
                    accessibilityRole="button"
                    accessibilityLabel={t('actions.restorePurchases')}
                    hitSlop={20}
                  >
                    <Text className="text-xs text-gray-500 font-medium">{t('actions.restorePurchases')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL('https://outfitanalyse.com/terms')}
                    accessibilityRole="button"
                    accessibilityLabel={t('labels.terms')}
                    hitSlop={20}
                  >
                    <Text className="text-xs text-gray-500 font-medium">{t('labels.terms')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL('https://outfitanalyse.com/privacy')}
                    accessibilityRole="button"
                    accessibilityLabel={t('labels.privacy')}
                    hitSlop={20}
                  >
                    <Text className="text-xs text-gray-500 font-medium">{t('labels.privacy')}</Text>
                  </Pressable>
                </View>
              </>
            );
          })()}
        </View>
      </ScrollView >

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <View className="items-center mb-2">
              <CheckCircle size={48} color="#22c55e" />
            </View>
            <DialogTitle className="text-center">{t('success.title') || 'Welcome!'}</DialogTitle>
            <DialogDescription className="text-center">
              {t('success.message') || 'Your subscription is now active. Enjoy unlimited outfit analyses!'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onPress={handleSuccessClose}
              className="bg-green-500 w-full rounded-full"
            >
              <Text className="text-white font-semibold">{t('success.continue') || 'Continue'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <View className="items-center mb-2">
              <XCircle size={48} color="#ef4444" />
            </View>
            <DialogTitle className="text-center">{t('errors.title') || 'Something went wrong'}</DialogTitle>
            <DialogDescription className="text-center">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onPress={() => setShowErrorDialog(false)}
              className="bg-gray-800 w-full rounded-full"
            >
              <Text className="text-white font-semibold">{t('errors.tryAgain') || 'Try Again'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay for Restore */}
      {isRestoring && (
        <View
          className="absolute inset-0 z-50 bg-black/50 items-center justify-center backdrop-blur-sm"
          accessibilityViewIsModal
          accessibilityLiveRegion="polite"
          accessibilityLabel={t('actions.restoring') || 'Restoring purchases...'}
        >
          <View className="bg-white p-6 rounded-2xl items-center shadow-xl">
            <ActivityIndicator size="large" color="#E07A5F" />
            <Text className="mt-4 font-semibold text-gray-800">
              {t('actions.restoring') || 'Restoring purchases...'}
            </Text>
          </View>
        </View>
      )}
    </View >
  );
}
