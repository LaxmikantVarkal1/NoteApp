import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { Menu, Pin, Plus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOMATO_RED = '#FF6347';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { notes, loadNotes, searchQuery, setSearchQuery } = useNoteStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#FFF', paddingTop: insets.top }]}>
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#333' : '#F1F3F4' }]}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
          <Menu color={isDark ? '#FFF' : '#333'} size={24} />
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFF' : '#333' }]}
          placeholder="Search your notes"
          placeholderTextColor={isDark ? '#AAA' : '#666'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {/* <TouchableOpacity>
          <Grid color={isDark ? '#FFF' : '#333'} size={24} />
        </TouchableOpacity> */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#333' }]}>Keep your thoughts organized</Text>
            <Text style={[styles.emptySub, { color: isDark ? '#AAA' : '#666' }]}>Notes you add appear here</Text>
          </View>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: isDark ? '#AAA' : '#666' }]}>PINNED</Text>
                {renderNoteColumns(pinnedNotes)}
              </>
            )}
            {otherNotes.length > 0 && (
              <>
                {pinnedNotes.length > 0 && <Text style={[styles.sectionTitle, { color: isDark ? '#AAA' : '#666', marginTop: 20 }]}>OTHERS</Text>}
                {renderNoteColumns(otherNotes)}
              </>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: TOMATO_RED }]}
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
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
});
