import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Tooltip — GestionMoMo Mobile
 *
 * Sur mobile le hover n'existe pas : le tooltip s'affiche au long-press
 * et se ferme en appuyant n'importe où en dehors.
 *
 * Usage :
 *   <Tooltip content="Mon texte">
 *     <TouchableOpacity>...</TouchableOpacity>
 *   </Tooltip>
 *
 * Props :
 *   content      {string}   Texte affiché dans le tooltip
 *   placement    {'top'|'bottom'|'left'|'right'}  Défaut : 'top'
 *   disabled     {boolean}  Désactive le tooltip
 *   maxWidth     {number}   Largeur max en dp (défaut : 200)
 */
const Tooltip = ({
  children,
  content,
  placement = 'top',
  disabled = false,
  maxWidth = 200,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState(null);
  const triggerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const GAP = 8;
  const ARROW_SIZE = 6;
  const TOOLTIP_PADDING_V = 7;
  const TOOLTIP_PADDING_H = 11;

  const measureAndShow = useCallback(() => {
    if (disabled || !content) return;
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerLayout({ x, y, width, height });
        setVisible(true);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.92);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 200,
            friction: 18,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [disabled, content, fadeAnim, scaleAnim]);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [fadeAnim, scaleAnim]);

  if (!content || disabled) {
    return <>{children}</>;
  }

  // Calcul de la position du tooltip en fonction du placement et du layout du trigger
  const getTooltipPosition = (tooltipWidth, tooltipHeight) => {
    if (!triggerLayout) return { top: 0, left: 0 };
    const { x, y, width, height } = triggerLayout;

    switch (placement) {
      case 'bottom':
        return {
          top: y + height + GAP + ARROW_SIZE,
          left: Math.max(8, x + width / 2 - tooltipWidth / 2),
        };
      case 'left':
        return {
          top: y + height / 2 - tooltipHeight / 2,
          left: Math.max(8, x - tooltipWidth - GAP - ARROW_SIZE),
        };
      case 'right':
        return {
          top: y + height / 2 - tooltipHeight / 2,
          left: x + width + GAP + ARROW_SIZE,
        };
      case 'top':
      default:
        return {
          top: y - tooltipHeight - GAP - ARROW_SIZE,
          left: Math.max(8, x + width / 2 - tooltipWidth / 2),
        };
    }
  };

  // Styles de la flèche selon placement
  const arrowStyle = () => {
    const base = { position: 'absolute', width: 0, height: 0 };
    const bg = theme.isDark ? '#F0F4FF' : '#1A1A2E';
    switch (placement) {
      case 'bottom':
        return {
          ...base,
          top: -ARROW_SIZE,
          alignSelf: 'center',
          borderLeftWidth: ARROW_SIZE,
          borderRightWidth: ARROW_SIZE,
          borderBottomWidth: ARROW_SIZE,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: bg,
        };
      case 'left':
        return {
          ...base,
          right: -ARROW_SIZE,
          alignSelf: 'center',
          top: '50%',
          marginTop: -ARROW_SIZE,
          borderTopWidth: ARROW_SIZE,
          borderBottomWidth: ARROW_SIZE,
          borderLeftWidth: ARROW_SIZE,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: bg,
        };
      case 'right':
        return {
          ...base,
          left: -ARROW_SIZE,
          top: '50%',
          marginTop: -ARROW_SIZE,
          borderTopWidth: ARROW_SIZE,
          borderBottomWidth: ARROW_SIZE,
          borderRightWidth: ARROW_SIZE,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: bg,
        };
      case 'top':
      default:
        return {
          ...base,
          bottom: -ARROW_SIZE,
          alignSelf: 'center',
          borderLeftWidth: ARROW_SIZE,
          borderRightWidth: ARROW_SIZE,
          borderTopWidth: ARROW_SIZE,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: bg,
        };
    }
  };

  const tooltipBg = theme.isDark ? '#F0F4FF' : '#1A1A2E';
  const tooltipText = theme.isDark ? '#1A1A2E' : '#F5F5F5';
  const tooltipBorder = theme.isDark
    ? 'rgba(0, 0, 0, 0.08)'
    : 'rgba(255, 255, 255, 0.08)';

  const styles = makeStyles({ tooltipBg, tooltipText, tooltipBorder, theme, TOOLTIP_PADDING_V, TOOLTIP_PADDING_H, maxWidth });

  return (
    <View ref={triggerRef} collapsable={false}>
      {/* Trigger — long press pour afficher */}
      {React.cloneElement(React.Children.only(children), {
        onLongPress: () => {
          measureAndShow();
          children.props.onLongPress?.();
        },
        delayLongPress: children.props.delayLongPress ?? 400,
      })}

      {/* Tooltip overlay via Modal transparent */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={hide}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={hide}>
          <View style={StyleSheet.absoluteFill}>
            {triggerLayout && (
              <TooltipBox
                content={content}
                placement={placement}
                getTooltipPosition={getTooltipPosition}
                arrowStyle={arrowStyle}
                styles={styles}
                fadeAnim={fadeAnim}
                scaleAnim={scaleAnim}
                theme={theme}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

/**
 * Sous-composant interne qui se mesure lui-même pour calculer sa position
 */
const TooltipBox = ({
  content, placement, getTooltipPosition, arrowStyle,
  styles, fadeAnim, scaleAnim,
}) => {
  const [layout, setLayout] = useState(null);

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  const position = layout
    ? getTooltipPosition(layout.width, layout.height)
    : { top: -9999, left: -9999 }; // caché tant qu'on n'a pas le layout

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.tooltip,
        { top: position.top, left: position.left },
        { opacity: layout ? fadeAnim : 0, transform: [{ scale: layout ? scaleAnim : 1 }] },
      ]}
    >
      <View style={arrowStyle()} />
      <Text style={styles.text} numberOfLines={5}>
        {content}
      </Text>
    </Animated.View>
  );
};

const makeStyles = ({ tooltipBg, tooltipText, tooltipBorder, theme, TOOLTIP_PADDING_V, TOOLTIP_PADDING_H, maxWidth }) =>
  StyleSheet.create({
    tooltip: {
      position: 'absolute',
      maxWidth,
      backgroundColor: tooltipBg,
      borderRadius: theme.radius.sm,
      paddingVertical: TOOLTIP_PADDING_V,
      paddingHorizontal: TOOLTIP_PADDING_H,
      borderWidth: 1,
      borderColor: tooltipBorder,
      // Ombre
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.isDark ? 0.45 : 0.22,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    text: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.xs,
      color: tooltipText,
      letterSpacing: 0.2,
      lineHeight: 16,
    },
  });

export default Tooltip;
