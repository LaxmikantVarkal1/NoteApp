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

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: TOMATO_RED }]}>Keep Notes</Text>
      </View>
      
      <DrawerItemList {...props} />
      
      <View style={styles.divider} />
      
      <DrawerItem
        label="Labels"
        icon={({ color, size }) => <Tag color={iconColor} size={size} />}
        onPress={() => {}}
        labelStyle={{ color: textColor }}
      />
      <DrawerItem
        label="Archive"
        icon={({ color, size }) => <Archive color={iconColor} size={size} />}
        onPress={() => {}}
        labelStyle={{ color: textColor }}
      />
      <DrawerItem
        label="Trash"
        icon={({ color, size }) => <Trash2 color={iconColor} size={size} />}
        onPress={() => {}}
        labelStyle={{ color: textColor }}
      />
      
      <View style={styles.divider} />
      
      <DrawerItem
        label="Settings"
        icon={({ color, size }) => <Settings color={iconColor} size={size} />}
        onPress={() => {}}
        labelStyle={{ color: textColor }}
      />
      <DrawerItem
        label="Help & feedback"
        icon={({ color, size }) => <HelpCircle color={iconColor} size={size} />}
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
          drawerIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="reminders"
        options={{
          drawerLabel: 'Reminders',
          drawerIcon: ({ color, size }) => <Bell color={color} size={size} />,
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
