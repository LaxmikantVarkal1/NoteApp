import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { loadNotesFromFS, loadSettingsFromFS, loadTagsFromFS, Note, saveNotesToFS, saveSettingsToFS, saveTagsToFS, SettingsData } from './fs';

interface NoteState {
  notes: Record<string, Note>;
  tags: string[];
  selectedTags: string[];
  settings: SettingsData;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  updateMultipleNotes: (ids: string[], action: 'archive' | 'pin' | 'delete') => Promise<void>;
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
  setSelectedTags: any
}

interface selectedTagsState {
  selectedTags: string[];
  tags: string[];
  addTags: (tag: string) => void;
  setSelectedTags: any
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: {},
  tags: [],
  selectedTags: [],
  settings: { trashAutoDeleteDays: 30 },
  isLoading: true,

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  loadNotes: async () => {
    set({ isLoading: true });
    const notesArray = await loadNotesFromFS();
    const tags = await loadTagsFromFS();
    const settings = await loadSettingsFromFS();
    console.log(notesArray[0])

    const notesRecord: Record<string, Note> = {};
    notesArray.forEach((n) => {
      notesRecord[n.id] = n;
    });

    // Auto-delete trash cleanup
    const now = Date.now();
    const retentionPeriod = settings.trashAutoDeleteDays * 24 * 60 * 60 * 1000;

    const cleanNotesRecord: Record<string, Note> = {};
    let hasChanges = false;
    Object.values(notesRecord).forEach((n) => {
      if (settings.trashAutoDeleteDays > 0) {
        if (n.trashed && n.deletedAt) {
          if (now - n.deletedAt >= retentionPeriod) {
            hasChanges = true;
            return;
          }
        }
      } else if (settings.trashAutoDeleteDays === 0) {
        if (n.trashed) {
          hasChanges = true;
          return;
        }
      }
      cleanNotesRecord[n.id] = n;
    });

    set({ notes: cleanNotesRecord, tags, settings, isLoading: false });
    if (hasChanges) {
      await saveNotesToFS(Object.values(cleanNotesRecord));
    }
  },
  addNote: async (note) => {
    const newId = uuidv4();
    const newNote: Note = {
      ...note,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedNotes = {
      [newId]: newNote,
      ...get().notes,
    };
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  updateNote: async (id, updatedFields) => {
    const currentNotes = get().notes;
    if (!currentNotes[id]) return;
    const updatedNotes = {
      ...currentNotes,
      [id]: {
        ...currentNotes[id],
        ...updatedFields,
        updatedAt: Date.now(),
      },
    };
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  updateMultipleNotes: async (ids: string[], action: string) => {
    const currentNotes = get().notes;
    const updatedNotes: any = { ...currentNotes };
    ids.forEach((id: string) => {
      if (updatedNotes[id]) {
        updatedNotes[id] = {
          ...updatedNotes[id],
          [action]: !updatedNotes[id][action],
          updatedAt: Date.now(),
        };
      }
    });
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  deleteNote: async (id) => {
    const updatedNotes = { ...get().notes };
    delete updatedNotes[id];
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  togglePin: async (id) => {
    const currentNotes = get().notes;
    if (!currentNotes[id]) return;
    const updatedNotes = {
      ...currentNotes,
      [id]: {
        ...currentNotes[id],
        pinned: !currentNotes[id].pinned,
        updatedAt: Date.now(),
      },
    };
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },

  // tag functions
  addTag: async (tag) => {
    const cleanTag = tag.trim();
    if (!cleanTag || get().tags.includes(cleanTag)) return;
    const updatedTags = [...get().tags, cleanTag];
    set({ tags: updatedTags });
    await saveTagsToFS(updatedTags);
  },
  deleteTag: async (tagToDelete) => {
    const updatedTags = get().tags.filter((t) => t !== tagToDelete);
    const updatedNotes = { ...get().notes };
    let hasChanges = false;
    Object.keys(updatedNotes).forEach((id) => {
      const note = updatedNotes[id];
      if (note.tags?.includes(tagToDelete)) {
        hasChanges = true;
        updatedNotes[id] = {
          ...note,
          tags: note.tags.filter((t) => t !== tagToDelete),
          updatedAt: Date.now(),
        };
      }
    });
    set({ tags: updatedTags, notes: updatedNotes });
    await saveTagsToFS(updatedTags);
    if (hasChanges) {
      await saveNotesToFS(Object.values(updatedNotes));
    }
  },
  updateTag: async (oldTag, newTag) => {
    const cleanNewTag = newTag.trim();
    if (!cleanNewTag || oldTag === cleanNewTag) return;
    let updatedTags = get().tags.map((t) => (t === oldTag ? cleanNewTag : t));
    updatedTags = Array.from(new Set(updatedTags));

    const updatedNotes = { ...get().notes };
    let hasChanges = false;
    Object.keys(updatedNotes).forEach((id) => {
      const note = updatedNotes[id];
      if (note.tags?.includes(oldTag)) {
        hasChanges = true;
        const withNewTag = note.tags.map((t) => (t === oldTag ? cleanNewTag : t));
        updatedNotes[id] = {
          ...note,
          tags: Array.from(new Set(withNewTag)),
          updatedAt: Date.now(),
        };
      }
    });
    set({ tags: updatedTags, notes: updatedNotes });
    await saveTagsToFS(updatedTags);
    if (hasChanges) {
      await saveNotesToFS(Object.values(updatedNotes));
    }
  },
  setSelectedTags: (tag: string) => {
    set((state) => ({
      selectedTags: Array.isArray(tag) ? tag : Array.from(new Set([...state.selectedTags, tag]))
    }))
  },

  //  note functions
  archiveNote: async (id) => {
    const currentNotes = get().notes;
    if (!currentNotes[id]) return;
    const updatedNotes = {
      ...currentNotes,
      [id]: {
        ...currentNotes[id],
        archived: true,
        pinned: false,
        trashed: false,
        updatedAt: Date.now(),
      },
    };
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  unarchiveNote: async (id) => {
    const currentNotes = get().notes;
    if (!currentNotes[id]) return;
    const updatedNotes = {
      ...currentNotes,
      [id]: {
        ...currentNotes[id],
        archived: false,
        updatedAt: Date.now(),
      },
    };
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  trashNote: async (id) => {
    if (get().settings.trashAutoDeleteDays === 0) {
      const updatedNotes = { ...get().notes };
      delete updatedNotes[id];
      set({ notes: updatedNotes });
      await saveNotesToFS(Object.values(updatedNotes));
      return;
    }
    const currentNotes = get().notes;
    if (!currentNotes[id]) return;
    const updatedNotes = {
      ...currentNotes,
      [id]: {
        ...currentNotes[id],
        trashed: true,
        deletedAt: Date.now(),
        pinned: false,
        archived: false,
        updatedAt: Date.now(),
      },
    };
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  restoreNote: async (id) => {
    const currentNotes = get().notes;
    if (!currentNotes[id]) return;
    const updatedNotes = {
      ...currentNotes,
      [id]: {
        ...currentNotes[id],
        trashed: false,
        deletedAt: undefined,
        updatedAt: Date.now(),
      },
    };
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  deleteNotePermanently: async (id) => {
    const updatedNotes = { ...get().notes };
    delete updatedNotes[id];
    set({ notes: updatedNotes });
    await saveNotesToFS(Object.values(updatedNotes));
  },
  emptyTrash: async () => {
    const updatedNotes = { ...get().notes };
    let hasChanges = false;
    Object.keys(updatedNotes).forEach((id) => {
      if (updatedNotes[id].trashed) {
        hasChanges = true;
        delete updatedNotes[id];
      }
    });
    if (hasChanges) {
      set({ notes: updatedNotes });
      await saveNotesToFS(Object.values(updatedNotes));
    }
  },
  setTrashAutoDeleteDays: async (days) => {
    const newSettings = { trashAutoDeleteDays: days };
    set({ settings: newSettings });
    await saveSettingsToFS(newSettings);
  },
  clearAllData: async () => {
    set({ notes: {}, tags: [] });
    await saveNotesToFS([]);
    await saveTagsToFS([]);
  },

}));