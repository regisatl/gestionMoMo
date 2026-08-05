/**
 * NewTransactionModal.jsx
 * Modal de caisse marchand — 3 étapes + écran succès.
 * Étape 1 : Numéro client + type d'opération
 * Étape 2 : Montant / Package MTN
 * Étape 3 : Récapitulatif + confirmation
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, X, Check, ChevronRight,
  Phone, User, DollarSign, Package,
  Wifi, Smartphone, Infinity, ArrowDownLeft,
  ArrowUpRight, ArrowLeftRight, Edit2, Loader,
} from 'lucide-react';
import Button from './Button';
import api from '../../services/api';

// ─── Config opérations ───────────────────────────────────────────────────────
const OPERATIONS = [
  { key: 'deposit',     Icon: ArrowDownLeft,  color: '#16A34A', bg: '#DCFCE7' },
  { key: 'withdrawal',  Icon: ArrowUpRight,   color: '#DC2626', bg: '#FEE2E2' },
  { key: 'credit_sale', Icon: Smartphone,     color: '#D97706', bg: '#FEF3C7' },
  { key: 'data_sale',   Icon: Wifi,           color: '#0A66C2', bg: '#DBEAFE' },
  { key: 'unlimited',   Icon: Infinity,       color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'transfer',    Icon: ArrowLeftRight, color: '#0891B2', bg: '#CFFAFE' },
];

const CREDIT_PRESETS = [100, 200, 500, 1000, 2000, 5000];
const fmt = (n = 0) => new Intl.NumberFormat('fr-FR').format(n);
const PHONE_RE = /^\+?[0-9]{8,15}$/;

// ─── Styles communs ───────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '16px',
  },
  modal: {
    background: 'var(--card-bg)', borderRadius: '20px',
    width: '100%', maxWidth: '560px', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '18px 20px', borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  body: { overflowY: 'auto', padding: '20px', flex: 1 },
  label: { fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' },
  input: {
    width: '100%', height: '44px', borderRadius: '10px',
    border: '1.5px solid var(--input-border)', background: 'var(--input-bg)',
    fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text)',
    padding: '0 14px', outline: 'none', boxSizing: 'border-box',
  },
  inputIcon: {
    display: 'flex', alignItems: 'center', gap: '10px',
    border: '1.5px solid var(--input-border)', borderRadius: '10px',
    background: 'var(--input-bg)', padding: '0 14px', height: '44px',
  },
  inputInner: {
    flex: 1, border: 'none', background: 'transparent', outline: 'none',
    fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text)',
  },
  err: { fontSize: '12px', color: 'var(--color-error)', marginTop: '4px', fontFamily: 'var(--font)' },
  section: { fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: '20px 0 12px' },
  opGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  recapRow: { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' },
  recapLabel: { fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' },
  recapValue: { fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
};

// ─── Indicateur étapes ───────────────────────────────────────────────────────
const StepBar = ({ step, total }) => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        height: '6px', borderRadius: '3px',
        width: i === step - 1 ? '24px' : '8px',
        background: i < step ? 'var(--color-primary)' : 'var(--border)',
        transition: 'all 0.2s',
      }} />
    ))}
  </div>
);

// ─── Carte opération ─────────────────────────────────────────────────────────
const OpCard = ({ op, selected, onSelect, t }) => {
  const isSelected = selected === op.key;
  return (
    <button
      type="button"
      onClick={() => onSelect(op.key)}
      style={{
        border: `2px solid ${isSelected ? op.color : 'var(--border)'}`,
        background: isSelected ? op.bg : 'var(--card-bg)',
        borderRadius: '14px', padding: '14px 10px',
        cursor: 'pointer', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        transition: 'all 0.15s', position: 'relative',
      }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${op.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <op.Icon size={20} color={op.color} />
      </div>
      <span style={{ fontFamily: 'var(--font)', fontWeight: isSelected ? 700 : 500, fontSize: '12px', color: isSelected ? op.color : 'var(--text)', lineHeight: 1.3 }}>
        {t(`transactions.types.${op.key}`)}
      </span>
      {isSelected && (
        <div style={{ position: 'absolute', top: '6px', right: '6px', width: '16px', height: '16px', borderRadius: '50%', background: op.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={10} color="#fff" />
        </div>
      )}
    </button>
  );
};

// ─── Carte package ───────────────────────────────────────────────────────────
const PkgCard = ({ plan, selected, onSelect }) => {
  const isSelected = selected?.code === plan.code;
  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: `1.5px solid ${isSelected ? '#7C3AED' : 'var(--border)'}`,
        background: isSelected ? 'rgba(124,58,237,0.06)' : 'var(--card-bg)',
        borderRadius: '12px', padding: '12px 16px', cursor: 'pointer',
        marginBottom: '8px', transition: 'all 0.12s', textAlign: 'left',
      }}
    >
      <div>
        <p style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: '14px', color: isSelected ? '#7C3AED' : 'var(--text)', margin: 0 }}>{plan.label}</p>
        {plan.includes && <p style={{ fontFamily: 'var(--font)', fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{plan.includes}</p>}
        <p style={{ fontFamily: 'var(--font)', fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{plan.validity}</p>
      </div>
      <span style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '15px', color: isSelected ? '#7C3AED' : 'var(--color-primary)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
        {fmt(plan.price)} F
      </span>
    </button>
  );
};

// ─── Composant principal ─────────────────────────────────────────────────────
const NewTransactionModal = ({ onClose, onCreated }) => {
  const { t } = useTranslation();

  const [step, setStep]               = useState(1);
  const [opType, setOpType]           = useState('deposit');
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

  const currentOp   = OPERATIONS.find((o) => o.key === opType) || OPERATIONS[0];
  const needsPackage = ['data_sale', 'unlimited'].includes(opType);
  const TOTAL_STEPS  = 3;

  // Charger les packages
  useEffect(() => {
    (async () => {
      setPkgLoading(true);
      try {
        const { data } = await api.get('/transactions/packages');
        setPackages(data.packages || {});
      } catch (_) {}
      finally { setPkgLoading(false); }
    })();
  }, []);

  // Reset quand le type change
  useEffect(() => {
    setSelectedPkg(null);
    setAmount('');
    setFreeAmount('');
    setUseFreeAmount(false);
    setErrors({});
  }, [opType]);

  const pkgList = packages[opType]?.plans || [];

  // ── Validation ──
  const validate1 = () => {
    const e = {};
    if (!clientPhone.trim())          e.clientPhone = t('transactions.form.phoneRequired');
    else if (!PHONE_RE.test(clientPhone.trim())) e.clientPhone = t('transactions.form.phoneInvalid');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validate2 = () => {
    const e = {};
    if (needsPackage) {
      if (!selectedPkg) e.pkg = t('transactions.form.packageRequired');
    } else {
      const val = useFreeAmount ? parseFloat(freeAmount) : parseFloat(amount);
      if (!val || val < 1) e.amount = t('transactions.form.amountInvalid');
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const getFinalAmount = () => {
    if (needsPackage && selectedPkg) return selectedPkg.price;
    return useFreeAmount ? parseFloat(freeAmount) : parseFloat(amount);
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
        ...(selectedPkg ? { packageCode: selectedPkg.code, packageLabel: selectedPkg.label } : {}),
      };
      const { data } = await api.post('/transactions', payload);
      setResult(data.transaction);
      if (onCreated) onCreated(data.transaction);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  // Fermeture sur overlay click
  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  // ── Écran succès ──
  if (result) {
    return (
      <div style={S.overlay} onClick={handleOverlay}>
        <div style={S.modal}>
          <div style={{ ...S.header, justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
              {t('transactions.form.successTitle')}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ ...S.body, textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={40} color="#16A34A" />
            </div>
            <p style={{ fontFamily: 'var(--font)', fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {t('transactions.form.successSubtitle')}
            </p>
            <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
              <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.reference')}</span><span style={{ ...S.recapValue, color: 'var(--color-primary)' }}>{result.reference}</span></div>
              <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.type')}</span><span style={S.recapValue}>{t(`transactions.types.${result.type}`)}</span></div>
              <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.amount')}</span><span style={{ ...S.recapValue, color: 'var(--color-primary)' }}>{fmt(result.amount)} XOF</span></div>
              {result.packageLabel && <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.pkg')}</span><span style={S.recapValue}>{result.packageLabel}</span></div>}
              <div style={{ ...S.recapRow, borderBottom: 'none' }}><span style={S.recapLabel}>{t('transactions.form.phone')}</span><span style={S.recapValue}>{result.clientPhone}</span></div>
            </div>
            <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              ⏳ {t('transactions.form.processingNote')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={onClose} variant="secondary" fullWidth>{t('transactions.form.seeAll')}</Button>
              <Button onClick={() => { setResult(null); setStep(1); setClientPhone(''); setClientName(''); setAmount(''); setFreeAmount(''); setSelectedPkg(null); setDescription(''); setOpType('deposit'); setErrors({}); }} fullWidth>
                {t('transactions.form.newBtn')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.overlay} onClick={handleOverlay}>
      <div style={S.modal}>
        {/* ── Header ── */}
        <div style={S.header}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
              <X size={20} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '16px', color: 'var(--text)', margin: 0 }}>
              {t('transactions.form.title')}
            </p>
            <p style={{ fontFamily: 'var(--font)', fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {t(`transactions.form.step${step}`)}
            </p>
          </div>
          <StepBar step={step} total={TOTAL_STEPS} />
        </div>

        <div style={S.body}>

          {/* ═══ ÉTAPE 1 ═══ */}
          {step === 1 && (
            <>
              {/* Numéro */}
              <label style={S.label}>{t('transactions.form.clientPhone')} *</label>
              <div style={{ ...S.inputIcon, borderColor: errors.clientPhone ? 'var(--color-error)' : 'var(--input-border)' }}>
                <Phone size={16} color="var(--text-secondary)" />
                <input
                  style={S.inputInner}
                  value={clientPhone}
                  onChange={(e) => { setClientPhone(e.target.value); setErrors({}); }}
                  placeholder={t('transactions.form.clientPhonePh')}
                  type="tel"
                  autoFocus
                />
              </div>
              {errors.clientPhone && <p style={S.err}>{errors.clientPhone}</p>}

              {/* Nom */}
              <label style={{ ...S.label, marginTop: '14px' }}>{t('transactions.form.clientName')}</label>
              <div style={S.inputIcon}>
                <User size={16} color="var(--text-secondary)" />
                <input style={S.inputInner} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t('transactions.form.clientNamePh')} />
              </div>

              {/* Grille types */}
              <p style={S.section}>{t('transactions.form.opType')}</p>
              <div style={S.opGrid}>
                {OPERATIONS.map((op) => (
                  <OpCard key={op.key} op={op} selected={opType} onSelect={setOpType} t={t} />
                ))}
              </div>

              <div style={{ marginTop: '8px', padding: '10px 14px', background: `${currentOp.bg}`, borderRadius: '10px', fontSize: '12px', fontFamily: 'var(--font)', color: currentOp.color }}>
                {t(`transactions.typeDescriptions.${opType}`)}
              </div>

              <Button fullWidth style={{ marginTop: '20px' }} onClick={() => { if (validate1()) setStep(2); }}>
                {t('common.next')} <ChevronRight size={16} />
              </Button>
            </>
          )}

          {/* ═══ ÉTAPE 2 ═══ */}
          {step === 2 && (
            <>
              {/* Résumé op */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: `${currentOp.bg}`, borderRadius: '12px', marginBottom: '4px' }}>
                <currentOp.Icon size={18} color={currentOp.color} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '14px', color: currentOp.color }}>
                    {t(`transactions.types.${opType}`)}
                  </span>
                  <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                    {clientPhone}{clientName ? ` — ${clientName}` : ''}
                  </span>
                </div>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <Edit2 size={14} />
                </button>
              </div>

              {/* Packages */}
              {needsPackage && (
                <>
                  <p style={S.section}>{t('transactions.form.choosePackage')}</p>
                  {pkgLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
                  ) : pkgList.length === 0 ? (
                    <p style={{ fontFamily: 'var(--font)', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>{t('transactions.form.noPackages')}</p>
                  ) : pkgList.map((plan) => (
                    <PkgCard key={plan.code} plan={plan} selected={selectedPkg} onSelect={setSelectedPkg} />
                  ))}
                  {errors.pkg && <p style={S.err}>{errors.pkg}</p>}
                </>
              )}

              {/* Montants libres */}
              {!needsPackage && (
                <>
                  {opType === 'credit_sale' && (
                    <>
                      <p style={S.section}>{t('transactions.form.amountPresets')}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {CREDIT_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => { setAmount(String(p)); setUseFreeAmount(false); setErrors({}); }}
                            style={{
                              padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                              border: `1.5px solid ${amount === String(p) && !useFreeAmount ? currentOp.color : 'var(--border)'}`,
                              background: amount === String(p) && !useFreeAmount ? `${currentOp.color}12` : 'var(--card-bg)',
                              fontFamily: 'var(--font)', fontWeight: 600, fontSize: '13px',
                              color: amount === String(p) && !useFreeAmount ? currentOp.color : 'var(--text)',
                            }}
                          >
                            {fmt(p)} F
                          </button>
                        ))}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                        <input type="checkbox" checked={useFreeAmount} onChange={(e) => { setUseFreeAmount(e.target.checked); setAmount(''); setErrors({}); }} />
                        <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)' }}>{t('transactions.form.orFree')}</span>
                      </label>
                    </>
                  )}

                  {(opType !== 'credit_sale' || useFreeAmount) && (
                    <>
                      <label style={{ ...S.label, marginTop: opType === 'credit_sale' ? 0 : 4 }}>{t('transactions.form.amount')} *</label>
                      <div style={{ ...S.inputIcon, borderColor: errors.amount ? 'var(--color-error)' : 'var(--input-border)' }}>
                        <DollarSign size={16} color="var(--text-secondary)" />
                        <input
                          style={S.inputInner}
                          value={useFreeAmount ? freeAmount : amount}
                          onChange={(e) => { useFreeAmount ? setFreeAmount(e.target.value) : setAmount(e.target.value); setErrors({}); }}
                          placeholder={t('transactions.form.amountPh')}
                          type="number"
                          min="1"
                        />
                        <span style={{ fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>XOF</span>
                      </div>
                      {errors.amount && <p style={S.err}>{errors.amount}</p>}
                    </>
                  )}
                </>
              )}

              {/* Description */}
              <label style={{ ...S.label, marginTop: '16px' }}>{t('transactions.form.description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('transactions.form.descPh')}
                rows={3}
                style={{ ...S.input, height: 'auto', padding: '10px 14px', resize: 'vertical', lineHeight: '1.5' }}
              />

              <Button fullWidth style={{ marginTop: '16px' }} onClick={() => { if (validate2()) setStep(3); }}>
                {t('common.next')} <ChevronRight size={16} />
              </Button>
            </>
          )}

          {/* ═══ ÉTAPE 3 ═══ */}
          {step === 3 && (
            <>
              <p style={S.section}>{t('transactions.form.recap')}</p>

              {/* Icône centrée */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: currentOp.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <currentOp.Icon size={34} color={currentOp.color} />
                </div>
              </div>

              {/* Récap */}
              <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '4px 16px', marginBottom: '16px' }}>
                <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.type')}</span><span style={{ ...S.recapValue, color: currentOp.color }}>{t(`transactions.types.${opType}`)}</span></div>
                <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.phone')}</span><span style={S.recapValue}>{clientPhone}</span></div>
                {clientName && <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.name')}</span><span style={S.recapValue}>{clientName}</span></div>}
                {selectedPkg && (
                  <>
                    <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.pkg')}</span><span style={S.recapValue}>{selectedPkg.label}</span></div>
                    <div style={S.recapRow}><span style={S.recapLabel}>{t('transactions.form.validity')}</span><span style={S.recapValue}>{selectedPkg.validity}</span></div>
                  </>
                )}
                <div style={{ ...S.recapRow, borderBottom: 'none' }}>
                  <span style={S.recapLabel}>{t('transactions.form.amount')}</span>
                  <span style={{ ...S.recapValue, fontSize: '16px', color: 'var(--color-primary)' }}>{fmt(getFinalAmount())} XOF</span>
                </div>
              </div>

              {errors.general && (
                <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '10px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--color-error)', marginBottom: '12px' }}>
                  {errors.general}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="secondary" fullWidth onClick={() => setStep(2)}><Edit2 size={14} /> {t('transactions.form.editBtn')}</Button>
                <Button fullWidth loading={loading} onClick={handleSubmit}>
                  {loading ? t('transactions.form.processing') : t('transactions.form.confirmBtn')}
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default NewTransactionModal;
