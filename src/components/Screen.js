import { View, Text, StyleSheet, RefreshControl, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { useUi } from '../context/UiContext';
import { useRef, useEffect } from 'react';

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
  const lastOffset = useRef(0);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const EXTRA_TABBAR_SPACE = Platform.OS === 'ios' ? 88 : 64; // match tab bar height

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
        const y = e.nativeEvent.contentOffset.y;
        const prev = lastOffset.current || 0;
        if (Math.abs(y - prev) > 5) {
          ui.show(3000);
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
    <View style={[styles.scrollContent, contentStyle, { flex: 1, paddingBottom: insets.bottom + EXTRA_TABBAR_SPACE }]}>{children}</View>
  );

  return (
    <SafeAreaView edges={['top','bottom']} style={styles.safe}>
      {(title || subtitle || rightAccessory) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightAccessory}
        </View>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={() => ui.toggle()}>
          {body}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textMuted,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
