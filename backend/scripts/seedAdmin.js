import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';

dotenv.config();

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function parseArgs() {
  const out = {};
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [rawKey, ...rest] = arg.slice(2).split('=');
    const value = rest.length ? rest.join('=') : 'true';
    out[rawKey] = value;
  }
  return out;
}

async function run() {
  const args = parseArgs();
  const email = String(args.email || 'admin@example.com').trim().toLowerCase();
  const password = String(args.password || 'Admin@123');
  const firstName = String(args.firstName || 'Site').trim();
  const lastName = String(args.lastName || 'Admin').trim();
  const resetPassword = args.resetPassword === 'true';

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!email) {
    console.error('Missing --email');
    process.exit(1);
  }

  if (!mongoUri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'admin';
      existing.status = 'active';
      if (!existing.firstName) existing.firstName = firstName;
      if (!existing.lastName) existing.lastName = lastName;

      const needsPassword = !existing.password;
      if (resetPassword || needsPassword) {
        if (!PASSWORD_REGEX.test(password)) {
          console.error('Password does not meet policy (8+ chars, upper, lower, number, special).');
          process.exit(1);
        }
        existing.password = await bcrypt.hash(password, 10);
      }
      await existing.save();
      console.log(`Promoted existing user to admin: ${existing.email}`);
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      console.error('Password does not meet policy (8+ chars, upper, lower, number, special).');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      role: 'admin',
      status: 'active',
    });

    console.log(`Created admin user: ${admin.email}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
