// =============================================
// calc.test.js — Unit Test: UT-CALC-01
// Business Logic & Calculation Formula (Back-end)
// Tester: สมาชิกคนที่ 1 (Developer)
// =============================================

const { calculateRequirements, ACTIVITY_MULTIPLIER } = require('../server');

describe('UT-CALC-01: Unit Testing - Business Logic & Calculation Formula', () => {

  // ----- Test Group 1: Valid Calculations -----
  describe('Valid Calculations', () => {

    test('Dog, 10kg, medium activity → water: 600 ml, food: 216 g', () => {
      const result = calculateRequirements(10, 'medium', 'dog');
      expect(result.water_ml).toBe(600);
      expect(result.food_g).toBe(216);
    });

    test('Cat, 5kg, low activity → water: 250 ml, food: 75 g', () => {
      const result = calculateRequirements(5, 'low', 'cat');
      expect(result.water_ml).toBe(250);
      expect(result.food_g).toBe(75);
    });

    test('Dog, 25kg, high activity → water: 1500 ml, food: 630 g', () => {
      const result = calculateRequirements(25, 'high', 'dog');
      expect(result.water_ml).toBe(1500);
      expect(result.food_g).toBe(630);
    });

    test('Cat, 3.5kg, medium activity → water: 175 ml, food: 63 g', () => {
      const result = calculateRequirements(3.5, 'medium', 'cat');
      expect(result.water_ml).toBe(175);
      expect(result.food_g).toBe(63);
    });

    test('Dog, 1kg, low activity → water: 60 ml, food: 18 g', () => {
      const result = calculateRequirements(1, 'low', 'dog');
      expect(result.water_ml).toBe(60);
      expect(result.food_g).toBe(18);
    });

    test('Fish, 0.5kg → water: 0 ml (swimming in water), food: 10 g', () => {
      const result = calculateRequirements(0.5, 'low', 'fish');
      expect(result.water_ml).toBe(0);
      expect(result.food_g).toBe(10);
    });

    test('Bird, 0.2kg, medium activity → water: 10 ml, food: 24 g', () => {
      const result = calculateRequirements(0.2, 'medium', 'bird');
      expect(result.water_ml).toBe(10);
      expect(result.food_g).toBe(24);
    });

    test('Hamster, 0.1kg, low activity → water: 10 ml, food: 11 g', () => {
      const result = calculateRequirements(0.1, 'low', 'hamster');
      expect(result.water_ml).toBe(10);
      expect(result.food_g).toBe(11);
    });

    test('Mouse, 0.05kg, low activity → water: 6 ml, food: 6.5 g', () => {
      const result = calculateRequirements(0.05, 'low', 'mouse');
      expect(result.water_ml).toBe(6);
      expect(result.food_g).toBe(6.5);
    });
  });

  // ----- Test Group 2: Activity Multipliers -----
  describe('Activity Multipliers', () => {

    test('Low activity multiplier should be 1.0', () => {
      expect(ACTIVITY_MULTIPLIER.low).toBe(1.0);
    });

    test('Medium activity multiplier should be 1.2', () => {
      expect(ACTIVITY_MULTIPLIER.medium).toBe(1.2);
    });

    test('High activity multiplier should be 1.4', () => {
      expect(ACTIVITY_MULTIPLIER.high).toBe(1.4);
    });
  });

  // ----- Test Group 3: Water Formula -----
  describe('Water Formula per species', () => {

    test('Dog water should equal weight × 60', () => {
      const weights = [1, 5, 10, 15.5, 30];
      weights.forEach(w => {
        const result = calculateRequirements(w, 'low', 'dog');
        expect(result.water_ml).toBe(Math.round(w * 60 * 100) / 100);
      });
    });

    test('Fish water requirement is always 0', () => {
      const result = calculateRequirements(2, 'high', 'fish');
      expect(result.water_ml).toBe(0);
    });
  });

  // ----- Test Group 4: Food Formula -----
  describe('Food Formula: weight × baseRate × activityMultiplier', () => {

    test('Food with low activity = weight × 18 × 1.0 (Dog)', () => {
      const result = calculateRequirements(10, 'low', 'dog');
      expect(result.food_g).toBe(10 * 18 * 1.0);
    });

    test('Food with medium activity = weight × 18 × 1.2 (Dog)', () => {
      const result = calculateRequirements(10, 'medium', 'dog');
      expect(result.food_g).toBe(10 * 18 * 1.2);
    });

    test('Food with high activity = weight × 18 × 1.4 (Dog)', () => {
      const result = calculateRequirements(10, 'high', 'dog');
      expect(result.food_g).toBe(252);
    });
  });

  // ----- Test Group 5: Edge Cases & Defaults -----
  describe('Edge Cases', () => {

    test('Very small weight (0.1 kg) should still calculate correctly', () => {
      const result = calculateRequirements(0.1, 'low', 'dog');
      expect(result.water_ml).toBe(6);
      expect(result.food_g).toBe(1.8);
    });

    test('Very large weight (100 kg dog) should calculate correctly', () => {
      const result = calculateRequirements(100, 'high', 'dog');
      expect(result.water_ml).toBe(6000);
      expect(result.food_g).toBe(2520);
    });

    test('Unknown activity should default to multiplier 1.0', () => {
      const result = calculateRequirements(10, 'unknown', 'dog');
      expect(result.water_ml).toBe(600);
      expect(result.food_g).toBe(180);
    });
  });

  // ----- Test Group 6: Pet Type & Realistic Weight Validation -----
  describe('Pet Type Support and Weight Limits', () => {

    test('Supported pet types should include more species beyond dog and cat', () => {
      const { VALID_PET_TYPES } = require('../server');
      expect(VALID_PET_TYPES).toEqual(expect.arrayContaining(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'mouse']));
    });

    test('Breed field should be accepted as optional metadata', () => {
      const { validatePetInput } = require('../server');
      const errors = validatePetInput({
        name: 'น้องนก',
        type: 'bird',
        weight: 0.8,
        activity: 'medium',
        breed: 'นกแก้วไทย'
      });
      expect(errors).toEqual([]);
    });

    test('Rejects unrealistic weight for small animals like hamster or fish 10kg', () => {
      const { validatePetInput } = require('../server');
      const hamsterErrors = validatePetInput({
        name: 'แฮมมี่',
        type: 'hamster',
        weight: 10,
        activity: 'low'
      });
      expect(hamsterErrors.length).toBeGreaterThan(0);
      expect(hamsterErrors[0]).toMatch(/Weight for hamster must be between/i);

      const birdErrors = validatePetInput({
        name: 'จิ๊บ',
        type: 'bird',
        weight: 10,
        activity: 'medium'
      });
      expect(birdErrors.length).toBeGreaterThan(0);
      expect(birdErrors[0]).toMatch(/Weight for bird must be between/i);
    });
  });

});
