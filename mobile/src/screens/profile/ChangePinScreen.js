/**
 * ChangePinScreen — GestionMoMo Mobile
 *
 * Permet à l'utilisateur connecté de changer son propre code PIN.
 * Flux : ancien PIN → nouveau PIN → confirmation nouveau PIN
 *
 * Appelle PATCH /api/auth/change-pin avec { currentPin, newPin }
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import PinInput from '../../components/ui/PinInput';
import Icon from '../../components/ui/Icon';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

/* ─── Steps ─────────────────────────────────────────────────── */
const STEPS = ['current', 'new', 'confirm'];

const STEP_CONFIG = {
  current: {
    titleKey:    'changePin.stepCurrentTitle',
    subtitleKey: 'changePin.stepCurrentSubtitle',
    iconName:    'lock-outline',
    iconColor:   '#6B7280',
  },
  new: {
    titleKey:    'changePin.stepNewTitle',
    subtitleKey: 'changePin.stepNewSubtitle',
    iconName:    'lock-plus-outline',
    iconColor:   '#0A66C2',
  },
  confirm: {
    titleKey:    'changePin.stepConfirmTitle',
    subtitleKey: 'changePin.stepConfirmSubtitle',
    iconName:    'lock-check-outline',
    iconColor:   '#16A34A',
  },
};

/* ─── Progress dots ─────────────────────────────────────────── */
const StepDots = ({ current, theme }) => (
  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
    {STEPS.map((s, i) => {
      const idx = STEPS.indexOf(current);
      const done = i < idx;
      const active = i === idx;
      return (
        <View
          key={s}
          style={{
            height: 6,
            width: active ? 24 : done ? 24 : 6,
            borderRadius: 3,
            backgroundColor: active
              ? theme.colors.primary
              : done
              ? `${theme.colors.primary}60`
              : theme.border,
            transition: 'width 0.3s',
          }}
        />
      );
    })}
  </View>
);

/* ─── ChangePinScreen ───────────────────────────────────────── */
const ChangePinScreen = ({ navigation }) => {
  const { t }   = useTranslation();
  const theme   = useTheme();
  const toast   = useToast();

  const [step, setStep]           = useState('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  // Animation shake pour les erreurs
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 50,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 50,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 40,  useNativeDriver: true }),
    ]).start();
  };

  const config = STEP_CONFIG[step];
  const isDark = theme.isDark;

  /* ── Saisie auto-avance selon l'étape ── */
  const handlePinChange = (val) => {
    setError('');
    if (step === 'current')  setCurrentPin(val);
    if (step === 'new')      setNewPin(val);
    if (step === 'confirm')  setConfirmPin(val);

    // Auto-submit quand les 5 chiffres sont saisis
    if (val.length === 5) {
      setTimeout(() => handleStepSubmit(val), 180);
    }
  };

  const currentValue = step === 'current' ? currentPin
    : step === 'new' ? newPin
    : confirmPin;

  const handleStepSubmit = async (val) => {
    const pin = val || currentValue;
    if (pin.length < 5) return;

    if (step === 'current') {
      // Vérifie l'ancien PIN côté serveur avant d'avancer
      setLoading(true);
      try {
        await api.post('/auth/verify-pin', { pin });
        setStep('new');
        setNewPin('');
        setError('');
      } catch (err) {
        const msg = err.response?.data?.error || t('changePin.wrongCurrentPin');
        setError(msg);
        setCurrentPin('');
        shake();
        toast.error(t('changePin.errorTitle'), msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 'new') {
      setStep('confirm');
      setConfirmPin('');
      return;
    }

    if (step === 'confirm') {
      if (pin !== newPin) {
        setError(t('changePin.pinMismatch'));
        setConfirmPin('');
        shake();
        toast.error(t('changePin.errorTitle'), t('changePin.pinMismatch'));
        return;
      }
      // Soumet le changement
      setLoading(true);
      try {
        await api.patch('/auth/change-pin', { currentPin, newPin });
        setSuccess(true);
        toast.success(t('changePin.successTitle'), t('changePin.successMessage'));
      } catch (err) {
        const msg = err.response?.data?.error || t('changePin.changeError');
        setError(msg);
        shake();
        toast.error(t('changePin.errorTitle'), msg);
        // Retour au début si l'ancien PIN est finalement rejeté
        if (err.response?.status === 400) {
          setStep('current');
          setCurrentPin('');
          setNewPin('');
          setConfirmPin('');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'current') {
      navigation.goBack();
    } else if (step === 'new') {
      setStep('current');
      setCurrentPin('');
      setError('');
    } else if (step === 'confirm') {
      setStep('new');
      setNewPin('');
      setError('');
    }
  };

  /* ── Succès ── */
  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: `${theme.colors.success}18`,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <Icon name="check-circle-outline" size={44} color={theme.colors.success} />
          </View>
          <Text style={{
            fontFamily: theme.typography.fontFamily.extraBold, fontSize: 24,
            color: theme.text, textAlign: 'center', marginBottom: 8,
          }}>
            {t('changePin.successTitle')}
          </Text>
          <Text style={{
            fontFamily: theme.typography.fontFamily.regular, fontSize: 14,
            color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 36,
          }}>
            {t('changePin.successMessage')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            style={{
              height: 52, width: '100%', borderRadius: 16,
              backgroundColor: theme.colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 15, color: '#fff' }}>
              {t('common.ok')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: `${theme.colors.primary}15`,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}
            >
              <Icon name="arrow-left" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.text }}>
              {t('changePin.title')}
            </Text>
          </View>

          {/* ── Progression ── */}
          <StepDots current={step} theme={theme} />

          {/* ── Icône + texte ── */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: `${config.iconColor}18`,
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Icon name={config.iconName} size={30} color={config.iconColor} />
            </View>
            <Text style={{
              fontFamily: theme.typography.fontFamily.extraBold, fontSize: 22,
              color: theme.text, textAlign: 'center', marginBottom: 6,
            }}>
              {t(config.titleKey)}
            </Text>
            <Text style={{
              fontFamily: theme.typography.fontFamily.regular, fontSize: 14,
              color: theme.textSecondary, textAlign: 'center', lineHeight: 20,
            }}>
              {t(config.subtitleKey)}
            </Text>
          </View>

          {/* ── Saisie PIN ── */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <PinInput
              value={currentValue}
              onChange={handlePinChange}
              maxLength={5}
              error={error}
            />
          </Animated.View>

          {/* ── Indicateur chargement ── */}
          {loading && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 13, color: theme.textSecondary }}>
                {t('changePin.verifying')}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePinScreen;
