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
      const result = calculateRequirements(10, 'medium');
      expect(result.water_ml).toBe(600);
      expect(result.food_g).toBe(216);
    });

    test('Cat, 5kg, low activity → water: 300 ml, food: 90 g', () => {
      const result = calculateRequirements(5, 'low');
      expect(result.water_ml).toBe(300);
      expect(result.food_g).toBe(90);
    });

    test('Dog, 25kg, high activity → water: 1500 ml, food: 630 g', () => {
      const result = calculateRequirements(25, 'high');
      expect(result.water_ml).toBe(1500);
      expect(result.food_g).toBe(630);
    });

    test('Cat, 3.5kg, medium activity → water: 210 ml, food: 75.6 g', () => {
      const result = calculateRequirements(3.5, 'medium');
      expect(result.water_ml).toBe(210);
      expect(result.food_g).toBe(75.6);
    });

    test('Dog, 1kg, low activity → water: 60 ml, food: 18 g', () => {
      const result = calculateRequirements(1, 'low');
      expect(result.water_ml).toBe(60);
      expect(result.food_g).toBe(18);
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
  describe('Water Formula: weight × 60 ml', () => {

    test('Water should equal weight × 60', () => {
      const weights = [1, 5, 10, 15.5, 30];
      weights.forEach(w => {
        const result = calculateRequirements(w, 'low');
        expect(result.water_ml).toBe(Math.round(w * 60 * 100) / 100);
      });
    });
  });

  // ----- Test Group 4: Food Formula -----
  describe('Food Formula: weight × 18 × activityMultiplier', () => {

    test('Food with low activity = weight × 18 × 1.0', () => {
      const result = calculateRequirements(10, 'low');
      expect(result.food_g).toBe(10 * 18 * 1.0);
    });

    test('Food with medium activity = weight × 18 × 1.2', () => {
      const result = calculateRequirements(10, 'medium');
      expect(result.food_g).toBe(10 * 18 * 1.2);
    });

    test('Food with high activity = weight × 18 × 1.4', () => {
      const result = calculateRequirements(10, 'high');
      expect(result.food_g).toBe(252);
    });
  });

  // ----- Test Group 5: Edge Cases -----
  describe('Edge Cases', () => {

    test('Very small weight (0.1 kg) should still calculate correctly', () => {
      const result = calculateRequirements(0.1, 'low');
      expect(result.water_ml).toBe(6);
      expect(result.food_g).toBe(1.8);
    });

    test('Very large weight (100 kg) should calculate correctly', () => {
      const result = calculateRequirements(100, 'high');
      expect(result.water_ml).toBe(6000);
      expect(result.food_g).toBe(2520);
    });

    test('Unknown activity should default to multiplier 1.0', () => {
      const result = calculateRequirements(10, 'unknown');
      expect(result.water_ml).toBe(600);
      expect(result.food_g).toBe(180);
    });
  });

  // ----- Test Group 6: Pet Type Support -----
  describe('Pet Type Support', () => {

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
  });

});
