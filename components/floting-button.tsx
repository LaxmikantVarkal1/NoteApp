import { Ellipsis, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const FAB_SIZE = 40;
const PADDING = 16;

interface DraggableFABProps {
  /** Rendered inside the expanded capsule */
  children: React.ReactNode;
  /** Expanded capsule width in pixels — caller determines size of content */
  contentWidth?: number;
  /** Background + border colors for the FAB button */
  fabBgColor?: string;
  fabBorderColor?: string;
  /** Icon tint color */
  iconColor?: string;
  /** Keyboard height so FAB auto-avoids it */
  keyboardHeight?: number;
}

export default function DraggableFAB({
  children,
  contentWidth = 228,
  fabBgColor = 'rgba(255, 255, 255, 0.95)',
  fabBorderColor = 'rgba(0, 0, 0, 0.08)',
  iconColor = '#333',
  keyboardHeight = 0,
}: DraggableFABProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Screen Boundaries
  const MIN_X = PADDING;
  const MAX_X = screenWidth - FAB_SIZE - PADDING;
  const MIN_Y = PADDING + 60;
  const keyboardOffset = keyboardHeight > 10 ? keyboardHeight - 10 : 0;
  const MAX_Y = screenHeight - FAB_SIZE - PADDING - 100 - keyboardOffset;

  // Shared values — all animation lives on UI thread
  const translateX = useSharedValue(MAX_X);
  const translateY = useSharedValue(MAX_Y);
  const lastUserY = useSharedValue(MAX_Y);
  const isExpanded = useSharedValue(0);
  const isLeftShared = useSharedValue(0); // 0 = right-aligned, 1 = left-aligned
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  // Minimal React state — only for pointer-events toggling (no side-effects)
  const [expanded, setExpanded] = useState(false);

  // Keyboard avoidance
  React.useEffect(() => {
    const maxAvailableY = screenHeight - FAB_SIZE - PADDING - 100 - keyboardOffset;
    if (keyboardHeight > 10) {
      if (lastUserY.value > maxAvailableY) {
        translateY.value = withTiming(maxAvailableY, { duration: 220 });
      }
    } else {
      translateY.value = withTiming(lastUserY.value, { duration: 220 });
    }
  }, [keyboardHeight, screenHeight, keyboardOffset]);

  // ── Drag Gesture ───────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      // Collapse on drag — pure UI thread, no runOnJS
      isExpanded.value = withTiming(0, { duration: 200 });
      runOnJS(setExpanded)(false);
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onChange((event) => {
      const nextX = Math.min(Math.max(contextX.value + event.translationX, MIN_X), MAX_X);
      const nextY = Math.min(Math.max(contextY.value + event.translationY, MIN_Y), MAX_Y);
      translateX.value = nextX;
      translateY.value = nextY;
      lastUserY.value = nextY;
    })
    .onEnd(() => {
      const isCurrentlyLeft = translateX.value + FAB_SIZE / 2 < screenWidth / 2;
      isLeftShared.value = withSpring(isCurrentlyLeft ? 1 : 0, { damping: 24, stiffness: 180 });
      translateX.value = withSpring(isCurrentlyLeft ? MIN_X : MAX_X, { damping: 24, stiffness: 180 });
      translateY.value = withSpring(translateY.value, { damping: 24, stiffness: 180 });
      lastUserY.value = translateY.value;
    });

  // ── Tap Gesture ────────────────────────────────────────────────────────────
  const tapGesture = Gesture.Tap().onEnd(() => {
    const next = isExpanded.value === 1 ? 0 : 1;
    isExpanded.value = withTiming(next, { duration: 200, easing: Easing.out(Easing.cubic) });
    runOnJS(setExpanded)(next === 1);
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // ── Animated Styles ────────────────────────────────────────────────────────
  const containerStyle = useAnimatedStyle(() => {
    const exp = isExpanded.value;
    const left = isLeftShared.value;
    const totalWidth = interpolate(exp, [0, 1], [FAB_SIZE, FAB_SIZE + 8 + contentWidth]);
    const shiftX = (1 - left) * exp * (contentWidth + 8);
    return {
      position: 'absolute',
      width: totalWidth,
      height: FAB_SIZE,
      transform: [
        { translateX: translateX.value - shiftX },
        { translateY: translateY.value },
      ],
    };
  });

  const fabStyle = useAnimatedStyle(() => {
    const left = (1 - isLeftShared.value) * isExpanded.value * (contentWidth + 8);
    return { position: 'absolute', left, bottom: 0 };
  });

  const typeIconStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: interpolate(isExpanded.value, [0, 0.4, 1], [1, 0, 0]),
    transform: [{ scale: interpolate(isExpanded.value, [0, 1], [1, 0.6]) }],
  }));

  const xIconStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: interpolate(isExpanded.value, [0, 0.4, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(isExpanded.value, [0, 1], [0.6, 1]) },
      { rotate: `${interpolate(isExpanded.value, [0, 1], [0, 90])}deg` },
    ],
  }));

  const capsuleStyle = useAnimatedStyle(() => {
    const left = interpolate(isLeftShared.value, [0, 1], [0, FAB_SIZE + 8]);
    const width = interpolate(isExpanded.value, [0, 1], [0, contentWidth]);
    const opacity = interpolate(isExpanded.value, [0, 0.3, 1], [0, 0, 1]);
    const scale = interpolate(isExpanded.value, [0, 1], [0.95, 1]);
    return {
      position: 'absolute',
      left,
      bottom: 0,
      width,
      height: FAB_SIZE,
      opacity,
      overflow: 'hidden',
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Expanded content capsule */}
      <Animated.View
        style={[
          styles.capsule,
          capsuleStyle,
          { borderColor: fabBorderColor },
        ]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        {children}
      </Animated.View>

      {/* Draggable FAB handle */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.fab,
            fabStyle,
            { backgroundColor: fabBgColor, borderColor: fabBorderColor },
          ]}
        >
          <Animated.View style={[styles.iconWrap, typeIconStyle]}>
            <Ellipsis color={iconColor} size={18} />
          </Animated.View>
          <Animated.View style={[styles.iconWrap, xIconStyle]}>
            <X color={iconColor} size={18} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 9999,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  iconWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capsule: {
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
});
