import React from 'react';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, HStack, Center } from './ui';

export type TabType = 'today' | 'calendar' | 'album' | 'profile';

interface TabItem {
  key: TabType;
  icon: React.ComponentProps<typeof Feather>['name'];
}

interface Props {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

const TABS: TabItem[] = [
  { key: 'today', icon: 'sun' },
  { key: 'calendar', icon: 'calendar' },
  { key: 'album', icon: 'grid' },
  { key: 'profile', icon: 'user' },
];

const BottomTabBar: React.FC<Props> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <Box
      className="absolute bottom-0 left-0 right-0 bg-black"
      style={{ paddingBottom: insets.bottom }}
    >
      <HStack className="justify-around py-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              className="flex-1 items-center"
            >
              <Center
                className="rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: isActive ? '#fff' : 'transparent',
                }}
              >
                <Feather
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#000' : '#666'}
                />
              </Center>
            </Pressable>
          );
        })}
      </HStack>
    </Box>
  );
};

export default BottomTabBar;
