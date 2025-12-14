import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { UserSettings } from '../types/fortune';
import { Feather } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

const SettingsSheet: React.FC<Props> = ({ visible, onClose, settings, onSave }) => {
  const [form, setForm] = useState<UserSettings>(settings);

  useEffect(() => {
    if (visible) {
      setForm(settings);
    }
  }, [visible, settings]);

  const update = (patch: Partial<UserSettings>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>설정</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>내 정보</Text>
            <View style={styles.card}>
              <Row label="닉네임">
                <TextInput
                  value={form.nickname}
                  onChangeText={(text) => update({ nickname: text })}
                  placeholder="입력해주세요"
                  placeholderTextColor="#d1d5db"
                  style={styles.inputRight}
                  textAlign="right"
                />
              </Row>
              <Row label="생년월일" divider>
                <TextInput
                  value={form.birthdate}
                  onChangeText={(text) => update({ birthdate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#d1d5db"
                  style={styles.inputRight}
                  textAlign="right"
                />
              </Row>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>알림</Text>
            <View style={styles.card}>
              <Row label="매일 알림 받기" divider>
                <Switch
                  value={form.notificationEnabled}
                  onValueChange={(value) => update({ notificationEnabled: value })}
                  thumbColor="#fff"
                  trackColor={{ false: '#e5e7eb', true: '#111827' }}
                />
              </Row>
              {form.notificationEnabled && (
                <Row label="알림 시간">
                  <TextInput
                    value={form.notificationTime}
                    onChangeText={(text) => update({ notificationTime: text })}
                    placeholder="08:00"
                    placeholderTextColor="#d1d5db"
                    style={styles.inputRight}
                    textAlign="right"
                  />
                </Row>
              )}
            </View>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>저장하기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode; divider?: boolean }> = ({
  label,
  children,
  divider,
}) => (
  <View style={[styles.row, divider && styles.rowDivider]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#F2F4F6',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  inputRight: {
    minWidth: 120,
    color: '#111827',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default SettingsSheet;
