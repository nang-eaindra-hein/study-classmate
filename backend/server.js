require('dotenv').config(); // ✅ this loads the .env file
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Example OpenAI endpoint (optional)
app.post('/summarize', async (req, res) => {
  const { Configuration, OpenAIApi } = require('openai');

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "Summarize this:\n" + req.body.notes,
      max_tokens: 100,
    });

    res.json({ summary: response.data.choices[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong with OpenAI." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
