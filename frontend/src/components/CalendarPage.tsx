import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { FortuneData } from '../types/fortune';

interface Props {
  date: Date;
  onNext: () => void;
  onPrev: () => void;
  fortune: FortuneData | null;
  loading: boolean;
  onOpenSettings?: () => void;
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];

const CalendarPage: React.FC<Props> = ({
  date,
  onNext,
  onPrev: _onPrev,
  fortune,
  loading,
  onOpenSettings: _onOpenSettings,
}) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const tearAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isTearing, setIsTearing] = useState(false);

  // Reset scroll to top when the date changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [date]);

  // Chevron bounce animation (indicator to scroll)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [bounceAnim]);

  const handleTear = () => {
    if (isTearing) return;
    setIsTearing(true);

    Animated.sequence([
      Animated.timing(tearAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tearAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNext();
      setTimeout(() => setIsTearing(false), 100);
    });
  };

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();

  const accentColor = weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#111827';
  const pageHeight = Dimensions.get('window').height;

  const tearTransform = {
    transform: [
      {
        translateY: tearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -24],
        }),
      },
      {
        rotate: tearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-2deg'],
        }),
      },
      {
        scale: tearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.99],
        }),
      },
    ],
  };

  const bounceStyle = {
    transform: [
      {
        translateY: bounceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 15],
        }),
      },
    ],
  };

  const indicatorOpacity = scrollY.interpolate({
    inputRange: [0, pageHeight * 0.2, pageHeight * 0.45],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#e7e5e4', position: 'relative' }}>
      {/* Back page placeholder */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#fff',
        }}
      />

      {/* Paper sheet */}
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.14,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 16 },
            elevation: 10,
          },
          tearTransform,
        ]}
      >
        {/* Content */}
        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
        >
          {/* Day view */}
          <View
            style={{
              height: pageHeight,
              backgroundColor: '#fff',
              position: 'relative',
              paddingHorizontal: 32,
              paddingTop: 24,
              paddingBottom: 120,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View>
                <Text
                  style={{ fontFamily: 'serif', fontSize: 13, color: '#9ca3af', letterSpacing: 2 }}
                >
                  {year}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
                  <Text
                    style={{
                      fontFamily: 'serif',
                      fontSize: 34,
                      fontWeight: '700',
                      color: accentColor,
                      lineHeight: 38,
                    }}
                  >
                    {month}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'serif',
                      marginLeft: 6,
                      fontSize: 16,
                      color: '#6b7280',
                      marginBottom: 6,
                    }}
                  >
                    월
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontFamily: 'serif',
                    fontSize: 26,
                    fontWeight: '700',
                    color: accentColor,
                  }}
                >
                  {WEEKDAY_HANJA[weekday]}
                </Text>
                <Text style={{ fontFamily: 'serif', fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                  {fortune?.lunarDate || '음력 --'}
                </Text>
              </View>
            </View>

            {/* Center content */}
            <View style={{ flex: 1, marginTop: '40%' }} className="items-center">
              <Text
                style={{
                  fontFamily: 'Noto Serif KR',
                  fontSize: 160,
                  fontWeight: '800',
                  color: accentColor,
                  lineHeight: 160,
                  letterSpacing: -2,
                }}
              >
                {day}
              </Text>

              <View
                style={{
                  marginTop: 24,
                  paddingHorizontal: 24,
                  width: '100%',
                  maxWidth: 420,
                }}
              >
                {loading ? (
                  <View style={{ alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#d1d5db" />
                    <Text
                      style={{ fontFamily: 'serif', color: '#d1d5db', fontSize: 14, marginTop: 8 }}
                    >
                      운세를 읽고 있습니다...
                    </Text>
                  </View>
                ) : fortune ? (
                  <View>
                    <Text
                      style={{
                        fontFamily: 'serif',
                        color: '#4B5563',
                        fontSize: 18,
                        fontWeight: '600',
                        lineHeight: 26,
                        textAlign: 'center',
                      }}
                    >
                      {fortune.overview}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontFamily: 'serif',
                      color: '#d1d5db',
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    운세 정보가 없습니다.
                  </Text>
                )}
              </View>
            </View>

            {/* Scroll hint */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  bottom: 150,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                },
                bounceStyle,
                { opacity: indicatorOpacity },
              ]}
            >
              <Feather name="chevron-down" size={28} color="#d1d5db" />
              <Text style={{ fontFamily: 'serif', fontSize: 12, color: '#d1d5db', marginTop: 2 }}>
                운세보러가기
              </Text>
            </Animated.View>
          </View>

          {/* Detailed fortunes */}
          <View
            style={{
              height: pageHeight,
              backgroundColor: '#F9FAFB',
              paddingHorizontal: 32,
              paddingTop: 52,
              paddingBottom: 40,
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              borderStyle: 'dashed',
            }}
          >
            <View style={{ maxWidth: 420, width: '100%', alignSelf: 'center', flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  opacity: 0.6,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'serif',
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#6b7280',
                    letterSpacing: 2,
                  }}
                >
                  오늘의 운세
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db', marginLeft: 10 }} />
              </View>

              {fortune ? (
                <>
                  <FortuneItem icon="dollar-sign" label="재물운" value={fortune.wealth} />
                  <FortuneItem icon="heart" label="애정운" value={fortune.love} />
                  <FortuneItem icon="award" label="성공운" value={fortune.success} />
                  <FortuneItem icon="zap" label="추천 행동" value={fortune.action} isLast />
                </>
              ) : (
                <View style={{ paddingVertical: 20 }}>
                  <Text style={{ fontFamily: 'serif', fontSize: 15, color: '#9ca3af' }}>
                    운세 정보가 없습니다.
                  </Text>
                </View>
              )}

              <View style={{ flex: 1 }} />
            </View>
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

interface FortuneItemProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}

const FortuneItem: React.FC<FortuneItemProps> = ({ icon, label, value, isLast }) => (
  <View
    style={{
      paddingVertical: 18,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: '#e5e7eb',
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Feather name={icon} size={20} color="#9ca3af" style={{ marginRight: 10 }} />
      <Text style={{ fontFamily: 'serif', fontSize: 16, fontWeight: '700', color: '#191F28' }}>
        {label}
      </Text>
    </View>
    <Text style={{ fontFamily: 'serif', fontSize: 15, color: '#4B5563', lineHeight: 22 }}>
      {value}
    </Text>
  </View>
);

export default CalendarPage;
