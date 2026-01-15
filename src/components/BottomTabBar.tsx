import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType = 'today' | 'album' | 'profile';

interface TabItem {
  key: TabType;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

interface Props {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

const TABS: TabItem[] = [
  { key: 'today', label: '오늘', icon: 'camera' },
  { key: 'album', label: '앨범', icon: 'grid' },
  { key: 'profile', label: '내 기록', icon: 'user' },
];

const BottomTabBar: React.FC<Props> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-stone-100 bg-white/95"
      style={{
        paddingBottom: insets.bottom,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      }}
    >
      <View className="flex-row">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              className="flex-1 items-center py-3"
            >
              <View
                className={`mb-1 h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? 'bg-stone-800' : 'bg-transparent'
                }`}
              >
                <Feather
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#ffffff' : '#a8a29e'}
                />
              </View>
              <Text
                className={`text-xs font-semibold ${
                  isActive ? 'text-stone-800' : 'text-stone-400'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default BottomTabBar;
