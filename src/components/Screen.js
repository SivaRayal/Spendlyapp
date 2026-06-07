import { useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useUi } from '../context/UiContext';
import { useRef } from 'react';

export default function Screen({
  title,
  subtitle,
  rightAccessory,
  children,
  scrollable = true,
  refreshing,
  onRefresh,
  contentStyle,
}) {
  const ui = useUi();
  const { colors } = useTheme();
  const lastOffset = useRef(0);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const touchStartRef = useRef(null);
  const EXTRA_TABBAR_SPACE = Platform.OS === 'ios' ? 88 : 64;

  const dynamicStyles = useMemo(() => ({
    safe: { flex: 1, backgroundColor: colors.background },
    title: { ...typography.largeTitle, color: colors.text },
    subtitle: { ...typography.subhead, color: colors.textMuted, marginTop: 4 },
  }), [colors]);

  const body = scrollable ? (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: (styles.scrollContent.paddingBottom || 0) + insets.bottom + EXTRA_TABBAR_SPACE },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
      scrollEventThrottle={16}
      onScroll={(e) => {
        if (ui.onScrollAnimated) ui.onScrollAnimated(e);
        const y = e.nativeEvent.contentOffset.y;
        const prev = lastOffset.current || 0;
        const delta = y - prev;
        if (Math.abs(delta) > 5) {
          if (delta > 0) ui.hide();
          else ui.show(3000);
        }
        lastOffset.current = y;
      }}
      refreshControl={
        onRefresh
          ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          : undefined
      }
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <View
      style={[styles.scrollContent, contentStyle, { flex: 1, paddingBottom: insets.bottom + EXTRA_TABBAR_SPACE }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => { touchStartRef.current = e.nativeEvent.pageY; }}
      onResponderRelease={(e) => {
        try {
          const start = touchStartRef.current || 0;
          const end = e.nativeEvent.pageY;
          if (end - start < -20) ui.show(3000);
        } catch {}
      }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={dynamicStyles.safe}>
      {(title || subtitle || rightAccessory) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title && <Text style={dynamicStyles.title}>{title}</Text>}
            {subtitle && <Text style={dynamicStyles.subtitle}>{subtitle}</Text>}
          </View>
          {rightAccessory}
        </View>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {scrollable ? (
          <TouchableWithoutFeedback onPress={() => ui.toggle()}>
            {body}
          </TouchableWithoutFeedback>
        ) : (
          body
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
