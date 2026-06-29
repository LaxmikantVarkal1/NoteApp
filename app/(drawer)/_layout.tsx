import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Archive, FileText, HelpCircle, Settings, Tag, Trash2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const textColor = themeColors.text;
  const iconColor = themeColors.icon;
  const tomatoRed = themeColors.tomatoRed;

  const currentRouteName = props.state.routes[props.state.index].name;

  const getDrawerItemProps: any = (routeName: string) => {
    const isFocused = currentRouteName === routeName;
    return {
      focused: isFocused,
      activeTintColor: tomatoRed,
      inactiveTintColor: textColor,
      activeBackgroundColor: themeColors.tabActiveBg,
      labelStyle: { color: isFocused ? tomatoRed : textColor, fontFamily: Typography.medium },
      onPress: () => props.navigation.navigate(routeName),
    };
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0, backgroundColor: themeColors.background }}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: themeColors.text }]}>NoteNest</Text>
      </View>

      <DrawerItem
        label="Notes"
        icon={({ size }) => <FileText color={currentRouteName === 'index' ? tomatoRed : iconColor} size={size} />}
        {...getDrawerItemProps('index')}
      />
      <DrawerItem
        label="Labels"
        icon={({ size }) => <Tag color={currentRouteName === 'labels' ? tomatoRed : iconColor} size={size} />}
        {...getDrawerItemProps('labels')}
      />

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      <DrawerItem
        label="Archive"
        icon={({ size }) => <Archive color={currentRouteName === 'archive' ? tomatoRed : iconColor} size={size} />}
        {...getDrawerItemProps('archive')}
      />
      <DrawerItem
        label="Trash"
        icon={({ size }) => <Trash2 color={currentRouteName === 'trash' ? tomatoRed : iconColor} size={size} />}
        {...getDrawerItemProps('trash')}
      />

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      <DrawerItem
        label="Settings"
        icon={({ size }) => <Settings color={currentRouteName === 'settings' ? tomatoRed : iconColor} size={size} />}
        {...getDrawerItemProps('settings')}
      />
      <DrawerItem
        label="Help & feedback"
        icon={({ size }) => <HelpCircle color={iconColor} size={size} />}
        onPress={() => { }}
        labelStyle={{ color: textColor, fontFamily: Typography.medium }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: themeColors.tabActiveBg,
        drawerActiveTintColor: themeColors.tomatoRed,
        drawerInactiveTintColor: themeColors.text,
        drawerStyle: {
          backgroundColor: themeColors.background,
          width: 300,
        },
      }}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Notes',
        }}
      />
      <Drawer.Screen
        name="labels"
        options={{
          drawerLabel: 'Labels',
        }}
      />
      <Drawer.Screen
        name="reminders"
        options={{
          drawerLabel: 'Reminders',
        }}
      />
      <Drawer.Screen
        name="archive"
        options={{
          drawerLabel: 'Archive',
        }}
      />
      <Drawer.Screen
        name="trash"
        options={{
          drawerLabel: 'Trash',
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
});
