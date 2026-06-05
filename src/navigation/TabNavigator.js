import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ImportScreen from '../screens/ImportScreen';
import { colors } from '../theme';
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home:    { active: 'home',              inactive: 'home-outline' },
  Add:     { active: 'add-circle',        inactive: 'add-circle-outline' },
  Reports: { active: 'bar-chart',         inactive: 'bar-chart-outline' },
  Import:  { active: 'cloud-upload',      inactive: 'cloud-upload-outline' },
  Profile: { active: 'person-circle',     inactive: 'person-circle-outline' },
};

export default function TabNavigator() {
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

  return (
    <Tab.Navigator
      // ensure scene content doesn't get hidden behind the absolute tab bar
      sceneContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0.5,
          borderTopColor: colors.separator,
          paddingTop: 6,
          height: TAB_BAR_HEIGHT,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const ic = ICONS[route.name];
          const name = focused ? ic.active : ic.inactive;
          return <Ionicons name={name} size={size + 2} color={color} />;
        },
      })}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home"    component={DashboardScreen} />
      <Tab.Screen
        name="Add"
        component={AddExpenseScreen}
        options={{ title: 'Add' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Clear any existing expense param so Add screen is not in editing mode
            navigation.setParams({ expense: undefined });
          },
        })}
      />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Import"  component={ImportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
