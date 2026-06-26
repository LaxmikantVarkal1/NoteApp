import RichTextEditor from '@/components/RichTextEditor';
import { bgPatterns } from '@/constants/bg';
import { CustomFonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNoteStore } from '@/store/useNoteStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CircleDashed, Palette, Pin, Tag, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

  const { notes, addNote, updateNote, deleteNote, togglePin, tags, addTag, setSelectedTags, selectedTags } = useNoteStore();
  const existingNote = notes.find(n => n.id === id);
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

  const [showModal, setShowModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');


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

  const colors = isDark
    ? ['#111111', '#4A1D1A', '#1C3322', '#1B2C3B', '#3B3A1C']
    : ['#FFFFFF', '#FFD1CA', '#CFF1D7', '#D0E6F9', '#FFF3B8'];
  const pattern = []

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

  const handleSaveAndGoBack = () => {
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
      updateNote(id as string, { title, content, color, backgroundPattern, pinned, tags: selectedTags, font: selectedFont });
    }
    router.back();
  };

  const handleDelete = () => {
    if (!isNew) {
      deleteNote(id as string);
    }
    router.back();
  };

  const togglePinStatus = () => {
    setPinned(!pinned);
    if (!isNew) {
      togglePin(id as string);
    }
  };

  const currentBgColor = color || (isDark ? '#111' : '#FFF');
  const activeBackgroundPattern = bgPatterns.find((pattern) => pattern.id === backgroundPattern)?.svg || '';
  const iconColor = isDark ? '#ffffff39' : '#33333343';
  const isActiveAction = isDark ? '#ffffffff' : '#000000ff';
  const isOnline = useNetworkStatus();




  return (

    <View
      style={[styles.container, { backgroundColor: currentBgColor, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSaveAndGoBack} style={styles.iconButton}>
          <ArrowLeft color={iconColor} size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {/* <TouchableOpacity onPress={() => setShowFormatBar(!showFormatBar)} style={[styles.iconButton]}>
            <SquarePen color={showFormatBar ? isActiveAction : iconColor} size={23} />
          </TouchableOpacity> */}
          <TouchableOpacity onPress={togglePinStatus} style={styles.iconButton}>
            <Pin color={pinned ? isActiveAction : iconColor} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            router.push('/note/modal/labels');
          }} style={styles.iconButton}>
            <Tag color={showModal ? isActiveAction : iconColor} size={24} />
          </TouchableOpacity>
          <GestureDetector gesture={patternDoubleTap}>
            <TouchableOpacity style={styles.iconButton}>
              <CircleDashed color={backgroundPattern ? isActiveAction : iconColor} size={24} />
            </TouchableOpacity>
          </GestureDetector>
          <TouchableOpacity onPress={() => setShowPalette(!showPalette)} style={styles.iconButton}>
            <Palette color={showPalette ? isActiveAction : iconColor} size={24} />
          </TouchableOpacity>
          {!isNew && (
            <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
              <Trash2 color={iconColor} size={24} />
            </TouchableOpacity>
          )}

        </View>
      </View>

      {showPalette && (
        <View style={styles.paletteContainer}>

          <TouchableOpacity
            style={[styles.colorCircle]}
            onPress={() => {
              const patterns = []
            }}
          >
            <CircleDashed color={iconColor} size={36} />
          </TouchableOpacity>
          {colors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorCircle, { backgroundColor: c, borderWidth: color === c || (c === colors[0] && !color) ? 2 : 0, borderColor: isDark ? '#FFF' : '#333' }]}
              onPress={() => setColor(c === colors[0] ? '' : c)}
            />
          ))}
        </View>
      )}


      <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
        <TextInput
          style={[styles.titleInput, { color: isDark ? '#FFF' : '#333', flex: 1 }]}
          placeholder="Title"
          placeholderTextColor={isDark ? '#AAA' : '#888'}
          value={title}
          onChangeText={setTitle}
        />
      </View>





      {/* Selected tags list */}
      {selectedTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {selectedTags.map((tag, index) => (
            <View key={index} style={[styles.tagChip, { backgroundColor: isDark ? '#ffffff19' : '#f1f3f435' }]}>
              <Text style={[styles.tagChipText, { color: isDark ? '#ffffffff' : '#333' }]}>{tag}</Text>
              {/* <TouchableOpacity onPress={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}>
                <X color={isDark ? '#AAA' : '#666'} size={14} style={{ marginLeft: 6 }} />
              </TouchableOpacity> */}
            </View>
          ))}
        </View>
      )}

      {/* Label/Tags Picker Bottom Sheet Modal */}
      <Modal
        visible={showModal}
        backdropColor={'rgba(255, 255, 255, 0.09)'}
        animationType="slide"
        presentationStyle='pageSheet'
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            style={{
              marginTop: "50%", // Half-screen
              flex: 1,
              backgroundColor: "#fff",
            }}
          >
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Your form */}

            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.editorWrapper}>


        <RichTextEditor
          initialContent={existingNote?.content || ''}
          onChange={setContent}
          sizes={editorSizes}
          textColor={isDark ? '#FFF' : '#333'}
          backgroundColor={currentBgColor}
          backgroundPattern={activeBackgroundPattern}
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
        showFormatBar && <View style={{
          position: "absolute",
          bottom: keyboardHeight,
          flexDirection: 'row',
          width: '100%',
          zIndex: 999,
          padding: 10,
          backgroundColor: isDark ? '#ffffff10' : '#ffffffdd'
        }}>
          {isOnline && <GestureDetector gesture={gesture}>
            <TouchableOpacity
              style={{ height: 'auto', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 }}>
              <Text style={[{ color: isDark ? '#FFF' : '#333' }]}>{selectedFont + ''}</Text>
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
            </View>
          </ScrollView>
        </View>
      }


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleInput: {
    fontSize: 24,
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
    fontWeight: '500',
  },

});
