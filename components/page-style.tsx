import bgPatterns from "@/constants/bg";
import { Colors, CustomFonts, NoteColors } from "@/constants/theme";
import { usePageStyle } from "@/store/useNoteStore";
import { Check } from "lucide-react-native";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    useWindowDimensions,
    View,
} from "react-native";
import { SvgXml } from "react-native-svg";

const FONT_SIZES = [12, 14, 16, 18, 20, 24];

export default function PageStyle() {
    const {
        color, setColor,
        backgroundPattern, setBackgroundPattern,
        selectedFont, setSelectedFont,
        fontSize, setFontSize,
        textAlign, setTextAlign,
    } = usePageStyle();

    const isDark = useColorScheme() === "dark";
    const colors = isDark ? NoteColors.dark : NoteColors.light;
    const themeColors = isDark ? Colors.dark : Colors.light;
    const { width } = useWindowDimensions();

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={[styles.sectionTitle, { color: themeColors.subtitle }]}>{title}</Text>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: themeColors.background }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Background Color ── */}
            <SectionHeader title="Background Color" />
            <View style={styles.colorRow}>
                {colors.map((c, i) => {
                    const isSelected = color === c || (i === 0 && !color);
                    return (
                        <TouchableOpacity
                            key={c}
                            style={[
                                styles.colorCircle,
                                {
                                    backgroundColor: c,
                                    borderWidth: isSelected ? 2.5 : 1,
                                    borderColor: isSelected ? themeColors.border : themeColors.borderLight,
                                },
                            ]}
                            onPress={() => setColor(i === 0 ? "" : c)}
                        >
                            {isSelected && (
                                <Check
                                    size={14}
                                    color={isDark ? "#fff" : "#333"}
                                    strokeWidth={3}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── Background Pattern ── */}
            <SectionHeader title="Background Pattern" />
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.patternRow}
            >
                {bgPatterns.map((pattern) => {
                    const isSelected =
                        backgroundPattern === pattern.id ||
                        (pattern.id === "none" && !backgroundPattern);
                    return (
                        <TouchableOpacity
                            key={pattern.id}
                            style={[
                                styles.patternCard,
                                {
                                    borderWidth: isSelected ? 2.5 : 1,
                                    borderColor: isSelected ? themeColors.icon : themeColors.border,
                                    backgroundColor: themeColors.cardBackground,
                                },
                            ]}
                            onPress={() =>
                                setBackgroundPattern(pattern.id === "none" ? "" : pattern.id)
                            }
                        >
                            {pattern.svg ? (
                                <SvgXml
                                    xml={pattern.svg}
                                    width="100%"
                                    height="100%"
                                    style={StyleSheet.absoluteFillObject}
                                />
                            ) : null}
                            <View style={styles.patternLabelBadge}>
                                <Text
                                    style={[
                                        styles.patternLabel,
                                        { color: isSelected ? themeColors.tint : themeColors.subtitle },
                                    ]}
                                >
                                    {pattern.name}
                                </Text>
                            </View>
                            {isSelected && (
                                <View style={styles.patternCheck}>
                                    <Check size={10} color={themeColors.tint} strokeWidth={3} />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* ── Font Size ── 
            <SectionHeader title="Font Size" />
            <View style={styles.fontSizeRow}>
                {FONT_SIZES.map((size) => {
                    const isSelected = fontSize === size;
                    return (
                        <TouchableOpacity
                            key={size}
                            style={[
                                styles.fontSizeChip,
                                {
                                    backgroundColor: isSelected
                                        ? themeColors.tint
                                        : themeColors.cardBackground,
                                    borderColor: isSelected ? themeColors.border : themeColors.borderLight,
                                },
                            ]}
                            onPress={() => setFontSize(size)}
                        >
                            <Text
                                style={[
                                    styles.fontSizeLabel,
                                    { color: isSelected ? "#fff" : themeColors.text },
                                ]}
                            >
                                {size}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>*/}

            {/* ── Text Alignment ── 
            <SectionHeader title="Text Alignment" />
            <View style={styles.alignRow}>
                {(
                    [
                        { align: "left" as const, Icon: AlignLeft, label: "Left" },
                        { align: "center" as const, Icon: AlignCenter, label: "Center" },
                        { align: "right" as const, Icon: AlignRight, label: "Right" },
                    ] as const
                ).map(({ align, Icon, label }) => {
                    const isSelected = textAlign === align;
                    return (
                        <TouchableOpacity
                            key={align}
                            style={[
                                styles.alignChip,
                                {
                                    backgroundColor: isSelected
                                        ? themeColors.tint
                                        : themeColors.cardBackground,
                                    borderColor: isSelected ? themeColors.border : themeColors.borderLight,
                                    flex: 1,
                                },
                            ]}
                            onPress={() => setTextAlign(align)}
                        >
                            <Icon
                                size={18}
                                color={isSelected ? "#fff" : themeColors.icon}
                                strokeWidth={2}
                            />
                            <Text
                                style={[
                                    styles.alignLabel,
                                    { color: isSelected ? "#fff" : themeColors.text },
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>*/}

            {/* ── Font Style ── */}
            <SectionHeader title="Font Style" />
            <View style={{ gap: 4 }}>
                {Object.keys(CustomFonts).map((font, index) => {
                    const isSelected = selectedFont === font;
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setSelectedFont(font)}
                            style={[
                                styles.fontRow,
                                {
                                    backgroundColor: isSelected
                                        ? themeColors.tabActiveBg
                                        : themeColors.background,
                                    borderColor: isSelected ? themeColors.border : "transparent",
                                    width: width - 40,
                                },
                            ]}
                        >
                            <View>
                                <Text
                                    style={[
                                        styles.fontName,
                                        { color: themeColors.text },
                                    ]}
                                >
                                    {font}
                                </Text>
                                {/* <Text
                                    style={[
                                        styles.fontPreview,
                                        { color: themeColors.subtitle },
                                    ]}
                                >
                                    The quick brown fox
                                </Text> */}
                            </View>
                            {isSelected && (
                                <Check size={16} color={themeColors.tint} strokeWidth={2.5} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: "NotoSans-Bold",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginTop: 8,
        marginBottom: 4,
    },
    /* Colors */
    colorRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    colorCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
    },
    /* Patterns */
    patternRow: {
        flexDirection: "row",
        gap: 10,
        paddingBottom: 4,
    },
    patternCard: {
        width: 80,
        height: 80,
        borderRadius: 10,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
    },
    patternLabelBadge: {
        paddingHorizontal: 4,
        paddingBottom: 5,
    },
    patternLabel: {
        fontSize: 10,
        fontFamily: "NotoSans-Bold",
        textAlign: "center",
    },
    patternCheck: {
        position: "absolute",
        top: 4,
        right: 4,
    },
    /* Font Size */
    fontSizeRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    fontSizeChip: {
        minWidth: 46,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    fontSizeLabel: {
        fontSize: 13,
        fontFamily: "NotoSans-Bold",
    },
    /* Alignment */
    alignRow: {
        flexDirection: "row",
        gap: 8,
    },
    alignChip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    alignLabel: {
        fontSize: 13,
        fontFamily: "NotoSans-Bold",
    },
    /* Fonts */
    fontRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    fontName: {
        fontSize: 13,
        fontFamily: "NotoSans-Bold",
        marginBottom: 2,
    },
    fontPreview: {
        fontSize: 11,
    },
});