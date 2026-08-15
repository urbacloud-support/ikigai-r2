import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Track from '../src/models/Track.js';

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://supporturbancloud_db_user:h7WOOfUHjW8ZeYgY@ac-oxnbwks-shard-00-00.nitqnff.mongodb.net:27017,ac-oxnbwks-shard-00-01.nitqnff.mongodb.net:27017,ac-oxnbwks-shard-00-02.nitqnff.mongodb.net:27017/ikigai2?ssl=true&replicaSet=atlas-hwvekc-shard-0&authSource=admin&appName=Cluster0";

const seedData = [
  {
    code: '001',
    title: 'SportsTech',
    description: 'Smarter Data. Faster Decision. Better Performance'
  },
  {
    code: '002',
    title: 'NextGenAI',
    description: 'Harnessing AI to Build Healthier Communities and Smarter Cities.'
  },
  {
    code: '003',
    title: 'Cyber Security',
    description: 'Think Offense. Build Defense'
  },
  {
    code: '004',
    title: 'AgriTech',
    description: 'Transforming Global Agriculture through Actionable Insights and Intelligent Agronomy.'
  },
  {
    code: '005',
    title: 'Sustainability',
    description: 'Debug the Planets Problem.'
  }
];

async function seedTracks() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    for (const trackData of seedData) {
      const updated = await Track.findOneAndUpdate(
        { title: trackData.title }, // Find by title (in case it exists without code)
        { $set: trackData },
        { upsert: true, new: true }
      );
      console.log(`Upserted Track: ${updated.code} - ${updated.title}`);
    }

    console.log("Seeding complete.");
  } catch (err) {
    console.error("Error seeding tracks:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seedTracks();
