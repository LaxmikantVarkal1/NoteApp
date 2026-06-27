import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { Menu, Trash } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';

export default function TrashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { notes, loadNotes, emptyTrash, settings } = useNoteStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const trashedNotes = notes.filter((n) => n.trashed);

  const handleEmptyTrash = () => {
    if (trashedNotes.length === 0) return;
    Alert.alert(
      "Empty Trash?",
      "All notes in Trash will be permanently deleted. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Empty", 
          style: "destructive", 
          onPress: () => emptyTrash() 
        }
      ]
    );
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
    if (isCloseToBottom && visibleCount < trashedNotes.length) {
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
          {leftColumn.map((note, index) => <NoteCard key={note.id} note={note} index={index} autoDeleteDays={settings.trashAutoDeleteDays} />)}
        </View>
        <View style={styles.column}>
          {rightColumn.map((note, index) => <NoteCard key={note.id} note={note} index={index} autoDeleteDays={settings.trashAutoDeleteDays} />)}
        </View>
      </View>
    );
  };

  const textColor = themeColors.text;
  const subtitleColor = themeColors.subtitle;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.iconButton}>
          <Menu color={textColor} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Trash</Text>
        <View style={{ flex: 1 }} />
        {trashedNotes.length > 0 && (
          <TouchableOpacity onPress={handleEmptyTrash} style={styles.emptyTrashButton}>
            <Text style={[styles.emptyTrashText, { color: themeColors.tomatoRed }]}>Empty Trash</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Warning label */}
      <View style={[styles.infoBanner, { backgroundColor: themeColors.infoBannerBg }]}>
        <Text style={[styles.infoText, { color: subtitleColor }]}>
          Notes in Trash are deleted permanently after {settings.trashAutoDeleteDays} days.
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {trashedNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trash color={isDark ? '#333' : '#E0E0E0'} size={64} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>Trash is empty</Text>
          </View>
        ) : (
          renderNoteColumns(trashedNotes)
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

function NoteCard({ note, index, autoDeleteDays }: { note: any; index: number; autoDeleteDays: number }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const bgColor = note.color || themeColors.cardBackground;
  const plainTextContent = stripHtml(note.content);

  // Calculate days left
  let daysLeftText = '';
  if (note.deletedAt) {
    const elapsedMs = Date.now() - note.deletedAt;
    const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
    const left = Math.max(0, autoDeleteDays - elapsedDays);
    daysLeftText = `${left} day${left !== 1 ? 's' : ''} left`;
  }

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: bgColor, borderColor: themeColors.border }]}
        onPress={() => router.push(`/note/${note.id}`)}
      >
        {note.title ? <Text style={[styles.noteTitle, { color: themeColors.text }]}>{note.title}</Text> : null}
        {plainTextContent ? (
          <Text style={[styles.noteContent, { color: themeColors.text }]} numberOfLines={6}>
            {plainTextContent}
          </Text>
        ) : null}
        
        {daysLeftText ? (
          <View style={styles.daysLeftBadge}>
            <Text style={[styles.daysLeftText, { color: themeColors.tomatoRed }]}>{daysLeftText}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
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
    fontFamily: Typography.bold,
  },
  emptyTrashButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  emptyTrashText: {
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  infoBanner: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    fontFamily: Typography.regular,
    textAlign: 'center',
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
    fontSize: 18,
    fontFamily: Typography.bold,
    marginTop: 20,
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
  daysLeftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 10,
  },
  daysLeftText: {
    fontSize: 10,
    fontFamily: Typography.medium,
  },
});
