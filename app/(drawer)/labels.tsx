import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { useNavigation, useRouter } from 'expo-router';
import { ArrowLeft, Check, Edit2, Tag, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOMATO_RED = '#FF6347';

export default function LabelsScreen() {
  const selectedTags = ["ggfgh"]
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { tags, loadNotes, addTag, deleteTag, updateTag } = useNoteStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateTag = () => {
    if (newTagName.trim() === '') return;
    addTag(newTagName.trim());
    setNewTagName('');
    setIsInputFocused(false);
  };

  const handleSaveRename = (oldTag: string) => {
    if (editingName.trim() === '' || editingName.trim() === oldTag) {
      setEditingTag(null);
      return;
    }
    updateTag(oldTag, editingName.trim());
    setEditingTag(null);
  };

  const startEditing = (tag: string) => {
    setEditingTag(tag);
    setEditingName(tag);
  };

  const itemBg = isDark ? '#222' : '#F9F9F9';
  const textColor = isDark ? '#FFF' : '#333';
  const iconColor = isDark ? '#AAA' : '#666';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#FFF', paddingTop: insets.top }]}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.iconButton}>
          <Menu color={textColor} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Edit labels</Text>
      </View> */}

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Create tag row */}
        <View style={[styles.inputRow, { borderBottomColor: isDark ? '#333' : '#E0E0E0' }]}>
          {/* <TouchableOpacity 
            onPress={() => isInputFocused ? setIsInputFocused(false) : null} 
            style={styles.actionButton}
          >
            {isInputFocused ? (
              <X color={iconColor} size={22} />
            ) : (
              <Plus color={iconColor} size={22} />
            )}
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <ArrowLeft color={textColor} size={24} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="  Create new label"
            placeholderTextColor={isDark ? '#AAA' : '#888'}
            value={newTagName}
            onChangeText={setNewTagName}
            onFocus={() => setIsInputFocused(true)}
            onSubmitEditing={handleCreateTag}
          />

          {isInputFocused && (
            <TouchableOpacity onPress={handleCreateTag} style={styles.actionButton}>
              <Check color={TOMATO_RED} size={22} />
            </TouchableOpacity>
          )}
        </View>

        {/* Existing tags list */}
        <View style={styles.listContainer}>
          {tags.map((tag) => {
            const isEditingThis = editingTag === tag;
            return (
              <View key={tag} style={[styles.tagRow, { backgroundColor: isEditingThis ? "#ff7a3d1c" : itemBg }]}>
                {isEditingThis ? (
                  <TouchableOpacity onPress={() => deleteTag(tag)} style={styles.actionButton}>
                    <Trash2 color={TOMATO_RED} size={20} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.tagIconWrapper}>
                    <Tag color={iconColor} size={20} />
                  </View>
                )}

                {isEditingThis ? (
                  <TextInput
                    style={[styles.editInput, { color: textColor }]}
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                    onSubmitEditing={() => handleSaveRename(tag)}
                    onBlur={() => handleSaveRename(tag)}
                  />
                ) : (
                  <Text style={[styles.tagText, { color: textColor }]}>{tag}</Text>
                )}

                {isEditingThis ? (
                  <TouchableOpacity onPress={() => handleSaveRename(tag)} style={styles.actionButton}>
                    <Check color={TOMATO_RED} size={20} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => startEditing(tag)} style={styles.actionButton}>
                    <Edit2 color={iconColor} size={18} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {tags.length === 0 && (
            <View style={styles.emptyContainer}>
              <Tag color={isDark ? '#333' : '#E0E0E0'} size={64} />
              <Text style={[styles.emptyText, { color: isDark ? '#555' : '#AAA' }]}>No labels created yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 0,
    height: 40,
  },
  actionButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 52,
  },
  tagIconWrapper: {
    padding: 10,
  },
  tagText: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    height: 40
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
