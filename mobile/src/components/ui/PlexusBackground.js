/**
 * PlexusBackground
 *
 * Animated network / plexus illustration rendered with react-native-svg.
 * Design specs:
 *   - Light mode  → dark nodes & lines  (like the screenshot — dark on white)
 *   - Dark mode   → light nodes & lines (inverted — light on dark)
 *   - Nodes drift slowly with looping Animated values
 *   - Displayed as an absolute-positioned layer behind content, partial opacity
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ── Configuration ─────────────────────────────────────── */
const NODE_COUNT      = 38;   // number of nodes
const CONNECTION_DIST = 140;  // max distance (px) to draw a line between two nodes
const NODE_DRIFT      = 18;   // max drift per node (px)
const ANIM_DURATION   = 4500; // ms per drift cycle

/* Seeded pseudo-random to keep the same layout across renders */
function mulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Build a static list of nodes (positions, sizes) once */
function buildNodes(seed = 42) {
  const rand = mulberry32(seed);
  return Array.from({ length: NODE_COUNT }, (_, i) => ({
    id: i,
    /* Bias towards the right half to mimic the screenshot */
    x: 0.3 * SCREEN_W + rand() * SCREEN_W * 0.72,
    y: rand() * SCREEN_H,
    r: 2 + rand() * 4.5,
    /* Each node gets its own random drift direction and speed factor */
    driftX: (rand() - 0.5) * 2 * NODE_DRIFT,
    driftY: (rand() - 0.5) * 2 * NODE_DRIFT,
    delay: rand() * 2000,
  }));
}

const STATIC_NODES = buildNodes();

/* ── AnimatedNode ───────────────────────────────────────── */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine   = Animated.createAnimatedComponent(Line);

/* ── Main component ─────────────────────────────────────── */
const PlexusBackground = ({ style }) => {
  const theme = useTheme();

  /* In light mode the illustration is dark (like the screenshot).
     In dark mode we invert to a light illustration on the dark background. */
  const nodeColor = theme.isDark
    ? 'rgba(255, 255, 255, 0.30)'   // light nodes in dark mode
    : 'rgba(30,  30,  30,  0.22)';  // dark nodes in light mode

  const lineColor = theme.isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(20,  20,  20,  0.10)';

  /* One Animated.Value per node (0 → 1, looping) */
  const animValues = useRef(
    STATIC_NODES.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const anims = STATIC_NODES.map((node, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(node.delay),
          Animated.timing(animValues[i], {
            toValue: 1,
            duration: ANIM_DURATION + i * 120,
            useNativeDriver: false, // SVG attributes don't support native driver
          }),
          Animated.timing(animValues[i], {
            toValue: 0,
            duration: ANIM_DURATION + i * 120,
            useNativeDriver: false,
          }),
        ])
      )
    );
    const parallel = Animated.parallel(anims);
    parallel.start();
    return () => parallel.stop();
  }, []);

  /* Interpolate Animated values to actual x/y positions */
  const nodePositions = useMemo(
    () =>
      STATIC_NODES.map((node, i) => ({
        cx: animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [node.x, node.x + node.driftX],
        }),
        cy: animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [node.y, node.y + node.driftY],
        }),
        r: node.r,
      })),
    []
  );

  /* Pre-compute which pairs are close enough to draw a line.
     We use the *static* positions for the connection check (cheaper)
     and then animate both endpoints using the Animated values. */
  const connections = useMemo(() => {
    const pairs = [];
    for (let a = 0; a < STATIC_NODES.length; a++) {
      for (let b = a + 1; b < STATIC_NODES.length; b++) {
        const dx = STATIC_NODES[a].x - STATIC_NODES[b].x;
        const dy = STATIC_NODES[a].y - STATIC_NODES[b].y;
        if (Math.sqrt(dx * dx + dy * dy) < CONNECTION_DIST) {
          pairs.push([a, b]);
        }
      }
    }
    return pairs;
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, style]} pointerEvents="none">
      <Svg width={SCREEN_W} height={SCREEN_H}>
        {/* Lines */}
        {connections.map(([a, b]) => (
          <AnimatedLine
            key={`l-${a}-${b}`}
            x1={nodePositions[a].cx}
            y1={nodePositions[a].cy}
            x2={nodePositions[b].cx}
            y2={nodePositions[b].cy}
            stroke={lineColor}
            strokeWidth={0.9}
          />
        ))}

        {/* Nodes */}
        {nodePositions.map((pos, i) => (
          <AnimatedCircle
            key={`c-${i}`}
            cx={pos.cx}
            cy={pos.cy}
            r={pos.r}
            fill={nodeColor}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 0,
    opacity: 1,
  },
});

export default PlexusBackground;
