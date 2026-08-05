import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar,
  Animated, Dimensions, StyleSheet, TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import PlexusBackground from '../../components/ui/PlexusBackground';
import useToast from '../../hooks/useToast';
import { validateBeninPhone } from '../../utils/validation';
import api from '../../services/api';

const { width: W } = Dimensions.get('window');

// ─── Config des 6 types d'opération ────────────────────────────────────────
const OPERATION_TYPES = [
  { key: 'deposit',     icon: 'arrow-bottom-left-circle', color: '#16A34A', needsPackage: false },
  { key: 'withdrawal',  icon: 'arrow-top-right-circle',   color: '#DC2626', needsPackage: false },
  { key: 'credit_sale', icon: 'cellphone-wireless',        color: '#D97706', needsPackage: false },
  { key: 'data_sale',   icon: 'wifi',                      color: '#0A66C2', needsPackage: true  },
  { key: 'unlimited',   icon: 'infinity',                  color: '#7C3AED', needsPackage: true  },
  { key: 'transfer',    icon: 'swap-horizontal',           color: '#0891B2', needsPackage: false },
];

// Montants prédéfinis pour crédit libre
const CREDIT_PRESETS = [100, 200, 500, 1000, 2000, 5000];

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
const PHONE_RE = /^\+?[0-9]{8,15}$/;

// ─── Composant carte de type ────────────────────────────────────────────────
const TypeCard = ({ item, selected, onPress, t, theme }) => {
  const isSelected = selected === item.key;
  return (
    <TouchableOpacity
      onPress={() => onPress(item.key)}
      activeOpacity={0.75}
      style={[styles.typeCard, {
        borderColor: isSelected ? item.color : theme.border,
        backgroundColor: isSelected ? `${item.color}12` : theme.backgroundCard,
      }]}
    >
      <View style={[styles.typeIconWrap, { backgroundColor: `${item.color}20` }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={[styles.typeLabel, {
        color: isSelected ? item.color : theme.text,
        fontFamily: isSelected
          ? theme.typography.fontFamily.bold
          : theme.typography.fontFamily.medium,
      }]}>
        {t(`transactions.types.${item.key}`)}
      </Text>
      <Text style={[styles.typeDesc, { color: theme.textSecondary }]} numberOfLines={2}>
        {t(`transactions.typeDescriptions.${item.key}`)}
      </Text>
      {isSelected && (
        <View style={[styles.typeCheck, { backgroundColor: item.color }]}>
          <Icon name="check" size={10} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Composant carte de package ─────────────────────────────────────────────
const PackageCard = ({ plan, selected, onPress, theme }) => {
  const isSelected = selected === plan.code;
  return (
    <TouchableOpacity
      onPress={() => onPress(plan)}
      activeOpacity={0.75}
      style={[styles.pkgCard, {
        borderColor: isSelected ? '#7C3AED' : theme.border,
        backgroundColor: isSelected ? 'rgba(124,58,237,0.08)' : theme.backgroundCard,
      }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.pkgLabel, {
          color: isSelected ? '#7C3AED' : theme.text,
          fontFamily: theme.typography.fontFamily.semiBold,
        }]}>
          {plan.label}
        </Text>
        {plan.includes && (
          <Text style={[styles.pkgIncludes, { color: theme.textSecondary }]}>
            {plan.includes}
          </Text>
        )}
        <Text style={[styles.pkgValidity, { color: theme.textSecondary }]}>
          {plan.validity}
        </Text>
      </View>
      <Text style={[styles.pkgPrice, {
        color: isSelected ? '#7C3AED' : theme.colors.primary,
        fontFamily: theme.typography.fontFamily.extraBold,
      }]}>
        {fmt(plan.price)} F
      </Text>
    </TouchableOpacity>
  );
};

// ─── Composant ligne de récap ────────────────────────────────────────────────
const RecapRow = ({ label, value, theme, accent }) => (
  <View style={styles.recapRow}>
    <Text style={[styles.recapLabel, { color: theme.textSecondary }]}>{label}</Text>
    <Text style={[styles.recapValue, {
      color: accent ? theme.colors.primary : theme.text,
      fontFamily: theme.typography.fontFamily.semiBold,
    }]}>{value}</Text>
  </View>
);

// ─── Indicateur d'étape ──────────────────────────────────────────────────────
const StepIndicator = ({ current, total, theme }) => (
  <View style={styles.stepRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[styles.stepDot, {
        backgroundColor: i < current ? theme.colors.primary : theme.border,
        width: i === current - 1 ? 24 : 8,
      }]} />
    ))}
  </View>
);

// ─── Écran principal ─────────────────────────────────────────────────────────
const NewTransactionScreen = ({ navigation, route }) => {
  const { t }   = useTranslation();
  const theme   = useTheme();
  const toast   = useToast();

  const initialType = route.params?.type || 'deposit';

  // ── État formulaire ──
  const [step, setStep]               = useState(1);
  const [opType, setOpType]           = useState(initialType);
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName]   = useState('');
  const [amount, setAmount]           = useState('');
  const [freeAmount, setFreeAmount]   = useState('');
  const [useFreeAmount, setUseFreeAmount] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [description, setDescription] = useState('');
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [packages, setPackages]       = useState({});
  const [pkgLoading, setPkgLoading]   = useState(false);
  const [result, setResult]           = useState(null);

  // ── Animation ──
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentOp = OPERATION_TYPES.find((o) => o.key === opType) || OPERATION_TYPES[0];
  const needsPackage = currentOp.needsPackage;
  const TOTAL_STEPS  = 3;

  // ── Chargement des packages MTN ──
  useEffect(() => {
    const fetchPackages = async () => {
      setPkgLoading(true);
      try {
        const { data } = await api.get('/transactions/packages');
        setPackages(data.packages || {});
      } catch (_) { /* silencieux — packages fallback client-side */ }
      finally { setPkgLoading(false); }
    };
    fetchPackages();
  }, []);

  // ── Reset package quand le type change ──
  useEffect(() => {
    setSelectedPkg(null);
    setAmount('');
    setFreeAmount('');
    setUseFreeAmount(false);
    setErrors({});
  }, [opType]);

  // ── Transition d'étape ──
  const goToStep = (next) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setStep(next);
  };

  // ── Validation étape 1 ──
  const validateStep1 = () => {
    const e = {};
    if (!PHONE_RE.test(clientPhone)) e.clientPhone = t('transactions.clientPhoneInvalid');
    if (!clientPhone.trim())         e.clientPhone = t('transactions.clientPhoneRequired');
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Validation étape 2 ──
  const validateStep2 = () => {
    const e = {};
    if (needsPackage) {
      if (!selectedPkg) e.pkg = t('transactions.packageRequired');
    } else if (opType === 'credit_sale') {
      const val = useFreeAmount ? parseFloat(freeAmount) : parseFloat(amount);
      if (!val || val < 50) e.amount = t('transactions.invalidAmount');
    } else {
      const val = parseFloat(amount);
      if (!val || val < 1) e.amount = t('transactions.invalidAmount');
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Montant final calculé ──
  const getFinalAmount = () => {
    if (needsPackage && selectedPkg) return selectedPkg.price;
    if (opType === 'credit_sale') return useFreeAmount ? parseFloat(freeAmount) : parseFloat(amount);
    return parseFloat(amount);
  };

  // ── Soumission ──
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        type:        opType,
        clientPhone: clientPhone.trim(),
        clientName:  clientName.trim() || undefined,
        amount:      getFinalAmount(),
        description: description.trim() || undefined,
        operator:    'MTN',
        ...(selectedPkg ? {
          packageCode:  selectedPkg.code,
          packageLabel: selectedPkg.label,
        } : {}),
      };

      const { data } = await api.post('/transactions', payload);
      setResult(data.transaction);
      toast.success(
        t('transactions.successTitle'),
        t('transactions.successRef', { ref: data.transaction.reference }),
        5000,
      );
      goToStep(4); // écran résultat
    } catch (err) {
      const msg = err.response?.data?.error || t('transactions.creationError');
      setErrors({ general: msg });
      toast.error(t('transactions.creationError'), msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset complet ──
  const resetForm = () => {
    setStep(1);
    setOpType('deposit');
    setClientPhone('');
    setClientName('');
    setAmount('');
    setFreeAmount('');
    setUseFreeAmount(false);
    setSelectedPkg(null);
    setDescription('');
    setErrors({});
    setResult(null);
  };

  const pkgList = packages[opType]?.plans || [];
  const isDark  = theme.isDark;

  // ── Écran succès ──
  if (step === 4 && result) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <PlexusBackground />
        <ScrollView contentContainerStyle={styles.successWrap}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={56} color="#16A34A" />
          </View>
          <Text style={[styles.successTitle, { color: theme.text, fontFamily: theme.typography.fontFamily.extraBold }]}>
            {t('transactions.successTitle')}
          </Text>
          <Text style={[styles.successSub, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.regular }]}>
            {t('transactions.successSubtitle')}
          </Text>

          {/* Récap */}
          <View style={[styles.recapCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
            <RecapRow label={t('transactions.reference')} value={result.reference} accent theme={theme} />
            <View style={[styles.recapDivider, { backgroundColor: theme.border }]} />
            <RecapRow label={t('transactions.transactionType')} value={t(`transactions.types.${result.type}`)} theme={theme} />
            <RecapRow label={t('transactions.amountLabel')} value={`${fmt(result.amount)} XOF`} theme={theme} />
            {result.packageLabel && <RecapRow label={t('transactions.package')} value={result.packageLabel} theme={theme} />}
            {result.packageValidity && <RecapRow label={t('transactions.validity')} value={result.packageValidity} theme={theme} />}
            <RecapRow label={t('transactions.clientPhoneLabel')} value={result.clientPhone} theme={theme} />
          </View>

          <Text style={[styles.processingNote, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.regular }]}>
            ⏳ {t('transactions.processingNote')}
          </Text>

          <Button title={t('transactions.seeTransactions')} onPress={() => navigation.navigate('TransactionsList')} fullWidth style={{ marginTop: 8 }} />
          <Button title={t('transactions.newTransactionButton')} onPress={resetForm} fullWidth variant="outline" style={{ marginTop: 12 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <PlexusBackground />

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => step > 1 ? goToStep(step - 1) : navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.surface }]}>
          <Icon name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: theme.typography.fontFamily.extraBold }]}>
            {t('transactions.newTitle')}
          </Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.regular }]}>
            {t(`transactions.step${step}Title`)}
          </Text>
        </View>
        <StepIndicator current={step} total={TOTAL_STEPS} theme={theme} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ══════════ ÉTAPE 1 — Client & opération ══════════ */}
            {step === 1 && (
              <View>
                {/* Numéro client */}
                <Text style={[styles.label, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.semiBold }]}>
                  {t('transactions.clientPhoneLabel')}
                </Text>
                <View style={[styles.phoneRow, {
                  borderColor: errors.clientPhone ? theme.colors.error : theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                }]}>
                  <Icon name="phone-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.phoneInput, { color: theme.text, fontFamily: theme.typography.fontFamily.regular }]}
                    value={clientPhone}
                    onChangeText={(v) => { setClientPhone(v); setErrors({}); }}
                    placeholder={t('transactions.clientPhonePlaceholder')}
                    placeholderTextColor={theme.placeholder}
                    keyboardType="phone-pad"
                    autoFocus
                  />
                  {clientPhone.length > 0 && (
                    <TouchableOpacity onPress={() => setClientPhone('')}>
                      <Icon name="close-circle" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                {errors.clientPhone && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.clientPhone}</Text>
                )}

                {/* Nom client (optionnel) */}
                <Text style={[styles.label, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.semiBold, marginTop: 16 }]}>
                  {t('transactions.clientNameLabel')}
                </Text>
                <View style={[styles.phoneRow, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}>
                  <Icon name="account-outline" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.phoneInput, { color: theme.text, fontFamily: theme.typography.fontFamily.regular }]}
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder={t('transactions.clientNamePlaceholder')}
                    placeholderTextColor={theme.placeholder}
                  />
                </View>

                {/* Grille des types d'opération */}
                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.typography.fontFamily.bold }]}>
                  {t('transactions.transactionType')}
                </Text>
                <View style={styles.typeGrid}>
                  {OPERATION_TYPES.map((item) => (
                    <TypeCard
                      key={item.key}
                      item={item}
                      selected={opType}
                      onPress={setOpType}
                      t={t}
                      theme={theme}
                    />
                  ))}
                </View>

                <Button
                  title={t('common.next')}
                  onPress={() => { if (validateStep1()) goToStep(2); }}
                  fullWidth
                  style={{ marginTop: 8 }}
                />
              </View>
            )}

            {/* ══════════ ÉTAPE 2 — Montant / Package ══════════ */}
            {step === 2 && (
              <View>
                {/* Résumé opération sélectionnée */}
                <View style={[styles.opSummary, { backgroundColor: `${currentOp.color}12`, borderColor: `${currentOp.color}40` }]}>
                  <Icon name={currentOp.icon} size={20} color={currentOp.color} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.opSummaryType, { color: currentOp.color, fontFamily: theme.typography.fontFamily.bold }]}>
                      {t(`transactions.types.${opType}`)}
                    </Text>
                    <Text style={[styles.opSummaryPhone, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.regular }]}>
                      {clientPhone}{clientName ? ` — ${clientName}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => goToStep(1)}>
                    <Icon name="pencil-outline" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* ── Packages (data_sale / unlimited) ── */}
                {needsPackage && (
                  <>
                    <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.typography.fontFamily.bold }]}>
                      {t('transactions.choosePackage')}
                    </Text>
                    {pkgLoading ? (
                      <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
                    ) : pkgList.length === 0 ? (
                      <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 24 }}>
                        {t('common.noData')}
                      </Text>
                    ) : (
                      pkgList.map((plan) => (
                        <PackageCard
                          key={plan.code}
                          plan={plan}
                          selected={selectedPkg?.code}
                          onPress={setSelectedPkg}
                          theme={theme}
                        />
                      ))
                    )}
                    {errors.pkg && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.pkg}</Text>}
                  </>
                )}

                {/* ── Montants prédéfinis (crédit + dépôt/retrait) ── */}
                {!needsPackage && (
                  <>
                    {opType === 'credit_sale' && (
                      <>
                        <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.typography.fontFamily.bold }]}>
                          {t('transactions.amountLabel')}
                        </Text>
                        {/* Presets */}
                        <View style={styles.presetGrid}>
                          {CREDIT_PRESETS.map((preset) => (
                            <TouchableOpacity
                              key={preset}
                              onPress={() => { setAmount(String(preset)); setUseFreeAmount(false); setErrors({}); }}
                              style={[styles.presetBtn, {
                                borderColor: amount === String(preset) && !useFreeAmount ? currentOp.color : theme.border,
                                backgroundColor: amount === String(preset) && !useFreeAmount ? `${currentOp.color}12` : theme.backgroundCard,
                              }]}
                            >
                              <Text style={[styles.presetText, {
                                color: amount === String(preset) && !useFreeAmount ? currentOp.color : theme.text,
                                fontFamily: theme.typography.fontFamily.semiBold,
                              }]}>
                                {fmt(preset)} F
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {/* Montant libre */}
                        <TouchableOpacity
                          onPress={() => { setUseFreeAmount(!useFreeAmount); setAmount(''); setErrors({}); }}
                          style={[styles.freeToggle, {
                            borderColor: useFreeAmount ? currentOp.color : theme.border,
                            backgroundColor: useFreeAmount ? `${currentOp.color}08` : theme.surface,
                          }]}
                        >
                          <Icon name={useFreeAmount ? 'checkbox-marked' : 'checkbox-blank-outline'} size={18} color={useFreeAmount ? currentOp.color : theme.textSecondary} />
                          <Text style={[styles.freeToggleText, { color: useFreeAmount ? currentOp.color : theme.textSecondary, fontFamily: theme.typography.fontFamily.medium }]}>
                            {t('transactions.orEnterAmount')}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* Champ montant (dépôt/retrait/transfert ou libre crédit) */}
                    {(opType !== 'credit_sale' || useFreeAmount) && (
                      <>
                        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.semiBold, marginTop: opType === 'credit_sale' ? 0 : 4 }]}>
                          {t('transactions.amountLabel')}
                        </Text>
                        <View style={[styles.phoneRow, {
                          borderColor: errors.amount ? theme.colors.error : theme.inputBorder,
                          backgroundColor: theme.inputBackground,
                        }]}>
                          <Icon name="cash" size={20} color={theme.textSecondary} />
                          <TextInput
                            style={[styles.phoneInput, { color: theme.text, fontFamily: theme.typography.fontFamily.regular }]}
                            value={useFreeAmount ? freeAmount : amount}
                            onChangeText={(v) => { useFreeAmount ? setFreeAmount(v) : setAmount(v); setErrors({}); }}
                            placeholder={t('transactions.amountPlaceholder')}
                            placeholderTextColor={theme.placeholder}
                            keyboardType="numeric"
                          />
                          <Text style={{ color: theme.textSecondary, fontFamily: theme.typography.fontFamily.medium }}>XOF</Text>
                        </View>
                        {errors.amount && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.amount}</Text>}
                      </>
                    )}
                  </>
                )}

                {/* Description */}
                <Text style={[styles.label, { color: theme.textSecondary, fontFamily: theme.typography.fontFamily.semiBold, marginTop: 16 }]}>
                  {t('transactions.descriptionLabel')}
                </Text>
                <View style={[styles.phoneRow, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, alignItems: 'flex-start', paddingVertical: 10 }]}>
                  <TextInput
                    style={[styles.phoneInput, { color: theme.text, fontFamily: theme.typography.fontFamily.regular, height: 60, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('transactions.descriptionPlaceholder')}
                    placeholderTextColor={theme.placeholder}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <Button
                  title={t('common.next')}
                  onPress={() => { if (validateStep2()) goToStep(3); }}
                  fullWidth
                  style={{ marginTop: 16 }}
                />
              </View>
            )}

            {/* ══════════ ÉTAPE 3 — Confirmation ══════════ */}
            {step === 3 && (
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.typography.fontFamily.bold }]}>
                  {t('transactions.confirmTitle')}
                </Text>

                {/* Icône opération */}
                <View style={[styles.confirmIcon, { backgroundColor: `${currentOp.color}15` }]}>
                  <Icon name={currentOp.icon} size={36} color={currentOp.color} />
                </View>

                {/* Carte récap */}
                <View style={[styles.recapCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                  <RecapRow label={t('transactions.transactionType')} value={t(`transactions.types.${opType}`)} accent theme={theme} />
                  <View style={[styles.recapDivider, { backgroundColor: theme.border }]} />
                  <RecapRow label={t('transactions.clientPhoneLabel')} value={clientPhone} theme={theme} />
                  {clientName ? <RecapRow label={t('transactions.client')} value={clientName} theme={theme} /> : null}
                  <View style={[styles.recapDivider, { backgroundColor: theme.border }]} />
                  {selectedPkg ? (
                    <>
                      <RecapRow label={t('transactions.package')} value={selectedPkg.label} theme={theme} />
                      <RecapRow label={t('transactions.validity')} value={selectedPkg.validity} theme={theme} />
                      <RecapRow label={t('transactions.amountLabel')} value={`${fmt(selectedPkg.price)} XOF`} accent theme={theme} />
                    </>
                  ) : (
                    <RecapRow label={t('transactions.amountLabel')} value={`${fmt(getFinalAmount())} XOF`} accent theme={theme} />
                  )}
                  {description ? (
                    <>
                      <View style={[styles.recapDivider, { backgroundColor: theme.border }]} />
                      <RecapRow label={t('transactions.description')} value={description} theme={theme} />
                    </>
                  ) : null}
                </View>

                {errors.general && (
                  <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}12`, borderColor: `${theme.colors.error}40` }]}>
                    <Icon name="alert-circle" size={16} color={theme.colors.error} />
                    <Text style={[styles.errorBoxText, { color: theme.colors.error, fontFamily: theme.typography.fontFamily.medium }]}>
                      {errors.general}
                    </Text>
                  </View>
                )}

                <Button
                  title={loading ? t('transactions.confirmingButton') : t('transactions.confirmButton')}
                  onPress={handleSubmit}
                  loading={loading}
                  fullWidth
                  style={{ marginTop: 16 }}
                />
                <Button
                  title={t('transactions.editButton')}
                  onPress={() => goToStep(2)}
                  variant="outline"
                  fullWidth
                  style={{ marginTop: 10 }}
                />
              </View>
            )}

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, marginTop: 1 },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepDot: { height: 8, borderRadius: 4 },

  // Section title
  sectionTitle: { fontSize: 15, marginTop: 20, marginBottom: 12 },
  label:        { fontSize: 13, marginBottom: 8 },

  // Phone / input row
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
  },
  phoneInput: { flex: 1, fontSize: 15 },
  errorText:  { fontSize: 12, marginTop: 4, marginLeft: 4 },

  // Type grid
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: (W - 50) / 2, borderRadius: 16, borderWidth: 2,
    padding: 14, alignItems: 'flex-start', position: 'relative',
  },
  typeIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  typeLabel:    { fontSize: 13, marginBottom: 3 },
  typeDesc:     { fontSize: 11, lineHeight: 15 },
  typeCheck:    { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  // Package card
  pkgCard:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 8 },
  pkgLabel:    { fontSize: 14, marginBottom: 2 },
  pkgIncludes: { fontSize: 11, marginBottom: 1 },
  pkgValidity: { fontSize: 11 },
  pkgPrice:    { fontSize: 16 },

  // Op summary
  opSummary:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 4 },
  opSummaryType: { fontSize: 14 },
  opSummaryPhone: { fontSize: 13, marginTop: 1 },

  // Presets
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetBtn:  { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  presetText: { fontSize: 13 },

  // Free amount toggle
  freeToggle:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  freeToggleText: { fontSize: 13 },

  // Recap
  recapCard:    { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 8 },
  recapRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  recapLabel:   { fontSize: 13, flex: 1 },
  recapValue:   { fontSize: 13, flex: 1.5, textAlign: 'right' },
  recapDivider: { height: 1, marginVertical: 2 },

  // Error box
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  errorBoxText: { flex: 1, fontSize: 13 },

  // Confirm icon
  confirmIcon:  { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },

  // Success
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon:  { width: 100, height: 100, borderRadius: 32, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, textAlign: 'center', marginBottom: 8 },
  successSub:   { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  processingNote: { fontSize: 13, textAlign: 'center', marginTop: 16, marginBottom: 8, lineHeight: 20 },
});

export default NewTransactionScreen;
