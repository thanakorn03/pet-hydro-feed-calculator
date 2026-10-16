// =============================================
// server.js — Express.js REST API Server
// Pet Hydro-Feed Calculator
// =============================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { initDB, getAllPets, addPet, deletePet, getSummary } = require('./db');

const { isAllowedAdvisorTopic, buildAdvisorReply } = require('./public/chatAdvisor');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/pets.db';
const VALID_PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'mouse'];
const AI_API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || process.env.AI_MODELS || 'gemini-2.0-flash';

// =============================================
// Middleware
// =============================================
app.use(express.json());

// CORS configuration — allow frontend origin in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
initDB(DB_PATH);
console.log(`📦 SQLite database initialized at: ${DB_PATH}`);

// =============================================
// Calculation Logic (exported for testing)
// =============================================
const ACTIVITY_MULTIPLIER = {
  low: 1.0,
  medium: 1.2,
  high: 1.4
};

// Realistic weight limits per pet species (kg)
const PET_WEIGHT_LIMITS = {
  dog: { min: 0.5, max: 100, label: '0.5 - 100 kg' },
  cat: { min: 0.3, max: 20, label: '0.3 - 20 kg' },
  rabbit: { min: 0.3, max: 12, label: '0.3 - 12 kg' },
  bird: { min: 0.01, max: 3, label: '0.01 - 3 kg (10g - 3,000g)' },
  hamster: { min: 0.01, max: 0.4, label: '0.01 - 0.4 kg (10g - 400g)' },
  mouse: { min: 0.01, max: 0.8, label: '0.01 - 0.8 kg (10g - 800g)' },
  fish: { min: 0.001, max: 5, label: '0.001 - 5 kg (1g - 5,000g)' }
};

/**
 * Calculate water and food requirements according to species reality
 * @param {number} weight - Pet weight in kg
 * @param {string} activity - Activity level: 'low', 'medium', 'high'
 * @param {string} [type='dog'] - Pet type: 'dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'mouse'
 * @returns {Object} - { water_ml, food_g }
 */
function calculateRequirements(weight, activity, type = 'dog') {
  const mult = ACTIVITY_MULTIPLIER[activity] || 1.0;
  let water_ml = 0;
  let food_g = 0;

  switch (type) {
    case 'dog':
      // Dogs: ~60 ml/kg water, ~18 g/kg food * activity
      water_ml = weight * 60;
      food_g = weight * 18 * mult;
      break;

    case 'cat':
      // Cats: ~50 ml/kg water, ~15 g/kg dry food * activity
      water_ml = weight * 50;
      food_g = weight * 15 * mult;
      break;

    case 'rabbit':
      // Rabbits: high water requirement ~100 ml/kg, ~25 g/kg pellets/greens * activity
      water_ml = weight * 100;
      food_g = weight * 25 * mult;
      break;

    case 'bird':
      // Birds: ~50 ml/kg water, seed/pellet ~10-12% of body weight (approx 100-120 g/kg)
      water_ml = weight * 50;
      food_g = weight * 100 * mult;
      break;

    case 'hamster':
      // Hamsters: ~100 ml/kg water, ~100-120 g/kg food (~10-12g food per 100g hamster)
      water_ml = weight * 100;
      food_g = weight * 110 * mult;
      break;

    case 'mouse':
      // Mice/Rats: ~120 ml/kg water, ~120-150 g/kg food
      water_ml = weight * 120;
      food_g = weight * 130 * mult;
      break;

    case 'fish':
      // Fish: lives in water (0 ml additional drinking water), daily feed ~2% of body weight (20 g/kg)
      water_ml = 0;
      food_g = weight * 20 * mult;
      break;

    default:
      water_ml = weight * 60;
      food_g = weight * 18 * mult;
      break;
  }

  return {
    water_ml: Math.round(water_ml * 100) / 100,
    food_g: Math.round(food_g * 100) / 100
  };
}

// =============================================
// Validation Helper
// =============================================
function validatePetInput(body) {
  const errors = [];
  const { name, type, weight, activity, breed } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Pet name is required');
  }
  if (!type || !VALID_PET_TYPES.includes(type)) {
    errors.push(`Pet type must be one of: ${VALID_PET_TYPES.join(', ')}`);
  }
  if (breed !== undefined && breed !== null && typeof breed !== 'string') {
    errors.push('Breed must be text');
  }
  if (weight === undefined || weight === null || typeof weight !== 'number' || weight <= 0) {
    errors.push('Weight must be greater than 0');
  } else if (type && PET_WEIGHT_LIMITS[type]) {
    const limits = PET_WEIGHT_LIMITS[type];
    if (weight < limits.min || weight > limits.max) {
      errors.push(`Weight for ${type} must be between ${limits.label}`);
    }
  }
  if (!activity || !['low', 'medium', 'high'].includes(activity)) {
    errors.push('Activity level must be "low", "medium", or "high"');
  }

  return errors;
}

// =============================================
// AI Advisor Logic
// =============================================

async function getGeminiAdvice(message) {
  if (!AI_API_KEY) {
    return null;
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `You are a helpful pet care assistant for a Thai pet nutrition app. Reply only in Thai. Stay inside the scope of pet care, food, toys, health, and Pet Hydro-Feed Calculator. Do not answer unrelated questions.\n\nUser question: ${message}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .join('\n')
      .trim();

    return text || null;
  } catch (error) {
    console.error('❌ Gemini advisor request failed:', error.message);
    return null;
  }
}

// =============================================
// API Routes
// =============================================

app.post('/api/ai/advice', async (req, res) => {
  const { message } = req.body || {};
  const trimmedMessage = String(message || '').trim();

  if (!trimmedMessage) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  if (!isAllowedAdvisorTopic(trimmedMessage)) {
    return res.status(200).json({
      success: true,
      answer: 'ฉันรับเฉพาะคำปรึกษาเรื่องสัตว์เลี้ยง อาหาร/ยี่ห้อ ของเล่น/ของใช้ และการใช้งาน Pet Hydro-Feed Calculator เท่านั้น หากต้องการปรึกษาเรื่องสัตว์เลี้ยงหรือการคำนวณอาหารสัตว์เลี้ยง ผมช่วยได้ครับ'
    });
  }

  try {
    const geminiAnswer = await getGeminiAdvice(trimmedMessage);
    const answer = geminiAnswer || buildAdvisorReply(trimmedMessage);

    return res.json({
      success: true,
      answer,
      source: geminiAnswer ? 'gemini' : 'local'
    });
  } catch (error) {
    console.error('❌ AI advice route error:', error.message);
    return res.json({
      success: true,
      answer: buildAdvisorReply(trimmedMessage),
      source: 'local'
    });
  }
});

/**
 * POST /api/calculate
 * Calculate water & food requirements (preview only, no save)
 */
app.post('/api/calculate', (req, res) => {
  const { weight, activity, type = 'dog' } = req.body;

  // Validate weight
  if (weight === undefined || weight === null || typeof weight !== 'number' || weight <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Weight must be greater than 0'
    });
  }

  // Validate activity
  if (!activity || !['low', 'medium', 'high'].includes(activity)) {
    return res.status(400).json({
      success: false,
      error: 'Activity level must be "low", "medium", or "high"'
    });
  }

  const result = calculateRequirements(weight, activity, type);

  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/pets
 * Retrieve all pet records
 */
app.get('/api/pets', async (req, res) => {
  try {
    const pets = await getAllPets();
    res.json({
      success: true,
      data: pets
    });
  } catch (err) {
    console.error('❌ Error fetching pets:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch pets' });
  }
});

/**
 * POST /api/pets
 * Save a new pet with calculated requirements
 */
app.post('/api/pets', async (req, res) => {
  const errors = validatePetInput(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors
    });
  }

  try {
    const { name, type, weight, activity, breed } = req.body;
    const { water_ml, food_g } = calculateRequirements(weight, activity, type);
    const trimmedBreed = typeof breed === 'string' ? breed.trim() : '';

    const pet = {
      id: uuidv4(),
      name: name.trim(),
      type,
      weight,
      activity,
      breed: trimmedBreed,
      water_ml,
      food_g
    };

    await addPet(pet);
    console.log(`✅ Pet added: ${pet.name} (${pet.type}) — Water: ${water_ml}ml, Food: ${food_g}g`);

    res.status(201).json({
      success: true,
      data: pet
    });
  } catch (err) {
    console.error('❌ Error adding pet:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save pet' });
  }
});

/**
 * DELETE /api/pets/:id
 * Delete a pet record by ID
 */
app.delete('/api/pets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deletePet(id);

    if ((result.changes || 0) === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }

    console.log(`🗑️  Pet deleted: ${id}`);
    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (err) {
    console.error('❌ Error deleting pet:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete pet' });
  }
});

/**
 * GET /api/summary
 * Get summary statistics
 */
app.get('/api/summary', async (req, res) => {
  try {
    const summary = await getSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('❌ Error fetching summary:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

// =============================================
// Start Server
// =============================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🐾 ========================================`);
    console.log(`   Pet Hydro-Feed Calculator API Server`);
    console.log(`   Running on: http://localhost:${PORT}`);
    console.log(`   Database:   ${DB_PATH}`);
    console.log(`🐾 ========================================\n`);
  });
}

// Export for testing
// Export app สำหรับ Vercel และ Unit Testing
module.exports = {
  app,
  calculateRequirements,
  ACTIVITY_MULTIPLIER,
  PET_WEIGHT_LIMITS,
  VALID_PET_TYPES,
  validatePetInput
};