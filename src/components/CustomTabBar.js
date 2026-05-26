import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, TouchableWithoutFeedback, Platform } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useUi } from '../context/UiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export default function CustomTabBar(props) {
  const { visible } = useUi();
  const trans = useRef(new Animated.Value(0)).current; // 0 visible, 1 hidden
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

  useEffect(() => {
    Animated.timing(trans, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, trans]);

  const translateY = trans.interpolate({ inputRange: [0, 1], outputRange: [0, TAB_BAR_HEIGHT + insets.bottom + 12] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { transform: [{ translateY }], bottom: 0 },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableWithoutFeedback onPress={() => { /* allow parent toggle via Screen */ }}>
        <View style={[styles.inner, { paddingBottom: insets.bottom, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderTopWidth: 0.5, borderTopColor: colors.separator }]}>
          <BottomTabBar {...props} />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
    elevation: 6,
  },
  inner: {
    backgroundColor: 'transparent',
  },
});
