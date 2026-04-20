import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPOI {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  category: 'restaurant' | 'hotel' | 'activity' | 'transport' | 'attractions' | 'other';
  cost?: number;
  currency?: string;
  addedBy: mongoose.Types.ObjectId;
  status: 'suggestion' | 'confirmed';
  votes: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface ITripMember {
  user: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface ITrip extends Document {
  name: string;
  description?: string;
  destination: {
    name: string;
    lat: number;
    lng: number;
  };
  startDate: Date;
  endDate: Date;
  budget: {
    total: number;
    currency: string;
    spent?: number;
  };
  createdBy: mongoose.Types.ObjectId;
  inviteCode: string;
  members: ITripMember[];
  pois: IPOI[];
  createdAt: Date;
  updatedAt: Date;
  calculateSpent(): number;
}

const poiSchema = new Schema<IPOI>({
  name: { type: String, required: true },
  description: { type: String },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['restaurant', 'hotel', 'activity', 'transport', 'attractions', 'other'],
    default: 'other'
  },
  cost: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['suggestion', 'confirmed'], default: 'suggestion' },
  votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const tripMemberSchema = new Schema<ITripMember>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
});

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const tripSchema = new Schema<ITrip>({
  name: { type: String, required: true },
  description: { type: String },
  destination: {
    name: { type: String, required: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: {
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    spent: { type: Number, default: 0 }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCode: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => generateInviteCode()
  },
  members: [tripMemberSchema],
  pois: [poiSchema]
}, {
  timestamps: true
});

tripSchema.index({ inviteCode: 1 });
tripSchema.index({ 'members.user': 1 });

tripSchema.pre('validate', async function() {
  if (this.isNew && !this.inviteCode) {
    const TripModel = this.constructor as Model<ITrip>;
    let code = generateInviteCode();
    let exists = await TripModel.findOne({ inviteCode: code });
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generateInviteCode();
      exists = await TripModel.findOne({ inviteCode: code });
      attempts++;
    }
    this.inviteCode = code;
  }
});

tripSchema.methods.calculateSpent = function(): number {
  return this.pois
    .filter((poi: IPOI) => poi.status === 'confirmed' && poi.cost)
    .reduce((sum: number, poi: IPOI) => sum + (poi.cost || 0), 0);
};

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);