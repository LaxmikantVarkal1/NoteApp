import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { Menu, Pin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { notes, loadNotes } = useNoteStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Filter archived and non-trashed notes matching search query
  const archivedNotes = notes.filter((n) => 
    n.archived && 
    !n.trashed && 
    (n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
    if (isCloseToBottom && visibleCount < archivedNotes.length) {
      setVisibleCount((prev) => prev + 20);
    }
  };

  const renderNoteColumns = (notesToRender: any[]) => {
    const visibleNotes = notesToRender.slice(0, visibleCount);
    const leftColumn = visibleNotes.filter((_, i) => i % 2 === 0);
    const rightColumn = visibleNotes.filter((_, i) => i % 2 !== 0);

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
    <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#FFF', paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#333' : '#F1F3F4' }]}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
          <Menu color={isDark ? '#FFF' : '#333'} size={24} />
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFF' : '#333' }]}
          placeholder="Search archived notes"
          placeholderTextColor={isDark ? '#AAA' : '#666'}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setVisibleCount(20);
          }}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {archivedNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#333' }]}>No archived notes</Text>
            <Text style={[styles.emptySub, { color: isDark ? '#AAA' : '#666' }]}>Notes you archive appear here</Text>
          </View>
        ) : (
          renderNoteColumns(archivedNotes)
        )}
      </ScrollView>
    </View>
  );
}

function stripHtml(html: string) {
  if (!html) return '';
  const withSpaces = html.replace(/<\/(p|div|li|h[1-6])>/gi, ' ').replace(/<br\s*\/?>/gi, ' ');
  return withSpaces.replace(/<[^>]*>?/gm, '').trim();
}

function NoteCard({ note, index }: { note: any; index: number }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = note.color || (isDark ? '#333' : '#FFF');
  const plainTextContent = stripHtml(note.content);

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: bgColor, borderColor: isDark ? '#444' : '#E0E0E0' }]}
        onPress={() => router.push(`/note/${note.id}`)}
      >
        {note.title ? <Text style={[styles.noteTitle, { color: isDark ? '#FFF' : '#333' }]}>{note.title}</Text> : null}
        {plainTextContent ? (
          <Text style={[styles.noteContent, { color: isDark ? '#DDD' : '#555' }]} numberOfLines={6}>
            {plainTextContent}
          </Text>
        ) : null}
        {note.pinned && <Pin size={16} color={isDark ? '#AAA' : '#666'} style={styles.pinIcon} />}
        
        {note.tags && note.tags.length > 0 && (
          <View style={styles.cardTagsContainer}>
            {note.tags.map((tag: string) => (
              <View key={tag} style={[styles.cardTagChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.cardTagChipText, { color: isDark ? '#CCC' : '#666' }]}>{tag}</Text>
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
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 16,
    marginTop: 8,
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  pinIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    fontWeight: '500',
  },
});
