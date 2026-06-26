import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNoteStore } from "@/store/useNoteStore";
import { router, useNavigation } from "expo-router";
import { Check, Plus, Tag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function SelectionList() {
    const [newTagInput, setNewTagInput] = useState('');
    const tags = useNoteStore((s) => s.tags);
    const isDark = useColorScheme() === 'dark';
    const { selectedTags, setSelectedTags, addTag } = useNoteStore();
    const { height } = useWindowDimensions();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            sheetAllowedDetents: [0.3, 0.8],
        });
    }, [])

    const toggleTagSelection = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    function handleSelect(tag: string) {

    }

    function handleCreateAndSelectTag() {
        const cleanTag = newTagInput.trim();
        if (!cleanTag) return;
        addTag(cleanTag);
        if (!selectedTags.includes(cleanTag)) {
            setSelectedTags([...selectedTags, cleanTag]);
        }
        setNewTagInput('');
    };

    function handleSaveAndGoBack() {
        router.back();
    }
    return (
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#222' : '#ffffff06' }]}>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#333' }]}>Label note</Text>
                <TouchableOpacity onPress={handleSaveAndGoBack}>
                    <Text style={{ color: '#FF6347', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
            </View>


            {/* Quick search/create input */}
            <View style={[styles.modalInputRow, { borderBottomColor: isDark ? '#444' : '#E0E0E0' }]}>
                <Tag color={isDark ? '#AAA' : '#666'} size={18} />
                <TextInput
                    style={[styles.modalInput, { color: isDark ? '#FFF' : '#333' }]}
                    placeholder="Enter label name"
                    placeholderTextColor={isDark ? '#AAA' : '#888'}
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    onSubmitEditing={handleCreateAndSelectTag}
                />

                <TouchableOpacity onPress={newTagInput.trim() !== '' ? handleCreateAndSelectTag : () => { }}>
                    <Plus color={newTagInput.trim() !== '' ? "#FF6347" : "#b5b3b3ff"} size={22} />
                </TouchableOpacity>

            </View>

            <ScrollView style={{ maxHeight: height - 250 }}>
                {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                        <TouchableOpacity
                            key={tag}
                            style={styles.modalTagItem}
                            onPress={() => toggleTagSelection(tag)}
                        >
                            <Tag color={isDark ? '#AAA' : '#666'} size={18} />
                            <Text style={[styles.modalTagText, { color: isDark ? '#FFF' : '#333' }]}>{tag}</Text>
                            <View style={[
                                styles.checkbox,
                                { borderColor: isDark ? '#555' : '#CCC' },
                                isSelected && { backgroundColor: '#FF6347', borderColor: '#FF6347' }
                            ]}>
                                {isSelected && <Check color="#FFF" size={12} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {tags.length === 0 && (
                    <Text style={{ textAlign: 'center', color: isDark ? '#777' : '#999', marginVertical: 20 }}>
                        No labels found. Create one above!
                    </Text>
                )}
            </ScrollView>

        </View>
    );
}


const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalDismissArea: {
        flex: 1,
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    modalInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    modalTagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    modalTagText: {
        flex: 1,
        fontSize: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
