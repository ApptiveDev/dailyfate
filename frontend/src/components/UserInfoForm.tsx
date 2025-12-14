import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gender, UserSettings } from '../types/fortune';

interface Props {
  onSubmit: (settings: UserSettings) => void;
  initialValues?: UserSettings;
}

const genderOptions: { val: Gender; label: string }[] = [
  { val: 'male', label: '남성' },
  { val: 'female', label: '여성' },
  { val: 'other', label: '기타' },
];

const UserInfoForm: React.FC<Props> = ({ onSubmit, initialValues }) => {
  const [form, setForm] = useState<UserSettings>(
    initialValues || {
      nickname: '',
      gender: 'male',
      birthdate: '',
      notificationTime: '08:00',
      notificationEnabled: true,
    },
  );

  const isValid = useMemo(() => form.nickname.trim() !== '' && form.birthdate !== '', [form]);

  const update = (patch: Partial<UserSettings>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(form);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>반가워요! 정보를 입력해주세요</Text>
        <Text style={styles.caption}>정확한 운세 분석을 위해 필요해요.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            value={form.nickname}
            onChangeText={(text) => update({ nickname: text })}
            placeholder="김토스"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>성별</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((opt) => {
              const active = form.gender === opt.val;
              return (
                <Pressable
                  key={opt.val}
                  style={[styles.genderButton, active && styles.genderButtonActive]}
                  onPress={() => update({ gender: opt.val })}
                >
                  <Text style={[styles.genderText, active && styles.genderTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>생년월일</Text>
          <TextInput
            value={form.birthdate}
            onChangeText={(text) => update({ birthdate: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>매일 알림</Text>
          <View style={styles.notifyRow}>
            <Text style={styles.notifyLabel}>알림 시간</Text>
            <TextInput
              value={form.notificationTime}
              onChangeText={(text) => update({ notificationTime: text })}
              placeholder="08:00"
              placeholderTextColor="#9ca3af"
              style={styles.notifyInput}
            />
          </View>
        </View>

        <Pressable
          style={[styles.submit, !isValid && { opacity: 0.4 }]}
          disabled={!isValid}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  container: {
    gap: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 30,
  },
  caption: {
    color: '#6b7280',
    fontSize: 14,
  },
  fieldGroup: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
    fontSize: 16,
    color: '#111827',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#111827',
  },
  genderText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '700',
  },
  genderTextActive: {
    color: '#fff',
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
  },
  notifyLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  notifyInput: {
    minWidth: 80,
    textAlign: 'right',
    fontSize: 16,
    color: '#111827',
  },
  submit: {
    marginTop: 8,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default UserInfoForm;
