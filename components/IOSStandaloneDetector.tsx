'use client';

import { useEffect } from 'react';

export default function IOSStandaloneDetector() {
  useEffect(() => {
    const ua = window.navigator.userAgent || '';
    const isiOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone) || window.matchMedia('(display-mode: standalone)').matches;

    document.documentElement.classList.toggle('iosDevice', isiOS);
    document.body.classList.toggle('iosDevice', isiOS);
    document.documentElement.classList.toggle('iosStandalone', isiOS && standalone);
    document.body.classList.toggle('iosStandalone', isiOS && standalone);

    const viewport = window.visualViewport;
    const updateViewport = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
    };

    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      viewport?.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return null;
}
