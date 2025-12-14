import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Feather name="star" size={26} color="#111827" />
          </View>
          <Text style={styles.title}>하루 일력</Text>
          <Text style={styles.subtitle}>
            매일 아침, 종이 일력을 뜯듯 당신의 하루를 확인해보세요.
          </Text>

          <View style={styles.guideBox}>
            <GuideItem
              icon="scissors"
              title="다음 날로 넘기기"
              text="상단을 눌러 종이를 뜯듯 내일로 넘어가요."
            />
            <GuideItem
              icon="calendar"
              title="오늘의 총평"
              text="큰 날짜 아래 핵심 운세를 바로 볼 수 있어요."
            />
            <GuideItem
              icon="chevron-down"
              title="상세 운세"
              text="스크롤로 재물·애정·성공운을 확인하세요."
            />
          </View>
        </View>

        <Pressable style={styles.button} onPress={onComplete} accessibilityLabel="온보딩 완료">
          <Text style={styles.buttonText}>시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
};

const GuideItem = ({
  icon,
  title,
  text,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  text: string;
}) => (
  <View style={styles.guideItem}>
    <Feather name={icon} size={16} color="#6b7280" style={{ marginTop: 2 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.guideTitle}>{title}</Text>
      <Text style={styles.guideText}>{text}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  body: {
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  guideBox: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  guideItem: {
    flexDirection: 'row',
    gap: 10,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  guideText: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  button: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Onboarding;
