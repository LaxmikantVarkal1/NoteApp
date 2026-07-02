import PageStyle from '@/components/page-style';
import SelectionList from '@/components/tagSelectionList';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function CustomModal() {
    const { screenName } = useLocalSearchParams<{ screenName: string }>();


    if (screenName === "labels") {
        return (
            <View style={styles.container}>
                <SelectionList />
            </View>
        )
    }

    if (screenName === "pageStyle") {
        return (
            <View style={styles.container}>
                <PageStyle />
            </View>
        )
    }
    return (
        <View style={styles.container}>
            <Text>Modal is empty, check rout</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

});
