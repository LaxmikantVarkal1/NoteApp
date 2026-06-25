import { create } from 'zustand';
import { Note, loadNotesFromFS, saveNotesToFS, loadTagsFromFS, saveTagsToFS, loadSettingsFromFS, saveSettingsToFS, SettingsData } from './fs';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

interface NoteState {
  notes: Note[];
  tags: string[];
  settings: SettingsData;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  addTag: (tag: string) => Promise<void>;
  deleteTag: (tag: string) => Promise<void>;
  updateTag: (oldTag: string, newTag: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  unarchiveNote: (id: string) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  deleteNotePermanently: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  setTrashAutoDeleteDays: (days: number) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  tags: [],
  settings: { trashAutoDeleteDays: 30 },
  isLoading: true,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  loadNotes: async () => {
    set({ isLoading: true });
    const notes = await loadNotesFromFS();
    const tags = await loadTagsFromFS();
    const settings = await loadSettingsFromFS();
    
    // Auto-delete trash cleanup
    const now = Date.now();
    const retentionPeriod = settings.trashAutoDeleteDays * 24 * 60 * 60 * 1000;
    
    let cleanNotes = notes;
    if (settings.trashAutoDeleteDays > 0) {
      cleanNotes = notes.filter((n) => {
        if (n.trashed && n.deletedAt) {
          return now - n.deletedAt < retentionPeriod;
        }
        return true;
      });
    } else if (settings.trashAutoDeleteDays === 0) {
      // 0 means delete immediately (which would delete all trashed notes upon reload)
      cleanNotes = notes.filter((n) => !n.trashed);
    }
    
    set({ notes: cleanNotes, tags, settings, isLoading: false });
    if (cleanNotes.length !== notes.length) {
      await saveNotesToFS(cleanNotes);
    }
  },
  addNote: async (note) => {
    const newNote: Note = {
      ...note,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedNotes = [newNote, ...get().notes];
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  updateNote: async (id, updatedFields) => {
    const updatedNotes = get().notes.map((n) =>
      n.id === id ? { ...n, ...updatedFields, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  deleteNote: async (id) => {
    const updatedNotes = get().notes.filter((n) => n.id !== id);
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  togglePin: async (id) => {
    const updatedNotes = get().notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  addTag: async (tag) => {
    const cleanTag = tag.trim();
    if (!cleanTag || get().tags.includes(cleanTag)) return;
    const updatedTags = [...get().tags, cleanTag];
    set({ tags: updatedTags });
    await saveTagsToFS(updatedTags);
  },
  deleteTag: async (tagToDelete) => {
    const updatedTags = get().tags.filter((t) => t !== tagToDelete);
    const updatedNotes = get().notes.map((note) => {
      if (note.tags?.includes(tagToDelete)) {
        return {
          ...note,
          tags: note.tags.filter((t) => t !== tagToDelete),
          updatedAt: Date.now(),
        };
      }
      return note;
    });
    set({ tags: updatedTags, notes: updatedNotes });
    await saveTagsToFS(updatedTags);
    await saveNotesToFS(updatedNotes);
  },
  updateTag: async (oldTag, newTag) => {
    const cleanNewTag = newTag.trim();
    if (!cleanNewTag || oldTag === cleanNewTag) return;
    let updatedTags = get().tags.map((t) => (t === oldTag ? cleanNewTag : t));
    updatedTags = Array.from(new Set(updatedTags));

    const updatedNotes = get().notes.map((note) => {
      if (note.tags?.includes(oldTag)) {
        const withNewTag = note.tags.map((t) => (t === oldTag ? cleanNewTag : t));
        return {
          ...note,
          tags: Array.from(new Set(withNewTag)),
          updatedAt: Date.now(),
        };
      }
      return note;
    });
    set({ tags: updatedTags, notes: updatedNotes });
    await saveTagsToFS(updatedTags);
    await saveNotesToFS(updatedNotes);
  },
  archiveNote: async (id) => {
    const updatedNotes = get().notes.map((n) =>
      n.id === id ? { ...n, archived: true, pinned: false, trashed: false, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  unarchiveNote: async (id) => {
    const updatedNotes = get().notes.map((n) =>
      n.id === id ? { ...n, archived: false, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  trashNote: async (id) => {
    // If settings are set to immediate auto-delete (trashAutoDeleteDays === 0), delete permanently right away
    if (get().settings.trashAutoDeleteDays === 0) {
      const updatedNotes = get().notes.filter((n) => n.id !== id);
      set({ notes: updatedNotes });
      await saveNotesToFS(updatedNotes);
      return;
    }
    const updatedNotes = get().notes.map((n) =>
      n.id === id ? { ...n, trashed: true, deletedAt: Date.now(), pinned: false, archived: false, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  restoreNote: async (id) => {
    const updatedNotes = get().notes.map((n) =>
      n.id === id ? { ...n, trashed: false, deletedAt: undefined, updatedAt: Date.now() } : n
    );
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  deleteNotePermanently: async (id) => {
    const updatedNotes = get().notes.filter((n) => n.id !== id);
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  emptyTrash: async () => {
    const updatedNotes = get().notes.filter((n) => !n.trashed);
    set({ notes: updatedNotes });
    await saveNotesToFS(updatedNotes);
  },
  setTrashAutoDeleteDays: async (days) => {
    const newSettings = { trashAutoDeleteDays: days };
    set({ settings: newSettings });
    await saveSettingsToFS(newSettings);
  },
  clearAllData: async () => {
    set({ notes: [], tags: [] });
    await saveNotesToFS([]);
    await saveTagsToFS([]);
  },
}));
