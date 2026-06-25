import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet } from 'react-native';
import { Settings, HelpCircle, Archive, Trash2, Tag, Bell, FileText } from 'lucide-react-native';

const TOMATO_RED = '#FF6347';

function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#FFF' : '#333';
  const iconColor = isDark ? '#AAA' : '#666';

  const currentRouteName = props.state.routes[props.state.index].name;

  const getDrawerItemProps = (routeName: string) => {
    const isFocused = currentRouteName === routeName;
    return {
      focused: isFocused,
      activeTintColor: TOMATO_RED,
      inactiveTintColor: textColor,
      activeBackgroundColor: isDark ? '#333' : '#FFF0EE',
      labelStyle: { color: isFocused ? TOMATO_RED : textColor, fontWeight: '500' },
      onPress: () => props.navigation.navigate(routeName),
    };
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: TOMATO_RED }]}>Keep Notes</Text>
      </View>
      
      <DrawerItem
        label="Notes"
        icon={({ size }) => <FileText color={currentRouteName === 'index' ? TOMATO_RED : iconColor} size={size} />}
        {...getDrawerItemProps('index')}
      />
      <DrawerItem
        label="Labels"
        icon={({ size }) => <Tag color={currentRouteName === 'labels' ? TOMATO_RED : iconColor} size={size} />}
        {...getDrawerItemProps('labels')}
      />
      <DrawerItem
        label="Reminders"
        icon={({ size }) => <Bell color={currentRouteName === 'reminders' ? TOMATO_RED : iconColor} size={size} />}
        {...getDrawerItemProps('reminders')}
      />
      
      <View style={styles.divider} />
      
      <DrawerItem
        label="Archive"
        icon={({ size }) => <Archive color={currentRouteName === 'archive' ? TOMATO_RED : iconColor} size={size} />}
        {...getDrawerItemProps('archive')}
      />
      <DrawerItem
        label="Trash"
        icon={({ size }) => <Trash2 color={currentRouteName === 'trash' ? TOMATO_RED : iconColor} size={size} />}
        {...getDrawerItemProps('trash')}
      />
      
      <View style={styles.divider} />
      
      <DrawerItem
        label="Settings"
        icon={({ size }) => <Settings color={currentRouteName === 'settings' ? TOMATO_RED : iconColor} size={size} />}
        {...getDrawerItemProps('settings')}
      />
      <DrawerItem
        label="Help & feedback"
        icon={({ size }) => <HelpCircle color={iconColor} size={size} />}
        onPress={() => {}}
        labelStyle={{ color: textColor }}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: isDark ? '#333' : '#FFF0EE',
        drawerActiveTintColor: TOMATO_RED,
        drawerInactiveTintColor: isDark ? '#CCC' : '#333',
        drawerStyle: {
          backgroundColor: isDark ? '#111' : '#FFF',
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
    fontWeight: 'bold',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
});
