import { File, Paths } from 'expo-file-system';

const notesFile = new File(Paths.document, 'notes.json');

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  font: string;
}

export const loadNotesFromFS = async (): Promise<Note[]> => {
  try {
    if (!notesFile.exists) {
      return [];
    }
    const content = await notesFile.text();
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load notes:", error);
    return [];
  }
};

export const saveNotesToFS = async (notes: Note[]) => {
  try {
    notesFile.write(JSON.stringify(notes));
  } catch (error) {
    console.error("Failed to save notes:", error);
  }
};
