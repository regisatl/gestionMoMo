const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone est requis'],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{7,14}$/, 'Numéro de téléphone invalide'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Jamais retourné par défaut
    },
    role: {
      type: String,
      enum: ['super_admin', 'merchant', 'client'],
      default: 'client',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending',
    },
    avatar: { type: String, default: null },
    language: { type: String, enum: ['fr', 'en'], default: 'fr' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    lastLogin: { type: Date, default: null },
    refreshToken: { type: String, select: false },

    // Champs spécifiques marchands
    businessName: { type: String, default: null },
    businessAddress: { type: String, default: null },

    // Réinitialisation mot de passe
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Méthode de comparaison mot de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Index pour recherche performante
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
