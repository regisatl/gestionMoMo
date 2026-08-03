/**
 * Loader.js — GestionMoMo Mobile
 *
 * Animation "réseau MoMo" adaptée React Native :
 *  - Logo central qui pulse avec halo
 *  - 3 anneaux concentriques qui se propagent vers l'extérieur
 *  - 4 nœuds satellites qui orbitent autour du centre
 *  - Texte avec points de chargement animés
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, Easing, StyleSheet, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

// ─── Constantes ──────────────────────────────────────────────────────────────
const CENTER = 70;   // demi-largeur du conteneur
const ORBIT_R = 52;  // rayon d'orbite des nœuds

// Position X/Y d'un nœud à l'angle `deg` sur un cercle de rayon R
const nodePos = (deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: CENTER + ORBIT_R * Math.cos(rad) - 6,
    y: CENTER + ORBIT_R * Math.sin(rad) - 6,
  };
};

// ─── Onde concentrique ───────────────────────────────────────────────────────
const Wave = ({ delay, color }) => {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.4,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[
      styles.wave,
      { borderColor: color, opacity, transform: [{ scale }] },
    ]} />
  );
};

// ─── Nœud satellite ──────────────────────────────────────────────────────────
const OrbitNode = ({ angle, delay, color }) => {
  const rotate = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3000,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotScale, { toValue: 1.4, duration: 500, useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    return () => { rotate.stopAnimation(); dotScale.stopAnimation(); };
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[
      styles.orbitWrapper,
      { transform: [{ rotate: spin }] },
    ]}>
      <Animated.View style={[
        styles.orbitNode,
        {
          backgroundColor: color,
          transform: [
            { translateX: ORBIT_R },
            { rotate: spin.interpolate({ inputRange: ['0deg', '360deg'], outputRange: ['0deg', '-360deg'] }) },
            { scale: dotScale },
          ],
          shadowColor: color,
        },
      ]} />
    </Animated.View>
  );
};

// ─── Logo central ─────────────────────────────────────────────────────────────
const CenterLogo = ({ isDark }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
    return () => { pulse.stopAnimation(); glow.stopAnimation(); };
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });

  return (
    <View style={styles.logoOuter}>
      {/* Halo pulsant */}
      <Animated.View style={[styles.logoHalo, { opacity: glowOpacity }]} />
      {/* Carré arrondi gradient simulé */}
      <Animated.View style={[styles.logoBox, { transform: [{ scale: pulse }] }]}>
        {/* Lettre M en SVG-like avec View */}
        <View style={styles.mContainer}>
          {/* Jambe gauche */}
          <View style={[styles.mLeg, { left: 4 }]} />
          {/* Diagonale gauche */}
          <View style={[styles.mDiag, styles.mDiagLeft]} />
          {/* Diagonale droite */}
          <View style={[styles.mDiag, styles.mDiagRight]} />
          {/* Jambe droite */}
          <View style={[styles.mLeg, { right: 4 }]} />
        </View>
        {/* Point bleu clair */}
        <View style={styles.mDot}>
          <View style={styles.mDotInner} />
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Points de chargement ────────────────────────────────────────────────────
const LoadingDots = ({ color }) => {
  const dots = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(d, { toValue: 1.6, duration: 400, useNativeDriver: true }),
          Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.delay((3 - i) * 200),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.dotsRow}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { backgroundColor: color, transform: [{ scale: d }] }]}
        />
      ))}
    </View>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * @param {string}  [message]    Clé i18n loader.xxx OU texte libre. Si absent → loader.default.
 * @param {boolean} [fullscreen] Prend tout l'écran si true (défaut: true)
 * @param {object}  [style]      Styles supplémentaires
 */
const Loader = ({ message, fullscreen = true, style }) => {
  const { t } = useTranslation();
  const theme  = useTheme();

  // Résolution du message : clé i18n ou texte libre
  const label = message
    ? (message.startsWith('loader.') ? t(message) : message)
    : t('loader.default');

  const primary = theme.colors?.primary || '#0A66C2';
  const accent  = '#60B4FF';

  return (
    <View style={[
      fullscreen ? styles.fullscreen : styles.inline,
      { backgroundColor: fullscreen ? theme.background : 'transparent' },
      style,
    ]}>
      {/* Zone animation */}
      <View style={styles.animBox}>
        {/* Ondes */}
        <Wave delay={0}    color={primary} />
        <Wave delay={650}  color={accent}  />
        <Wave delay={1300} color={primary} />

        {/* Nœuds orbitants */}
        <OrbitNode angle={0}   delay={0}    color={accent}  />
        <OrbitNode angle={90}  delay={750}  color={primary} />
        <OrbitNode angle={180} delay={1500} color={accent}  />
        <OrbitNode angle={270} delay={2250} color={primary} />

        {/* Logo central */}
        <CenterLogo isDark={theme.isDark} />
      </View>

      {/* Texte */}
      <View style={styles.textBox}>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.typography?.fontFamily?.extraBold }]}>
          GestionMoMo
        </Text>
        {label ? (
          <Text style={[styles.message, { color: theme.textSecondary, fontFamily: theme.typography?.fontFamily?.regular }]}>
            {label}
          </Text>
        ) : null}
        <LoadingDots color={primary} />
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  animBox: {
    width: CENTER * 2,
    height: CENTER * 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
  },
  orbitWrapper: {
    position: 'absolute',
    width: CENTER * 2,
    height: CENTER * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitNode: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  logoOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHalo: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#0A66C2',
  },
  logoBox: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#0A66C2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14 },
      android: { elevation: 10 },
    }),
  },
  mContainer: {
    width: 34,
    height: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  mLeg: {
    position: 'absolute',
    bottom: 0,
    width: 3.5,
    height: 22,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  mDiag: {
    position: 'absolute',
    width: 3.5,
    height: 16,
    backgroundColor: 'white',
    borderRadius: 2,
    bottom: 6,
  },
  mDiagLeft: {
    left: 7,
    transform: [{ rotate: '30deg' }],
  },
  mDiagRight: {
    right: 7,
    transform: [{ rotate: '-30deg' }],
  },
  mDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#60B4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  textBox: {
    marginTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 12,
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

export default Loader;
