import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FortuneData } from '../types/fortune';
import { Feather } from '@expo/vector-icons';

interface Props {
  date: Date;
  onNext: () => void;
  onPrev: () => void;
  fortune: FortuneData | null;
  loading: boolean;
}

const weekdayText = ['일', '월', '화', '수', '목', '금', '토'];
const weekdayHanja = ['日', '月', '火', '水', '木', '金', '土'];

function getColor(day: number) {
  if (day === 0) return '#dc2626';
  if (day === 6) return '#2563eb';
  return '#111827';
}

const CalendarPage: React.FC<Props> = ({ date, onNext, onPrev, fortune, loading }) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  const color = getColor(weekday);

  return (
    <View style={styles.container}>
      <View style={styles.topStrip}>
        <TouchableOpacity onPress={onPrev} hitSlop={10}>
          <Feather name="chevron-left" size={22} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} hitSlop={10}>
          <Feather name="chevron-right" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.yearText}>{year}년</Text>
            <View style={styles.monthRow}>
              <Text style={styles.monthText}>{month}</Text>
              <Text style={styles.monthSuffix}>월</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.weekdayText, { color }]}>{weekdayText[weekday]}</Text>
            <Text style={styles.weekdaySub}>{weekdayHanja[weekday]}</Text>
          </View>
        </View>

        <View style={styles.dayBlock}>
          <Text style={[styles.dayNumber, { color }]}>{day}</Text>
          <View style={styles.overviewBox}>
            {loading ? (
              <Text style={styles.loadingText}>오늘의 운세를 불러오는 중...</Text>
            ) : fortune ? (
              <Text style={styles.summaryText}>{fortune.summary}</Text>
            ) : (
              <Text style={styles.loadingText}>운세가 준비되지 않았어요.</Text>
            )}
          </View>
        </View>

        {fortune && (
          <View style={styles.detailCard}>
            <DetailItem icon="trending-up" label="재물운" value={fortune.finance} />
            <DetailItem icon="heart" label="애정운" value={fortune.love} />
            <DetailItem icon="briefcase" label="성공운" value={fortune.career} isLast />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

interface DetailProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}

const DetailItem: React.FC<DetailProps> = ({ icon, label, value, isLast }) => (
  <View style={[styles.detailItem, isLast && { borderBottomWidth: 0 }]}>
    <View style={styles.detailHeader}>
      <Feather name={icon} size={18} color="#111827" />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  topStrip: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  yearText: {
    color: '#9ca3af',
    letterSpacing: 2,
    fontSize: 13,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  monthText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 38,
  },
  monthSuffix: {
    marginLeft: 6,
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 6,
  },
  weekdayText: {
    fontSize: 24,
    fontWeight: '700',
  },
  weekdaySub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  dayBlock: {
    alignItems: 'center',
    marginTop: 32,
  },
  dayNumber: {
    fontSize: 140,
    fontWeight: '800',
    lineHeight: 140,
  },
  overviewBox: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minHeight: 70,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryText: {
    color: '#111827',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  detailCard: {
    marginTop: 28,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  detailItem: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  detailValue: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
});

export default CalendarPage;
