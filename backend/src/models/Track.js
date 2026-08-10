import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model('Track', trackSchema, 'tracks');
