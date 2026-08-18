import mongoose from 'mongoose';

const CarSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 1990,
    max: 2025
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  km: {
    type: Number,
    required: true,
    min: 0
  },
  fuel: {
    type: String,
    required: true,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG']
  },
  trans: {
    type: String,
    required: true,
    enum: ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT']
  },
  owner: {
    type: String,
    required: true,
    enum: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner']
  },
  desc: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Car', CarSchema);