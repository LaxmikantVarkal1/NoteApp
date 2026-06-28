import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { FilterIcon, Menu, Pin, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { notes, loadNotes, searchQuery, setSearchQuery, tags } = useNoteStore();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTags, setShowTags] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const notesArray = Object.values(notes).sort((a, b) => b.createdAt - a.createdAt);

  const filteredNotes = notesArray.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? n.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const otherNotes = filteredNotes.filter((n) => !n.pinned);

  const renderNoteColumns = (notesToRender: any[]) => {
    const leftColumn = notesToRender.filter((_, i) => i % 2 === 0);
    const rightColumn = notesToRender.filter((_, i) => i % 2 !== 0);

    return (
      <View style={styles.columnsContainer}>
        <View style={styles.column}>
          {leftColumn.map((note, index) => <NoteCard key={note.id} note={note} index={index} />)}
        </View>
        <View style={styles.column}>
          {rightColumn.map((note, index) => <NoteCard key={note.id} note={note} index={index} />)}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <View style={[styles.searchContainer, { backgroundColor: themeColors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
          <Menu color={themeColors.text} size={24} />
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search your notes"
          placeholderTextColor={themeColors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity>
          <FilterIcon onPress={() => setShowTags(!showTags)} color={themeColors.text} size={20} />
          {(selectedTag?.length || 0) > 0 && <View style={{ position: 'absolute', backgroundColor: themeColors.tomatoRed, width: 6, height: 6, borderRadius: 6 }} />}
        </TouchableOpacity>
      </View>

      {/* Horizontal tag filter bar */}
      {(tags.length > 0 && showTags) && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedTag && { backgroundColor: themeColors.tomatoRed, borderColor: themeColors.tomatoRed },
                { borderColor: themeColors.border }
              ]}
              onPress={() => setSelectedTag(null)}
            >
              <Text style={[
                styles.filterChipText,
                { color: !selectedTag ? '#FFF' : themeColors.text }
              ]}>All</Text>
            </TouchableOpacity>
            {tags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.filterChip,
                    isSelected && { backgroundColor: themeColors.tomatoRed, borderColor: themeColors.tomatoRed },
                    { borderColor: themeColors.border }
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFF' : themeColors.text }
                  ]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notesArray.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Keep your thoughts organized</Text>
            <Text style={[styles.emptySub, { color: themeColors.subtitle }]}>Notes you add appear here</Text>
          </View>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: themeColors.subtitle }]}>PINNED</Text>
                {renderNoteColumns(pinnedNotes)}
              </>
            )}
            {otherNotes.length > 0 && (
              <>
                {pinnedNotes.length > 0 && <Text style={[styles.sectionTitle, { color: themeColors.subtitle, marginTop: 20 }]}>OTHERS</Text>}
                {renderNoteColumns(otherNotes)}
              </>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColors.tomatoRed }]}
        onPress={() => router.push('/note/new')}
      >
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>
    </View>
  );
}

function stripHtml(html: string) {
  if (!html) return '';
  // Replace common block tags with a space so words don't merge
  const withSpaces = html.replace(/<\/(p|div|li|h[1-6])>/gi, ' ').replace(/<br\s*\/?>/gi, ' ');
  return withSpaces.replace(/<[^>]*>?/gm, '').trim();
}

function NoteCard({ note, index }: { note: any; index: number }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const bgColor = note.color || themeColors.cardBackground;
  const plainTextContent = stripHtml(note.content);

  if (note.trashed) return null;

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: bgColor, borderColor: isDark? themeColors.border : themeColors.iconSubtle }]}
        onPress={() => router.push(`/note/${note.id}`)}
      >
        {note.title ? <Text style={[styles.noteTitle, { color: themeColors.text }]}>{note.title}</Text> : null}
        {plainTextContent ? (
          <Text style={[styles.noteContent, { color: themeColors.text }]} numberOfLines={6}>
            {plainTextContent}
          </Text>
        ) : null}
        {note.pinned && <Pin size={16} color={themeColors.icon} style={styles.pinIcon} />}
        {note.tags && note.tags.length > 0 && (
          <View style={styles.cardTagsContainer}>
            {note.tags.map((tag: string) => (
              <View key={tag} style={[styles.cardTagChip, { backgroundColor: themeColors.tagChipBg }]}>
                <Text style={[styles.cardTagChipText, { color: themeColors.tagChipText }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: Typography.regular,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    marginTop: 20,
  },
  emptySub: {
    fontSize: 16,
    fontFamily: Typography.regular,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Typography.bold,
    marginBottom: 12,
    marginLeft: 4,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: Typography.bold,
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    fontFamily: Typography.regular,
    lineHeight: 20,
  },
  pinIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  filterContainer: {
    height: 48,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: Typography.medium,
  },
  cardTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  cardTagChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardTagChipText: {
    fontSize: 10,
    fontFamily: Typography.medium,
  },
});
