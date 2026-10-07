const { isAllowedAdvisorTopic, buildAdvisorReply } = require('../public/chatAdvisor');
const { app } = require('../server');

describe('Chat advisor scope control', () => {
  test('allows pet and calculator questions', () => {
    expect(isAllowedAdvisorTopic('สุนัขกินอาหารอะไรดี')).toBe(true);
    expect(isAllowedAdvisorTopic('Pet Hydro-Feed Calculator คำนวณน้ำยังไง')).toBe(true);
    expect(isAllowedAdvisorTopic('แมวมีของเล่นอะไรที่ดี')).toBe(true);
  });

  test('blocks unrelated questions', () => {
    expect(isAllowedAdvisorTopic('ช่วยเขียน React component')).toBe(false);
    expect(isAllowedAdvisorTopic('ข่าวการเมืองล่าสุด')).toBe(false);
  });

  test('returns a helpful pet-care answer within the allowed domain', () => {
    const answer = buildAdvisorReply('สุนัขควรกินอาหารอะไรดี');
    expect(answer).toMatch(/สุนัข|อาหาร/gi);
    expect(answer).not.toMatch(/React|python|javascript|การเมือง/gi);
  });

  test('exposes a safe advisor endpoint with local fallback', async () => {
    const server = app.listen(0);
    const port = await new Promise((resolve) => {
      server.once('listening', () => resolve(server.address().port));
    });

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/ai/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'สุนัขกินอาหารอะไรดี' })
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.answer).toMatch(/สุนัข|อาหาร/gi);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
