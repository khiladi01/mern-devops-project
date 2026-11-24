/**
 * Creates (or resets the password of) an admin account.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='S0me-long-pass' npm run create-admin
 *   npm run create-admin -- --email you@example.com --name "Your Name"   (prompts for password)
 *
 * The password is never stored in the repository; it comes from the
 * environment or an interactive prompt (hidden input).
 */
const readline = require('readline');
const mongoose = require('mongoose');
const config = require('../config');

config.validate();

const Admin = require('../models/Admin');
const { PASSWORD_RULE } = require('../middleware/validators');

const arg = (name) => {
  const idx = process.argv.indexOf(`--${name}`);
  return idx > -1 ? process.argv[idx + 1] : undefined;
};

const promptHidden = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (str) => {
      if (str.includes(question)) rl.output.write(str);
      else rl.output.write('*'.repeat(str.replace(/[\r\n]/g, '').length) + (/[\r\n]/.test(str) ? '\n' : ''));
    };
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const main = async () => {
  const email = (arg('email') || config.admin.email || '').trim().toLowerCase();
  const name = arg('name') || config.admin.name;
  let password = config.admin.password;

  if (!email) throw new Error('Provide an email via ADMIN_EMAIL or --email.');
  if (!password) {
    if (!process.stdin.isTTY) throw new Error('Provide ADMIN_PASSWORD (no interactive terminal available).');
    password = await promptHidden('Password (min 10 chars, letters + numbers): ');
  }
  if (!PASSWORD_RULE.test(password)) {
    throw new Error('Password must be at least 10 characters and contain a letter and a number.');
  }

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });

  const existing = await Admin.findOne({ email });
  if (existing) {
    existing.password = password;
    existing.name = name;
    await existing.save();
    console.log(`Updated password for existing admin ${email}`);
  } else {
    await Admin.create({ name, email, password });
    console.log(`Created admin ${email}`);
  }
};

main()
  .catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
