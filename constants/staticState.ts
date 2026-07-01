import { Archive, Pin, Trash2, X } from "lucide-react-native";

export const topToolbar = [
    { id: 'archived', icon: Archive, text: 'Archive' },
    { id: 'pinned', icon: Pin, text: 'Pin' },
    { id: 'trashed', icon: Trash2, text: 'Delete' },
    { id: 'close', icon: X, text: 'Close', alignleft: true, showCount: true }
]