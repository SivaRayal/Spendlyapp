import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  // default to visible so the tab bar shows on app start
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef(null);

  const show = useCallback((ttl = 3000) => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), ttl);
  }, []);

  const hide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false);
  }, []);

  // Animated scroll value and diffClamp to detect scroll direction/magnitude.
  // `onScrollAnimated` can be used as the `onScroll` handler from screens.
  const scrollY = useRef(new Animated.Value(0));
  const clamped = useRef(Animated.diffClamp(scrollY.current, 0, 120));

  // Handler to attach to scroll events. Use native driver = false so we can
  // observe values from JS and update visibility accordingly.
  const onScrollAnimated = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY.current } } }],
    { useNativeDriver: false }
  );

  // Listen to clamped scroll changes and show/hide the UI based on movement.
  useEffect(() => {
    const id = clamped.current.addListener(({ value }) => {
      // When clamped value is near zero, user scrolled up -> show.
      // When clamped value is large, user scrolled down -> hide.
      if (value < 10) {
        // small value -> likely scrolled up or at top
        setVisible(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setVisible(false), 3000);
      } else if (value > 40) {
        // significant downward scroll -> hide immediately
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setVisible(false);
      }
    });

    return () => {
      clamped.current.removeListener(id);
    };
  }, []);

  const toggle = useCallback(() => {
    setVisible((v) => {
      const next = !v;
      if (next) {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setVisible(false), 3000);
      } else {
        if (hideTimer.current) clearTimeout(hideTimer.current);
      }
      return next;
    });
  }, []);

  return (
    <UiContext.Provider value={{ visible, show, hide, toggle, onScrollAnimated }}>
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}

export default UiContext;
