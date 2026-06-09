const express = require('express');
const router  = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const RETRY_DELAYS_MS = [700, 1600];

// Strict rate limit on AI routes — they cost money
const aiLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,
  message: { error: 'Too many AI requests. Wait a moment.' }
});

router.use(aiLimit);


// Accepts base64 image, returns array of {name, dosage}
router.post('/ocr', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const result = await generateWithRetry([
      {
        inlineData: { mimeType, data: imageBase64 }
      },
      {
        text: `You are a medical prescription reader.
Extract ALL medicine names and dosages from this prescription image.
Return ONLY a valid JSON array. No explanation. No markdown. No extra text.
Format: [{"name":"Medicine Name","dosage":"500mg"},{"name":"Another Med","dosage":"10mg"}]
If no medicines found, return: []`
      }
    ]);

    const raw  = result.response.text().trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const medicines = JSON.parse(clean);

    res.json({ medicines, count: medicines.length });

  } catch (err) {
    console.error('OCR error:', err.message);
    // Return empty rather than crashing — frontend handles gracefully
    res.json({ medicines: [], error: 'Could not read prescription clearly' });
  }
});


// Explains why a pharmacy's price is high/low
router.post('/explain', async (req, res) => {
  const { medicine, pharmacy, price, cheapestPrice, nppaCeiling, avgPrice } = req.body;

  if (!medicine || !pharmacy || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const breachText = nppaCeiling && price > nppaCeiling
      ? `This price of ₹${price} exceeds the NPPA government ceiling of ₹${nppaCeiling}, which is illegal.`
      : '';

    const prompt = `You are a medicine pricing expert in India.
${pharmacy} sells ${medicine} for ₹${price}.
Cheapest available: ₹${cheapestPrice}.
Market average: ₹${avgPrice || 'unknown'}.
NPPA government ceiling: ₹${nppaCeiling || 'not regulated'}.
${breachText}

Write exactly 2 short sentences (max 25 words each) explaining why this price is what it is.
Be specific. Mention actual numbers. Use plain English a patient would understand.
No bullet points. No headers. Just 2 sentences.`;

    const result = await generateWithRetry(prompt);
    const explanation = result.response.text().trim();

    res.json({ explanation });

  } catch (err) {
    console.error('Explain error:', err.message);
    res.json({
      explanation: buildFallbackExplanation({
        pharmacy,
        price,
        cheapestPrice,
        nppaCeiling,
        avgPrice,
      }),
      fallback: true,
    });
  }
});

async function generateWithRetry(input) {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await model.generateContent(input);
    } catch (err) {
      lastError = err;
      if (!isTransientGeminiError(err) || attempt === RETRY_DELAYS_MS.length) throw err;
      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

function isTransientGeminiError(err) {
  const message = err?.message || '';
  return /\b(429|500|503|504)\b|overload|high demand|temporarily|unavailable|deadline/i.test(message);
}

function buildFallbackExplanation({ pharmacy, price, cheapestPrice, nppaCeiling, avgPrice }) {
  const current = Number(price);
  const cheapest = Number(cheapestPrice);
  const ceiling = Number(nppaCeiling);
  const average = Number(avgPrice);

  if (Number.isFinite(ceiling) && ceiling > 0 && current > ceiling) {
    return `${pharmacy} charges ₹${current.toFixed(2)}, above the NPPA ceiling of ₹${ceiling.toFixed(2)}. The ceiling is the maximum regulated price per unit.`;
  }

  if (Number.isFinite(cheapest) && cheapest > 0 && current > cheapest) {
    const extra = current - cheapest;
    const percent = Math.round((extra / cheapest) * 100);
    return `${pharmacy} charges ₹${current.toFixed(2)}, which is ₹${extra.toFixed(2)} (${percent}%) above the cheapest listing. Prices can differ because of seller discounts and stock.`;
  }

  if (Number.isFinite(average) && average > 0) {
    const comparison = current <= average ? 'below' : 'above';
    return `${pharmacy} lists this medicine at ₹${current.toFixed(2)}, the cheapest available price. It is ${comparison} the current average of ₹${average.toFixed(2)}.`;
  }

  return `${pharmacy} lists this medicine at ₹${current.toFixed(2)}, the cheapest price currently available. Final prices may vary with stock and seller discounts.`;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;
