import { topToolbar } from '@/constants/staticState';
import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { DrawerActions } from '@react-navigation/native';
import { isLoading } from 'expo-font';
import { useNavigation, useRouter } from 'expo-router';
import { FilterIcon, Menu, Pin, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Extrapolation, FadeInUp, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { notes, loadNotes, searchQuery, setSearchQuery, tags } = useNoteStore();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTags, setShowTags] = useState(false);
  const [showTopActionbar, setShowTopActionbar] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<any[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const { updateMultipleNotes, isLoading } = useNoteStore();

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
  useEffect(() => {
    progress.value = withTiming(showTopActionbar ? 1 : 0, {
      duration: 300,
    });
  }, [showTopActionbar]);

  const renderNoteColumns = (notesToRender: any[], setShowTopActionbar: any, showTopActionbar: boolean) => {
    const leftColumn = notesToRender.filter((_, i) => i % 2 === 0);
    const rightColumn = notesToRender.filter((_, i) => i % 2 !== 0);

    return (
      <View style={styles.columnsContainer}>
        <View style={styles.column}>
          {leftColumn.map((note, index) => <NoteCard key={note.id} note={note} selectedNotes={selectedNotes} setSelectedNotes={setSelectedNotes} index={index} setShowTopActionbar={setShowTopActionbar} showTopActionbar={showTopActionbar} />)}
        </View>
        <View style={styles.column}>
          {rightColumn.map((note, index) => <NoteCard key={note.id} note={note} selectedNotes={selectedNotes} setSelectedNotes={setSelectedNotes} index={index} setShowTopActionbar={setShowTopActionbar} showTopActionbar={showTopActionbar} />)}
        </View>
      </View>
    );
  };
  const progress = useSharedValue(0);
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



  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>

      <Animated.View
        style={[
          containerStyle,
          { borderBottomColor: isDark ? '#0000001a' : '#ffffff95' },
        ]}
      >
        <Animated.View style={[contentStyle]}>
          <View style={[styles.notesOptions, { borderBottomColor: themeColors.border }]}>
            {topToolbar.map((tool: any) => {
              const Icon = tool.icon;
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (tool.id !== 'close') updateMultipleNotes(selectedNotes, tool.id);
                    setShowTopActionbar(false);
                    setSelectedNotes([]);
                  }}
                  style={{ padding: 10, gap: 10, flexDirection: 'row', marginLeft: tool.alignleft ? 'auto' : 0 }} key={tool.id}>
                  <Icon size={20} color={themeColors.text} />
                  {tool.showCount && <Text style={{ color: themeColors.text, fontFamily: Typography.semiBold, fontWeight: 'bold', fontSize: 14 }}> {selectedNotes.length}</Text>}
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </Animated.View>

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
                {renderNoteColumns(pinnedNotes, setShowTopActionbar, showTopActionbar)}
              </>
            )}
            {otherNotes.length > 0 && (
              <>
                {pinnedNotes.length > 0 && <Text style={[styles.sectionTitle, { color: themeColors.subtitle, marginTop: 20 }]}>OTHERS</Text>}
                {renderNoteColumns(otherNotes, setShowTopActionbar, showTopActionbar)}
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

function NoteCard({ note, index, setShowTopActionbar, showTopActionbar, selectedNotes, setSelectedNotes }: { note: any; index: number, setShowTopActionbar: any, showTopActionbar: boolean, selectedNotes: any, setSelectedNotes: any }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const bgColor = note.color || themeColors.cardBackground;
  const plainTextContent = stripHtml(note.content);

  const isSelectedNote = (noteId: string) => {
    let index = selectedNotes.findIndex((n: any) => n === noteId);
    return index > -1 ? true : false;
  };

  const toggleSelection = (noteId: string) => {
    let tempSelectedNotes = [...selectedNotes];
    if (isSelectedNote(noteId)) {
      tempSelectedNotes = tempSelectedNotes.filter((n: any) => n !== noteId);
    } else {
      tempSelectedNotes.push(noteId);
    }

    if (tempSelectedNotes.length == 0) {
      setShowTopActionbar(false)
    }
    setSelectedNotes(tempSelectedNotes);
  }

  if (note.trashed) return null;

  if (!isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={themeColors.iconActive} size={24} /></View>

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <TouchableOpacity
        onLongPress={() => {
          setShowTopActionbar(true)
          toggleSelection(note.id)
        }}
        style={[styles.noteCard, { backgroundColor: bgColor }, { borderColor: isSelectedNote(note.id) ? themeColors.iconActive : themeColors.border, borderWidth: 1 }]}
        onPress={() => {
          if (showTopActionbar) {
            toggleSelection(note.id)
          } else {
            router.push(`/note/${note.id}`);
          }
        }}
      >
        <Text style={{ color: themeColors.iconSubtle, paddingBottom: 6, fontFamily: Typography.regular, textAlign: 'left', fontSize: 10 }}>{new Date(note.createdAt).toDateString()}</Text>

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
  notesOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: '100%',
    width: '100%'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#020000ff',
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
    borderColor: "#86828215",
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
