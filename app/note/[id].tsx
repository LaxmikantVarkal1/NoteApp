import RichTextEditor from '@/components/RichTextEditor';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Palette, Pin, SquarePen, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const insets = useSafeAreaInsets();
  const dimensios = useWindowDimensions();
  const editorSizes = useMemo(() => ({
    width: dimensios.width - 40,
    height: dimensios.height - 390
  }), [dimensios.width, dimensios.height]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { notes, addNote, updateNote, deleteNote, togglePin } = useNoteStore();
  const existingNote = notes.find(n => n.id === id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('');
  const [pinned, setPinned] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [formatCommand, setFormatCommand] = useState<string | undefined>(undefined);
  const [activeBlockType, setActiveBlockType] = useState<string>('paragraph');
  const [activeInlineFormats, setActiveInlineFormats] = useState({
    bold: false, italic: false, underline: false, strikethrough: false,
  });

  const sendFormat = (cmd: string) => {
    setFormatCommand(`${cmd}:${Date.now()}`);
  };

  // Toggle: if the block is already the target type, revert to paragraph
  const sendBlockType = (type: string) => {
    const newType = activeBlockType === type ? 'paragraph' : type;
    setActiveBlockType(newType);
    sendFormat(`blockType:${newType}`);
  };

  const colors = isDark
    ? ['#111111', '#4A1D1A', '#1C3322', '#1B2C3B', '#3B3A1C']
    : ['#FFFFFF', '#FFD1CA', '#CFF1D7', '#D0E6F9', '#FFF3B8'];

  useEffect(() => {
    if (existingNote && !isNew) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setColor(existingNote.color || '');
      setPinned(existingNote.pinned || false);
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
        pinned,
        tags: [],
      });
    } else {
      updateNote(id as string, { title, content, color, pinned });
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
  const iconColor = isDark ? '#ffffff4c' : '#33333343';
  const isActiveAction = isDark ? '#ffffffff' : '#000000ff';

  return (
    <View
      style={[styles.container, { backgroundColor: currentBgColor, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSaveAndGoBack} style={styles.iconButton}>
          <ArrowLeft color={iconColor} size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFormatBar(!showFormatBar)} style={[styles.iconButton]}>
            <SquarePen color={showFormatBar ? isActiveAction : iconColor} size={23} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePinStatus} style={styles.iconButton}>
            <Pin color={pinned ? '#030303ff' : iconColor} size={24} />
          </TouchableOpacity>
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
          {colors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorCircle, { backgroundColor: c, borderWidth: color === c || (c === colors[0] && !color) ? 2 : 1, borderColor: isDark ? '#FFF' : '#333' }]}
              onPress={() => setColor(c === colors[0] ? '' : c)}
            />
          ))}
        </View>
      )}


      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contentContainer, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[styles.titleInput, { color: isDark ? '#FFF' : '#333' }]}
          placeholder="Title"
          placeholderTextColor={isDark ? '#AAA' : '#888'}
          value={title}
          onChangeText={setTitle}
          multiline
        />

        {/* ── Native Formatting Toolbar ─────────────────────────── */}
        {showFormatBar && <View style={[styles.formatBar]}>
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
        </View>}
        <View style={styles.editorWrapper}>
          <RichTextEditor
            initialContent={existingNote?.content || ''}
            onChange={setContent}
            sizes={editorSizes}
            textColor={isDark ? '#FFF' : '#333'}
            backgroundColor={currentBgColor}
            formatCommand={formatCommand}
            onBlockTypeChange={setActiveBlockType}
            onActiveFormatsChange={setActiveInlineFormats}
          />
        </View>
      </ScrollView>



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
    marginTop: 8,
    marginBottom: 16,
    overflow: 'hidden'
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
    backgroundColor: '#8a222244',
    marginHorizontal: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
});
