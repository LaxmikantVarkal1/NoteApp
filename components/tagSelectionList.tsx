import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNoteStore } from "@/store/useNoteStore";
import { router } from "expo-router";
import { Check, Plus, Tag } from "lucide-react-native";
import { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Colors, Typography } from "@/constants/theme";

export default function SelectionList() {
    const [newTagInput, setNewTagInput] = useState('');
    const tags = useNoteStore((s) => s.tags);
    const isDark = useColorScheme() === 'dark';
    const themeColors = isDark ? Colors.dark : Colors.light;
    const { selectedTags, setSelectedTags, addTag } = useNoteStore();
    const { height } = useWindowDimensions();



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
        <View style={[styles.modalContent, { backgroundColor: themeColors.menuBg }]}>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Label note</Text>
                <TouchableOpacity onPress={handleSaveAndGoBack}>
                    <Text style={{ color: themeColors.tomatoRed, fontFamily: Typography.bold, fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
            </View>


            {/* Quick search/create input */}
            <View style={[styles.modalInputRow, { borderBottomColor: themeColors.border }]}>
                <Tag color={themeColors.icon} size={18} />
                <TextInput
                    style={[styles.modalInput, { color: themeColors.text }]}
                    placeholder="Enter label name"
                    placeholderTextColor={themeColors.placeholder}
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    onSubmitEditing={handleCreateAndSelectTag}
                />

                <TouchableOpacity onPress={newTagInput.trim() !== '' ? handleCreateAndSelectTag : () => { }}>
                    <Plus color={newTagInput.trim() !== '' ? themeColors.tomatoRed : themeColors.iconSubtle} size={22} />
                </TouchableOpacity>

            </View>

            <ScrollView nestedScrollEnabled={true}
                style={{ maxHeight: height - 250 }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 5
                }} >
                {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                        <TouchableOpacity
                            key={tag}
                            style={styles.modalTagItem}
                            onPress={() => toggleTagSelection(tag)}
                        >
                            <Tag color={themeColors.icon} size={18} />
                            <Text style={[styles.modalTagText, { color: themeColors.text }]}>{tag}</Text>
                            <View style={[
                                styles.checkbox,
                                { borderColor: themeColors.borderLight },
                                isSelected && { backgroundColor: themeColors.tomatoRed, borderColor: themeColors.tomatoRed }
                            ]}>
                                {isSelected && <Check color="#FFF" size={12} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {tags.length === 0 && (
                    <Text style={{ textAlign: 'center', color: themeColors.subtitle, fontFamily: Typography.regular, marginVertical: 20 }}>
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
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 16,
        height: "100%"
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: Typography.bold,
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
        fontFamily: Typography.regular,
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
        fontFamily: Typography.regular,
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
