// server.js
require('dotenv').config();
const path     = require('path');
const fs       = require('fs');
const express  = require('express');
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// ─── Middleware ─────────────────────────────────────────────────
app.use(express.json());

const allowedOrigins = ['https://study-classmate-app.vercel.app', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));



// ─── Connect to MongoDB ──────────────────────────────────────────
mongoose.connect(MONGODB_URI, {
  dbName: 'ai_classmate',
  useNewUrlParser:    true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ DB error:', err));

// ─── Models ─────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username:       { type: String, unique: true, required: true },
  password:       { type: String, required: true },
  diamonds:       { type: Number, default: 20 },
  streakDays:     { type: Number, default: 0 },
  
  avatarUrl:      { type: String, default: '' },
  scores:         [{ name: String, score: Number, time: String }],
  purchasedSkins: { type: [String], default: [] },
  selectedSkinId: { type: Number, default: null }
});
const User = mongoose.model('User', userSchema);

const summarySchema = new mongoose.Schema({
  username:  { type: String, required: true, index: true },
  content:   String,
  source:    { type: String, enum: ['manual', 'ai', 'file'], default: 'manual' }, // ✅ NEW
  createdAt: { type: Date, default: Date.now }
});
const Summary = mongoose.model('Summary', summarySchema);

const paraphraseSchema = new mongoose.Schema({
  username:  { type: String, required: true, index: true },
  content:   String,
  tone:      String,
  source:    { type: String, enum: ['manual', 'ai'], default: 'manual' }, // ✅ NEW
  createdAt: { type: Date, default: Date.now }
});

const Paraphrase = mongoose.model('Paraphrase', paraphraseSchema);

const vocabSchema = new mongoose.Schema({
  username:      { type: String, required: true, index: true },
  word:          String,
  definition:    String,
  source:        { type: String, enum: ['manual', 'random', 'extract-manual', 'extract-ai'], default: 'manual' }, // ✅ NEW
  partOfSpeech:  String,
  example:       String,
  pronunciation: String,
  createdAt:     { type: Date, default: Date.now }
});

const Vocab = mongoose.model('Vocab', vocabSchema);


// ─── OpenAI Client ───────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── File Upload Setup ──────────────────────────────────────────
const avatarDest = path.join(__dirname, 'public/uploads');
fs.mkdirSync(avatarDest, { recursive: true });
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDest),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.username}_${Date.now()}${ext}`);
  }
});
const avatarUpload = multer({ storage: avatarStorage });

const docDest = path.join(__dirname, 'uploads');
fs.mkdirSync(docDest, { recursive: true });
const docUpload = multer({ dest: docDest });

app.use('/uploads', express.static(avatarDest));


const mediaSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text:     { type: String, required: true },
  createdAt:{ type: Date, default: Date.now }
});
const Media = mongoose.model('Media', mediaSchema);

const savedMediaSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  postId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  createdAt: { type: Date, default: Date.now }
});
const SavedMedia = mongoose.model('SavedMedia', savedMediaSchema);

// ─── Auth Routes ────────────────────────────────────────────────
// ── Signup Route ─────────────────────
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: 'Signup successful' });

  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ message: 'Server error during signup' });
  }
});


// ── Login Route ─────────────────────
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    return res.json({ message: 'Login successful' });

  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});


// ─── Profile & Avatar ──────────────────────────────────────────
app.get('/profile', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });
  const user = await User.findOne({ username }).select('username bio avatarUrl -_id');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/upload-avatar', avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file || !req.body.username) return res.status(400).json({ error: 'Missing file or username' });
  try {
    const url = `/uploads/${req.file.filename}`;
    await User.updateOne({ username: req.body.username }, { avatarUrl: url });
    res.json({ avatarUrl: url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Avatar upload failed' });
  }
});

app.post('/update-bio', async (req, res) => {
  const { username, bio } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  const u = await User.findOneAndUpdate({ username }, { bio }, { new: true });
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ bio: u.bio });
});

// ─── Wallet & Game State ───────────────────────────────────────
app.get('/game-state', async (req, res) => {
  const { username } = req.query;
  const u = await User.findOne({ username });
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({
    diamonds:       u.diamonds,
    scores:         u.scores,
    purchasedSkins: u.purchasedSkins,
    selectedSkinId: u.selectedSkinId,
    streakDays:     u.streakDays
  });
});

app.post('/update-diamonds', async (req, res) => {
  const { username, diamonds } = req.body;
  const u = await User.findOneAndUpdate({ username }, { diamonds }, { new: true });
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ diamonds: u.diamonds });
});

app.post('/save-streak', async (req, res) => {
  const { username, streakDays } = req.body;
  const u = await User.findOneAndUpdate({ username }, { streakDays }, { new: true });
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ streakDays: u.streakDays });
});

app.post('/buy-skin', async (req, res) => {
  const { username, skinId } = req.body;
  const u = await User.findOne({ username });
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (!u.purchasedSkins.includes(skinId)) {
    u.purchasedSkins.push(skinId);
    await u.save();
  }
  res.json({ purchasedSkins: u.purchasedSkins });
});

app.post('/save-skin', async (req, res) => {
  const { username, skinId } = req.body;
  const u = await User.findOneAndUpdate(
    { username },
    { selectedSkinId: skinId },
    { new: true }
  );
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ selectedSkinId: u.selectedSkinId });
});

app.post('/change-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!(await bcrypt.compare(oldPassword, user.password))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password changed' });
});

// ─── AI & Note Routes ──────────────────────────────────────────
app.post('/generate-note', async (req, res) => {
  try {
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Generate a concise study-note paragraph (3–5 sentences) on a random CS topic.' }],
      temperature: 0.7
    });
    res.json({ note: aiRes.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Note generation failed' });
  }
});

app.post('/summarize-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text' });
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Summarize the following text into bullet points:\n\n${text}` }],
      temperature: 0.7
    });
    res.json({ summary: aiRes.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Text summarization failed' });
  }
});

app.post('/summarize', docUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    let text = '';
    const { mimetype, path: tmp } = req.file;
    if (mimetype === 'application/pdf') {
      text = (await pdfParse(fs.readFileSync(tmp))).text;
    } else if (mimetype === 'text/plain') {
      text = fs.readFileSync(tmp, 'utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    fs.unlinkSync(tmp);
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Summarize the following into bullet points:\n\n${text}` }],
      temperature: 0.7
    });
    res.json({ summary: aiRes.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'File summarization failed' });
  }
});

// ─── Save & List Summaries / Paraphrases / Vocab ──────────────

app.post('/save-summary', async (req, res) => {
  const { username, content, source } = req.body;
  if (!username || !content) return res.status(400).json({ error: 'Missing fields' });
  await new Summary({ username, content, source }).save(); // ✅ now includes source
  res.json({ message: 'Summary saved' });
});

app.get('/summaries', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });
  const list = await Summary.find({ username }).sort({ createdAt: -1 });
  res.json(list);
});

app.post('/save-paraphrase', async (req, res) => {
  const { username, content, tone, source } = req.body;
  if (!username || !content) return res.status(400).json({ error: 'Missing fields' });
  await new Paraphrase({ username, content, tone, source }).save(); // ✅ now includes source
  res.json({ message: 'Paraphrase saved' });
});

app.get('/paraphrases', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });
  const list = await Paraphrase.find({ username }).sort({ createdAt: -1 });
  res.json(list);
});

app.post('/save-vocab', async (req, res) => {
  const { username, word, definition, source, partOfSpeech, example, pronunciation } = req.body;
  if (!username || !word || !definition) return res.status(400).json({ error: 'Missing fields' });
  await new Vocab({ username, word, definition, source, partOfSpeech, example, pronunciation }).save(); // ✅ now includes source
  res.json({ message: 'Vocab saved' });
});

app.get('/vocab-list', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });
  const list = await Vocab.find({ username }).sort({ createdAt: -1 });
  res.json(list);
});

// ─── AI Endpoints You Were Missing ─────────────────────────────

// Generate a random English word
app.post('/generate-word', async (req, res) => {
  try {
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Give me a single, random English word.' }],
      temperature: 0.8
    });
    const word = aiRes.choices[0].message.content.trim().split(/\s+/)[0];
    res.json({ word });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Word generation failed' });
  }
});

// Paraphrase arbitrary text (and return it)
app.post('/paraphrase-text', async (req, res) => {
  try {
    const { text, tone } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const prompt = tone
      ? `Paraphrase the following in a ${tone} tone:\n\n${text}`
      : `Paraphrase the following:\n\n${text}`;
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    res.json({ content: aiRes.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Paraphrase failed' });
  }
});

// Extract vocabulary from arbitrary text
app.post('/extract-vocab', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text' });
    const prompt = `Extract 5-10 key vocabulary words from the paragraph. Return a JSON array of words.`;
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `${prompt}\n\n${text}` }],
      temperature: 0.5
    });
    let words = JSON.parse(aiRes.choices[0].message.content.trim());
    res.json({ words });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vocab extraction failed' });
  }
});


app.delete('/delete-summary/:id', async (req, res) => {
  try {
    await Summary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Summary deleted' });
  } catch (err) {
    console.error('Summary delete error:', err);
    res.status(500).json({ error: 'Failed to delete summary' });
  }
});

app.delete('/delete-paraphrase/:id', async (req, res) => {
  try {
    await Paraphrase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Paraphrase deleted' });
  } catch (err) {
    console.error('Paraphrase delete error:', err);
    res.status(500).json({ error: 'Failed to delete paraphrase' });
  }
});

app.delete('/delete-vocab/:id', async (req, res) => {
  try {
    await Vocab.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vocab deleted' });
  } catch (err) {
    console.error('Vocab delete error:', err);
    res.status(500).json({ error: 'Failed to delete vocab' });
  }
});


app.post('/define-word', async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'No word' });
  try {
    const prompt = `Define the English word "${word}" clearly in one sentence.`;
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });
    const content = aiRes.choices[0].message.content.trim();
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Definition failed' });
  }
});

// GET route to fetch all media posts (newest first)
app.get('/media-posts', async (req, res) => {
  const posts = await Media.find().sort({ createdAt: -1 });
  res.json(posts);
});

// POST route to create a new post
app.post('/media-posts', async (req, res) => {
  const { username, text } = req.body;
  if (!username || !text) return res.status(400).json({ message: 'Missing fields' });

  const post = new Media({ username, text });
  await post.save();
  res.status(201).json(post); // return the post directly
});
// GET all saved media for a user with full post populated
app.get('/saved-media', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const savedItems = await SavedMedia.find({ username }).populate('postId');
  res.json(savedItems);
});
app.post('/save-media', async (req, res) => {
  const { username, postId } = req.body;
  if (!username || !postId) return res.status(400).json({ error: 'Missing fields' });

  const saved = new SavedMedia({ username, postId });
  await saved.save();
  res.status(201).json({ message: 'Media saved' });
});

// DELETE a media post

app.delete('/media-posts/:id', async (req, res) => {
  try {
    const deleted = await Media.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

app.delete('/delete-media/:id', async (req, res) => {
  try {
    const deleted = await SavedMedia.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Saved media not found' });
    res.json({ message: 'Saved media deleted' });
  } catch (err) {
    console.error('Delete saved media error:', err);
    res.status(500).json({ error: 'Failed to delete saved media' });
  }
});

// ─── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on http://127.0.0.1:${PORT}`));
