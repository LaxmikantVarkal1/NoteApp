import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNoteStore } from '@/store/useNoteStore';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { BarChart2, Calendar, Menu, Trash2 } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { notes, settings, setTrashAutoDeleteDays, clearAllData, loadNotes } = useNoteStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Statistics
  const notesArray = Object.values(notes);
  const totalNotes = notesArray.length;
  const activeNotes = notesArray.filter(n => !n.archived && !n.trashed).length;
  const archivedNotes = notesArray.filter(n => n.archived && !n.trashed).length;
  const trashedNotes = notesArray.filter(n => n.trashed).length;
  const pinnedNotes = notesArray.filter(n => n.pinned && !n.archived && !n.trashed).length;

  const handleClearAll = () => {
    Alert.alert(
      "Clear all data?",
      "This will permanently delete all notes and labels. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Alert.alert("Success", "All notes and labels have been deleted.");
          }
        }
      ]
    );
  };

  const retentionOptions = [
    { label: "Immediate deletion", value: 0 },
    { label: "7 Days", value: 7 },
    { label: "15 Days", value: 15 },
    { label: "30 Days", value: 30 },
  ];

  const textColor = themeColors.text;
  const subtitleColor = themeColors.subtitle;
  const itemBg = themeColors.itemBg;
  const borderColor = themeColors.border;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.iconButton}>
          <Menu color={textColor} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Retention Period Setting */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar color={themeColors.tomatoRed} size={20} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Trash Retention Period</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: subtitleColor }]}>
            Choose how long notes are kept in the Trash before being permanently deleted.
          </Text>

          <View style={[styles.optionsList, { borderColor }]}>
            {retentionOptions.map((opt, index) => {
              const isSelected = settings.trashAutoDeleteDays === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: isSelected ? themeColors.tabActiveBg : itemBg,
                      borderBottomWidth: index < retentionOptions.length - 1 ? 1 : 0,
                      borderBottomColor: borderColor
                    }
                  ]}
                  onPress={() => setTrashAutoDeleteDays(opt.value)}
                >
                  <Text style={[
                    styles.optionLabel,
                    {
                      color: isSelected ? themeColors.tomatoRed : textColor,
                      fontFamily: isSelected ? Typography.bold : Typography.regular
                    }
                  ]}>
                    {opt.label}
                  </Text>
                  <View style={[
                    styles.radioCircle,
                    { borderColor: themeColors.borderLight },
                    isSelected && { borderColor: themeColors.tomatoRed, backgroundColor: themeColors.tomatoRed }
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Note Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart2 color={themeColors.tomatoRed} size={20} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>Statistics</Text>
          </View>

          <View style={[styles.statsGrid, { backgroundColor: itemBg, borderColor }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: subtitleColor }]}>Active Notes</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{activeNotes}</Text>
            </View>
            <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: borderColor }]}>
              <Text style={[styles.statLabel, { color: subtitleColor }]}>Pinned Notes</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{pinnedNotes}</Text>
            </View>
            <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: borderColor }]}>
              <Text style={[styles.statLabel, { color: subtitleColor }]}>Archived Notes</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{archivedNotes}</Text>
            </View>
            <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: borderColor }]}>
              <Text style={[styles.statLabel, { color: subtitleColor }]}>Trashed Notes</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{trashedNotes}</Text>
            </View>
            <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: borderColor }]}>
              <Text style={[styles.statLabel, { color: subtitleColor }]}>Total Notes</Text>
              <Text style={[styles.statValue, { color: textColor, fontWeight: '700' }]}>{totalNotes}</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.tomatoRed, marginBottom: 12 }]}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: themeColors.tomatoRed }]}
            onPress={handleClearAll}
          >
            <Trash2 color={themeColors.tomatoRed} size={20} />
            <Text style={[styles.dangerButtonText, { color: themeColors.tomatoRed }]}>Clear All Data</Text>
          </TouchableOpacity>
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
    fontFamily: Typography.bold,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 30,
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.bold,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: Typography.regular,
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsList: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: Typography.regular,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  statsGrid: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 15,
    fontFamily: Typography.regular,
  },
  statValue: {
    fontSize: 15,
    fontFamily: Typography.medium,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: Typography.bold,
  },
});
