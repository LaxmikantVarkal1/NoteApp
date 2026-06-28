import RichTextEditor from '@/components/RichTextEditor';
import bgPatterns from '@/constants/bg';
import { Colors, CustomFonts, NoteColors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNoteStore } from '@/store/useNoteStore';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Archive, ArrowLeft, CheckSquare, CircleDashed, MoreVertical, Palette, Pin, Tag, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const insets = useSafeAreaInsets();
  const dimensios = useWindowDimensions();
  const editorSizes = useMemo(() => ({
    width: dimensios.width - 0,
    height: dimensios.height - 150
  }), [dimensios.width, dimensios.height]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { notes, isLoading, loadNotes, addNote, updateNote, deleteNote, trashNote, archiveNote, unarchiveNote, togglePin, setSelectedTags, selectedTags } = useNoteStore();
  const existingNote = id ? notes[id] : undefined;
  const [keyboardHeight, setKeyboardHeight] = useState(10);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('');
  const [backgroundPattern, setBackgroundPattern] = useState('');
  const [selectedFont, setSelectedFont] = useState('Ubuntu');
  const [pinned, setPinned] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showFormatBar, setShowFormatBar] = useState(true);
  const [formatCommand, setFormatCommand] = useState<string | undefined>(undefined);
  const [activeBlockType, setActiveBlockType] = useState<string>('paragraph');
  const [activeInlineFormats, setActiveInlineFormats] = useState({
    bold: false, italic: false, underline: false, strikethrough: false,
  });
  const [showMenu, setShowMenu] = useState(false);

  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleSaveAndGoBack("manual");
          return true;
        }
      );

      return () => subscription.remove();
    }, [title,
      content,
      color,
      backgroundPattern,
      pinned,
      selectedTags,
      selectedFont,])
  );

  useEffect(() => {
    progress.value = withTiming(showPalette ? 1 : 0, {
      duration: 300,
    });
  }, [showPalette]);

  useEffect(() => {
    setFormatCommand(`bg:${currentBgColor}`);
  }, [color]);

  useEffect(() => {
    setFormatCommand(`pattern:${backgroundPattern}`);
  }, [backgroundPattern]);

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, 60], Extrapolation.CLAMP),
    paddingVertical: interpolate(progress.value, [0, 1], [0, 12], Extrapolation.CLAMP),
    borderBottomWidth: interpolate(progress.value, [0, 1], [0, StyleSheet.hairlineWidth], Extrapolation.CLAMP),
    overflow: "hidden",
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [-12, 0]),
      },
    ],
  }));

  useEffect(() => {
    const showSub = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height + 15);
      }
    );

    const hideSub = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(10);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const sendFormat = (cmd: string) => {
    setFormatCommand(`${cmd}:${Date.now()}`);
  };

  // Toggle: if the block is already the target type, revert to paragraph
  const sendBlockType = (type: string) => {
    const newType = activeBlockType === type ? 'paragraph' : type;
    setActiveBlockType(newType);
    sendFormat(`blockType:${newType}`);
  };


  // Gestures events
  const doubleTap = Gesture.Tap().runOnJS(true)
    .numberOfTaps(2)
    .onEnd(() => {
      setSelectedFont((prev) => {
        let font = Object.keys(CustomFonts);
        let index = font.indexOf(prev);
        if (index < font.length - 1) {
          index++;
        } else {
          index = 0;
        }
        return font[index];
      });
    });

  const gesture = Gesture.Simultaneous(doubleTap);
  const patternDoubleTap = Gesture.Tap().runOnJS(true)
    .numberOfTaps(2)
    .onEnd(() => {
      setBackgroundPattern((prev) => {
        const currentIndex = bgPatterns.findIndex((pattern) => pattern.id === prev || pattern.svg === prev);
        const nextIndex = currentIndex >= 0 && currentIndex < bgPatterns.length - 1 ? currentIndex + 1 : 0;
        return bgPatterns[nextIndex]?.id || '';
      });
    });

  const themeColors = isDark ? Colors.dark : Colors.light;
  const colors = isDark ? NoteColors.dark : NoteColors.light;

  useEffect(() => {
    if (existingNote && !isNew) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setColor(existingNote.color || '');
      const savedPattern = existingNote.backgroundPattern || '';
      const savedPatternConfig = bgPatterns.find((pattern) => pattern.id === savedPattern || pattern.svg === savedPattern);
      setBackgroundPattern(savedPatternConfig?.id || '');
      setPinned(existingNote.pinned || false);
      setSelectedTags(existingNote?.tags as any || []);
      console.log(existingNote.tags)
      if (existingNote?.font) setSelectedFont(existingNote.font);
    }

    if (isNew) {
      setBackgroundPattern('');
      setSelectedTags([]);
    }
  }, [existingNote, isNew]);

  const handleSaveAndGoBack = (actionType?: string) => {
    if (title.trim() === '' && content.trim() === '') {
      router.back();
      return;
    }

    if (isNew) {
      addNote({
        title,
        content,
        color,
        backgroundPattern,
        pinned,
        tags: selectedTags,
        font: selectedFont
      });
    } else {
      setTimeout(() => {
        updateNote(id as string, { title, content, color, backgroundPattern, pinned, tags: selectedTags, font: selectedFont });
      }, 1000)
    }

    router.back();

  };

  const handleDelete = async () => {
    if (!isNew) {
      await trashNote(id as string);
    }
    router.back();
  };

  const handleArchive = async () => {
    if (!isNew) {
      if (existingNote?.archived) {
        await unarchiveNote(id as string);
      } else {
        await archiveNote(id as string);
      }
    }
    router.back();
  };

  const togglePinStatus = () => {
    setPinned(!pinned);
    if (!isNew) {
      togglePin(id as string);
    }
  };

  const currentBgColor = color || themeColors.background;
  const activeBackgroundPattern = bgPatterns.find((pattern) => pattern.id === backgroundPattern)?.svg || '';
  const iconColor = themeColors.iconSubtle;
  const isActiveAction = themeColors.iconActive;
  const isOnline = useNetworkStatus();

  const menuBgColor = themeColors.menuBg;
  const menuBorderColor = themeColors.menuBorder;
  const menuTextColor = themeColors.menuText;
  const menuIconColor = themeColors.menuIcon;
  const deleteColor = themeColors.deleteColor;

  function makeThumbnail(svg: string) {
    return svg
      .replace('<svg', '<svg viewBox="0 0 100 100"')
      .replace(/width="(\d+)"/g, (_, w) => `width="${Number(w) / 2}"`)
      .replace(/height="(\d+)"/g, (_, h) => `height="${Number(h) / 2}"`);
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tomatoRed} />
        <Text style={[styles.loadingText, { color: themeColors.subtitle }]}>Loading note...</Text>
      </View>
    );
  }

  return (

    <View
      style={[styles.container, { backgroundColor: currentBgColor, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          handleSaveAndGoBack("backButton")
        }} style={styles.iconButton}>
          <ArrowLeft color={iconColor} size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {/* <TouchableOpacity onPress={() => setShowFormatBar(!showFormatBar)} style={[styles.iconButton]}>
            <SquarePen color={showFormatBar ? isActiveAction : iconColor} size={23} />
          </TouchableOpacity> */}
          <TouchableOpacity onPress={togglePinStatus} style={styles.iconButton}>
            <Pin color={pinned ? isActiveAction : iconColor} size={24} />
          </TouchableOpacity>
          <GestureDetector gesture={patternDoubleTap}>
            <TouchableOpacity
              style={styles.iconButton}>
              <CircleDashed color={(backgroundPattern !== "none" && backgroundPattern) ? isActiveAction : iconColor} size={24} />
              {backgroundPattern !== "none" && backgroundPattern && <Text style={{ color: isActiveAction, fontSize: 10, marginTop: 5, textAlign: 'center', fontFamily: Typography.medium }}>{backgroundPattern}</Text>}
            </TouchableOpacity>
          </GestureDetector>
          <TouchableOpacity onPress={() => {
            router.push('/note/modal/labels');
          }} style={styles.iconButton}>
            <Tag color={iconColor} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPalette(!showPalette)} style={styles.iconButton}>
            <Palette color={showPalette ? isActiveAction : iconColor} size={24} />
          </TouchableOpacity>
          {!isNew && (
            <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.iconButton}>
              <MoreVertical color={iconColor} size={24} />
            </TouchableOpacity>
          )}

        </View>
      </View>

      <Animated.View
        style={[
          styles.paletteContainer,
          containerStyle,
          { borderBottomColor: isDark ? '#0000001a' : '#ffffff95' },
        ]}
      >
        <Animated.View style={contentStyle}>

          {/* Colors selection */}
          <View style={styles.paletteRow}>
            <Text style={[styles.paletteLabel, { color: themeColors.subtitle }]}>Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowContent}
            >
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c,
                      borderWidth: color === c || (c === colors[0] && !color) ? 2 : 0,
                      borderColor: themeColors.text,
                    },
                  ]}
                  onPress={() => {
                    // setFormatCommand(`bg:${c === colors[0] ? '' : c)}`);
                    setColor(c === colors[0] ? '' : c)
                  }
                  }
                />
              ))}
            </ScrollView>
          </View>
          {/* Patterns selection */}
          {/* <View style={[styles.paletteRow, { marginTop: 12 }]}>
            <Text style={[styles.paletteLabel, { color: themeColors.subtitle }]}>Pattern</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rowContent}
            >
              {bgPatterns.map((p) => {
                const isSelected = backgroundPattern === p.id || (p.id === 'none' && !backgroundPattern);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.patternCircle,
                      {
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? themeColors.text : themeColors.border,
                      },
                    ]}
                    onPress={() => setBackgroundPattern(p.id === 'none' ? '' : p.id)}
                  >
                    <View style={styles.patternCircleInner}>
                      {p.svg ? (
                        <SvgXml xml={p.svg} width="100%" height="100%" />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View> */}
        </Animated.View>


      </Animated.View>






      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 4 }}>
        <TextInput
          style={[styles.titleInput, { color: themeColors.text, flex: 1 }]}
          placeholder="Title"
          placeholderTextColor={themeColors.placeholder}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Selected tags list */}
      {selectedTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {selectedTags.map((tag, index) => (
            <View key={index} style={[styles.tagChip, { backgroundColor: themeColors.tagChipBg }]}>
              <Text style={[styles.tagChipText, { color: themeColors.tagChipText }]}>{tag}</Text>
              {/* <TouchableOpacity onPress={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}>
                <X color={isDark ? '#AAA' : '#666'} size={14} style={{ marginLeft: 6 }} />
              </TouchableOpacity> */}
            </View>
          ))}
        </View>
      )}

      <View style={styles.editorWrapper}>
        <RichTextEditor
          initialContent={existingNote?.content || ''}
          onChange={setContent}
          sizes={editorSizes}
          textColor={themeColors.text}
          formatCommand={formatCommand}
          onBlockTypeChange={setActiveBlockType}
          onActiveFormatsChange={setActiveInlineFormats}
          configs={{
            font: CustomFonts[selectedFont || 'Roboto']
          }}
        />
      </View>


      {/* 
      <View style={[styles.bottomBar, { backgroundColor: isDark ? '#222' : '#F8F9FA' }]}>
        <TouchableOpacity style={styles.iconButton}>
          <CheckSquare color={iconColor} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Mic color={iconColor} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <ImageIcon color={iconColor} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.iconButton}>
          <MoreVertical color={iconColor} size={24} />
        </TouchableOpacity>
      </View> */}

      {
        showFormatBar && <View style={[{
          position: "absolute",
          bottom: keyboardHeight,
          flexDirection: 'row',
          width: '100%',
          zIndex: 999,
          padding: 15,
          backgroundColor: currentBgColor,
        }]}>
          {isOnline && <GestureDetector gesture={gesture}>
            <TouchableOpacity
              style={{ height: 'auto', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 }}>
              <Text style={[{ color: themeColors.text }]}>{selectedFont + ''}</Text>
            </TouchableOpacity>
          </GestureDetector>}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              gap: 12,
            }}
          >

            <View style={[styles.formatBar, { paddingHorizontal: 0, paddingVertical: 0, gap: 12 }]}>
              {/* Block type buttons */}
              {(['paragraph', 'heading1', 'heading2', 'heading3'] as const).map((type) => {
                const label = type === 'paragraph' ? 'T' : type === 'heading1' ? 'H1' : type === 'heading2' ? 'H2' : 'H3';
                const isActive = activeBlockType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => sendBlockType(type)}
                    style={[styles.fmtBtn]}
                  >
                    <Text style={[styles.fmtBtnText, { color: isActive ? isActiveAction : iconColor }, type !== 'paragraph' && { fontWeight: '700' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.fmtSep} />
              {([
                { cmd: 'bold', label: 'B', isActive: activeInlineFormats.bold, style: { fontWeight: '700' as const } },
                { cmd: 'italic', label: 'I', isActive: activeInlineFormats.italic, style: { fontStyle: 'italic' as const } },
                { cmd: 'underline', label: 'U', isActive: activeInlineFormats.underline, style: { textDecorationLine: 'underline' as const } },
                { cmd: 'strikeThrough', label: 'S', isActive: activeInlineFormats.strikethrough, style: { textDecorationLine: 'line-through' as const } },
              ]).map(({ cmd, label, isActive, style }) => (
                <TouchableOpacity
                  key={cmd}
                  onPress={() => sendFormat(cmd)}
                  style={[styles.fmtBtn]}
                >
                  <Text style={[styles.fmtBtnText, style, { color: isActive ? isActiveAction : iconColor }]}>{label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.fmtSep} />
              <TouchableOpacity
                onPress={() => sendBlockType('checklist')}
                style={[styles.fmtBtn]}
              >
                <CheckSquare color={activeBlockType === 'checklist' ? isActiveAction : iconColor} size={18} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      }

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuTooltip, {
            top: insets.top + 8,
            right: 16,
            backgroundColor: menuBgColor,
            borderColor: menuBorderColor,
          }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleArchive();
              }}
            >
              <Archive color={menuIconColor} size={18} />
              <Text style={[styles.menuItemText, { color: menuTextColor }]}>
                {existingNote?.archived ? 'Unarchive' : 'Archive'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuSeparator, { backgroundColor: isDark ? '#333' : '#E8E8E8' }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleDelete();
                setShowMenu(false);
              }}
            >
              <Trash2 color={deleteColor} size={18} />
              <Text style={[styles.menuItemText, { color: deleteColor }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: Typography.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 10,
    marginEnd: 10
  },
  paletteContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
  },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paletteLabel: {
    fontSize: 12,
    fontFamily: Typography.medium,
    width: 60,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  patternCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  patternCircleInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: Typography.regular,
    fontWeight: '400',
    marginBottom: 8,
  },
  editorWrapper: {
    flex: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  formatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 2,
  },
  fmtBtn: {
    borderColor: 'transparent',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmtBtnText: {
    fontSize: 13,
    fontFamily: Typography.medium,
    fontWeight: '600',
    padding: 5
  },
  fmtSep: {
    width: 1,
    height: 18,
    backgroundColor: '#8b8a8ae4',
    marginHorizontal: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  tagChipText: {
    fontSize: 12,
    fontFamily: Typography.medium,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuTooltip: {
    position: 'absolute',
    width: 150,
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: Typography.medium,
    fontWeight: '500',
  },
  menuSeparator: {
    height: 1,
    marginVertical: 4,
  },
  topShadow: {
    position: "absolute",
    top: -8,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#fff",

    // iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    // Android
    elevation: 8,
  },
});
