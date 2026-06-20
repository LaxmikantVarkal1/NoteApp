import RichTextEditor from '@/components/RichTextEditor';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckSquare, Image as ImageIcon, Mic, MoreVertical, Palette, Pin, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const insets = useSafeAreaInsets();
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
  const iconColor = isDark ? '#FFF' : '#333';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: currentBgColor, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSaveAndGoBack} style={styles.iconButton}>
          <ArrowLeft color={iconColor} size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={togglePinStatus} style={styles.iconButton}>
            <Pin color={pinned ? '#FF6347' : iconColor} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPalette(!showPalette)} style={styles.iconButton}>
            <Palette color={iconColor} size={24} />
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
        <View style={styles.editorWrapper}>
          <RichTextEditor
            initialContent={content}
            onChange={setContent}
            textColor={isDark ? '#FFF' : '#333'}
            backgroundColor={currentBgColor}
          />
        </View>
      </ScrollView>

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
      </View>
    </KeyboardAvoidingView>
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
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 12,
  },
  paletteContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    backgroundColor: 'green'
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
