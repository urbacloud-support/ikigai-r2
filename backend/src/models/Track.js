import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  code: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model('Track', trackSchema, 'tracks');
