import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import pdf from 'pdf-parse';

dotenv.config();

const app = express();
const port = process.env.PORT || 5173;
const upload = multer({ storage: multer.memoryStorage() });
const geminiApiKey = process.env.GEMINI_API_KEY;
const sessionSecret = process.env.SESSION_SECRET || 'change-me';
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const users = [];

authLog('Starting EduHub server');

function authLog(message) {
  console.log(`[Auth] ${message}`);
}

const transporter = createTransporter();

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    authLog('SMTP environment variables are incomplete; email sending is disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return users.find((user) => user.id === id);
}

function sendWelcomeEmail(user) {
  if (!transporter) {
    authLog(`Skipping welcome email for ${user.email}, transporter not configured.`);
    return;
  }

  const message = {
    from: process.env.FROM_EMAIL || 'EduHub <no-reply@eduhub.example.com>',
    to: user.email,
    subject: `Welcome to EduHub, ${user.fullName}!`,
    text: `Hello ${user.fullName},\n\nWelcome to EduHub! Your student dashboard is ready. Start by building your timetable and using the AI study tools.\n\nBest regards,\nThe EduHub Team`,
    html: `<p>Hello ${user.fullName},</p><p>Welcome to <strong>EduHub</strong>! Your student dashboard is ready. Start by building your timetable and using the AI study tools.</p><p>Best regards,<br/>The EduHub Team</p>`,
  };

  transporter.sendMail(message, (error, info) => {
    if (error) {
      authLog(`Welcome email failed for ${user.email}: ${error.message}`);
      return;
    }
    authLog(`Welcome email sent to ${user.email}: ${info.messageId}`);
  });
}

authLog(`Gemini API Key configured: ${Boolean(geminiApiKey)}`);
if (!geminiApiKey) {
  authLog('WARNING: GEMINI_API_KEY is not set in .env');
}

app.use(express.json());
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.resolve('')));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = findUserById(id);
  done(null, user || false);
});

if (googleClientId && googleClientSecret) {
  passport.use(new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Google account has no email address.'));
        }

        let user = findUserByEmail(email);
        if (!user) {
          user = {
            id: `user_${Date.now()}`,
            email,
            fullName: profile.displayName || email,
            passwordHash: null,
            googleId: profile.id,
          };
          users.push(user);
          sendWelcomeEmail(user);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ));
} else {
  authLog('Google OAuth is disabled because GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured.');
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required.' });
}

app.post('/api/signup', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  if (findUserByEmail(email)) {
    return res.status(400).json({ error: 'A user with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: `user_${Date.now()}`,
    fullName,
    email,
    passwordHash,
    googleId: null,
  };

  users.push(user);
  req.login(user, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to create session.' });
    }
    sendWelcomeEmail(user);
    return res.json({ authenticated: true, user: { fullName: user.fullName, email: user.email } });
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  req.login(user, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to create session.' });
    }
    return res.json({ authenticated: true, user: { fullName: user.fullName, email: user.email } });
  });
});

app.post('/api/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ authenticated: false });
    });
  });
});

app.get('/api/session', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ authenticated: true, user: { fullName: req.user.fullName, email: req.user.email } });
  }
  return res.json({ authenticated: false });
});

app.get('/auth/google', (req, res, next) => {
  if (!googleClientId || !googleClientSecret) {
    return res.status(500).send('Google authentication is not configured on the server.');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/?auth=fail',
  session: true,
}), (req, res) => {
  res.redirect('/?auth=success');
});

app.post('/api/gemini', ensureAuthenticated, async (req, res) => {
  if (!geminiApiKey) {
    return res.status(500).json({ error: 'Server Gemini API key is not configured.' });
  }

  try {
    const { prompt, temperature = 0.65, max_tokens = 800 } = req.body;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${geminiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: prompt,
        temperature,
        max_output_tokens: max_tokens,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API request failed' });
    }

    const output = (data.output || []).map((item) => item.content.map((block) => (typeof block === 'string' ? block : block.text || '')).join('')).join('\n');
    return res.json({ text: output });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/pdf-text', ensureAuthenticated, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }
    const data = await pdf(req.file.buffer);
    return res.json({ text: data.text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`EduHub server listening at http://localhost:${port}`);
});
