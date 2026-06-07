import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useUi } from '../context/UiContext';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

export default function CustomTabBar(props) {
  const { visible } = useUi();
  const { colors } = useTheme();
  const trans = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

  useEffect(() => {
    const anim = Animated.timing(trans, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [visible, trans]);

  const translateY = trans.interpolate({ inputRange: [0, 1], outputRange: [0, TAB_BAR_HEIGHT + insets.bottom + 12] });

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }], bottom: 0 }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={[
        styles.inner,
        {
          paddingBottom: insets.bottom,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.card,
          borderTopWidth: 0.5,
          borderTopColor: colors.separator,
        },
      ]}>
        <BottomTabBar {...props} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 6,
    zIndex: 20,
  },
  inner: { backgroundColor: 'transparent' },
});
