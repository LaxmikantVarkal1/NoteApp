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
  backgroundPattern?: string;
  archived?: boolean;
  trashed?: boolean;
  deletedAt?: number;
}

export interface SettingsData {
  trashAutoDeleteDays: number;
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

const tagsFile = new File(Paths.document, 'tags.json');

export const loadTagsFromFS = async (): Promise<string[]> => {
  try {
    if (!tagsFile.exists) {
      return [];
    }
    const content = await tagsFile.text();
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load tags:", error);
    return [];
  }
};

export const saveTagsToFS = async (tags: string[]) => {
  try {
    tagsFile.write(JSON.stringify(tags));
  } catch (error) {
    console.error("Failed to save tags:", error);
  }
};

const settingsFile = new File(Paths.document, 'settings.json');

export const loadSettingsFromFS = async (): Promise<SettingsData> => {
  try {
    if (!settingsFile.exists) {
      return { trashAutoDeleteDays: 30 };
    }
    const content = await settingsFile.text();
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return { trashAutoDeleteDays: 30 };
  }
};

export const saveSettingsToFS = async (settings: SettingsData) => {
  try {
    settingsFile.write(JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};
