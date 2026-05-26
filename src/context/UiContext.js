import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [visible, setVisible] = useState(false);
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
    <UiContext.Provider value={{ visible, show, hide, toggle }}>
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
