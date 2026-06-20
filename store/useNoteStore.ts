import { create } from 'zustand';
import { Note, loadNotesFromFS, saveNotesToFS } from './fs';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: true,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  loadNotes: async () => {
    set({ isLoading: true });
    const notes = await loadNotesFromFS();
    set({ notes, isLoading: false });
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
  }
}));
