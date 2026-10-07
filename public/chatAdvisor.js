(function () {
  const PET_TYPE_MAP = {
    dog: ['dog', 'สุนัข', 'หมา', 'hound', 'golden', 'โกเดน'],
    cat: ['cat', 'แมว', 'feline'],
    bird: ['bird', 'นก', 'parrot', 'แก้ว', 'ไก่'],
    rabbit: ['rabbit', 'กระต่าย', 'bunny'],
    hamster: ['hamster', 'หนูแฮมสเตอร์', 'hamster'],
    fish: ['fish', 'ปลา', 'goldfish'],
    mouse: ['mouse', 'หนู', 'mice']
  };

  function detectPetType(text) {
    const normalized = String(text || '').toLowerCase();
    for (const [type, keywords] of Object.entries(PET_TYPE_MAP)) {
      if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
        return type;
      }
    }
    return null;
  }

  function detectBreed(text) {
    const normalized = String(text || '').toLowerCase();
    const breedMap = [
      { name: 'Golden Retriever', petType: 'dog', keywords: ['golden retriever', 'golden', 'โกเดน'] },
      { name: 'Labrador Retriever', petType: 'dog', keywords: ['labrador', 'lab', 'แลบราดอร์'] },
      { name: 'Shih Tzu', petType: 'dog', keywords: ['shih tzu', 'shih', 'ชิสุ'] },
      { name: 'Siamese', petType: 'cat', keywords: ['siamese', 'ไทย', 'สยาม'] },
      { name: 'Persian', petType: 'cat', keywords: ['persian', 'เปอร์เซีย'] },
      { name: 'Budgie', petType: 'bird', keywords: ['budgie', 'นกแก้ว', 'parakeet'] },
      { name: 'Mini Lop', petType: 'rabbit', keywords: ['mini lop', 'mini-lop', 'ล็อป'] }
    ];

    return breedMap.find((breed) => breed.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) || null;
  }

  function isAllowedAdvisorTopic(text) {
    const normalized = String(text || '').toLowerCase();
    if (!normalized.trim()) return false;

    const allowedPatterns = [
      'สัตว์', 'สัตว์เลี้ยง', 'pet', 'animal', 'dog', 'cat', 'แมว', 'สุนัข', 'นก', 'กระต่าย', 'hamster', 'ปลา', 'หนู',
      'อาหาร', 'กิน', 'feed', 'food', 'ยี่ห้อ', 'brand', 'ofplay', 'ของเล่น', 'ของใช้', 'อาการ', 'ป่วย', 'สุขภาพ',
      'pet hydro', 'hydro-feed', 'calculator', 'คำนวณ', 'น้ำ', 'กรัม', 'ml', 'nutrition', 'โภชนาการ', 'แนะนำ'
    ];

    const blockedPatterns = [
      'python', 'javascript', 'html', 'css', 'react', 'nodejs', 'node.js', 'php', 'java', 'c#', 'c++', 'programming',
      'การเมือง', 'ฟุตบอล', 'หนัง', 'เศรษฐกิจ', 'หุ้น', 'เรื่องส่วนตัว', 'ความรัก', 'ข่าว', 'ดารา', 'บันเทิง'
    ];

    const matchesAllowed = allowedPatterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
    const matchesBlocked = blockedPatterns.some((pattern) => normalized.includes(pattern.toLowerCase()));

    return matchesAllowed && !matchesBlocked;
  }

  function buildAdvisorReply(message) {
    const input = String(message || '').trim();
    if (!input) {
      return 'กรุณาพิมพ์คำถามเรื่องสัตว์เลี้ยงหรือ Pet Hydro-Feed Calculator เพื่อให้ผมช่วยได้';
    }

    if (!isAllowedAdvisorTopic(input)) {
      return 'ฉันรับเฉพาะคำปรึกษาเรื่องสัตว์เลี้ยง อาหาร/ยี่ห้อ ของเล่น/ของใช้ และการใช้งาน Pet Hydro-Feed Calculator เท่านั้น หากต้องการปรึกษาเรื่องสัตว์เลี้ยงหรือการคำนวณอาหารสัตว์เลี้ยง ผมช่วยได้ครับ';
    }

    const petType = detectPetType(input);
    const breed = detectBreed(input);

    if (breed && breed.petType === 'dog' && /golden|โกเดน/i.test(input)) {
      return 'สำหรับ Golden Retriever ผมแนะนำให้เลือกอาหารสุนัขสูตรผิวหนัง-ขนดีแบบ Royal Canin Adult Dermacomfort, Hill\'s Science Diet Sensitive Skin & Stomach, หรือ Purina Pro Plan Sensitive Skin & Salmon เพราะสายพันธุ์นี้มักมีผิวหนังและขนต้องการดูแลเป็นพิเศษ อาหารที่มีโอเมก้า-3, salmon, และโปรตีนคุณภาพสูงจะช่วยให้ขนดูนุ่มและเงางามมากขึ้น นอกจากนี้ควร Brush ขนอย่างน้อย 3–5 ครั้งต่อสัปดาห์ และหลีกเลี่ยงอาหารที่มีวัตถุกักเก็บหรือข้าวโพด/ข้าวสาลีเยอะเกินไป';
    }

    if (/(อาหาร|กิน|feed|food|ยี่ห้อ|brand|โภชนาการ|สูตร)/i.test(input)) {
      const suggestions = {
        dog: 'สุนัขควรเลือกอาหารสุนัขสูตรครบถ้วนตามวัยและน้ำหนัก เช่น Royal Canin, Hill\'s Science Diet, Pro Plan สำหรับสายพันธุ์ที่มีปัญหาขนหรือผิวหนัง ให้เลือกสูตร Sensitive Skin, Dermacomfort หรือ Salmon-based มากกว่า และหากมีอาการท้องเสียหรือผิวหนังระคายเคือง ควรปรึกษาสัตวแพทย์ก่อนเปลี่ยนสูตรบ่อย',
        cat: 'แมวควรเลือกอาหารแมวตามอายุและกิจกรรม เช่น Royal Canin, Hill\'s Science Diet, Wellness หรือ Purina Pro Plan ถ้าแมวมีปัญหาท้องผูก/ผิวหนัง ให้เลือกสูตรเฉพาะเรื่องนั้น พร้อมเพิ่มน้ำให้เพียงพอและดูการขับถ่ายเป็นประจำ',
        bird: 'นกควรได้อาหารเม็ดหรือเมล็ดที่เหมาะกับชนิดนกและวัย เช่น อาหารเม็ดสำหรับนกแก้วพร้อมวิตามินและแร่ธาตุครบถ้วน สำหรับขนหรือขนไหม้ ให้เสริมผลไม้และพืชผักที่ปลอดสารเคมี',
        rabbit: 'กระต่ายควรได้หญ้าแห้งและอาหารกระต่ายสูตรธรรมชาติเป็นหลัก พร้อมใยอาหารสูง การคงสภาพน้ำและอาหารให้สะอาดช่วยให้กระต่ายสุขภาพดีและลดปัญหาท้องผูก',
        hamster: 'หนูแฮมสเตอร์ควรได้อาหารเม็ดคุณภาพ พร้อมผักเล็กน้อยและธัญพืชพอดี ให้หลีกเลี่ยงอาหารที่มีเกลือและน้ำตาลสูง และตรวจกรงให้สะอาดอยู่เสมอ',
        fish: 'ปลาควรได้อาหารที่ตรงสายพันธุ์ เช่น เม็ด/เพลลเล็ตตามชนิดปลาน้ำจืดหรือปลาน้ำเค็ม เพื่อให้ปลาทั้งสุขภาพและสีลำตัวดีขึ้น ควรดูคุณภาพน้ำและอุณหภูมิด้วย',
        mouse: 'หนูควรได้รับอาหารเม็ดสำหรับหนูร่วมกับหญ้าแห้งและผักเล็กน้อยเพราะช่วยย่อยและลดความเครียด ให้เลือกสูตรที่มีโปรตีนและใยอาหารพอเหมาะ'
      };

      const defaultText = 'สำหรับสัตว์เลี้ยงทั่วไป ให้เลือกอาหารตามวัย น้ำหนัก ความเคลื่อนไหว และความต้องการเฉพาะตัว เช่น ถ้าต้องการผิวหนังหรือขนสวย ให้เลือกสูตรที่มีโอเมก้า-3 และโปรตีนคุณภาพสูง';
      return suggestions[petType] || defaultText;
    }

    if (/(ของเล่น|ของใช้|อุปกรณ์|แนะนำ)/i.test(input)) {
      const toySuggestions = {
        dog: 'สำหรับสุนัข ผมแนะนำของเล่นที่กระตุ้นสมองและออกกำลังกายพร้อมกัน เช่น ลูกบอล, ห่วงยาง, เกมค้นหาอาหาร, และของเล่นที่ยืดหยุ่นสำหรับเล่นตอนเย็น เพราะช่วยลดความเครียดและทำให้ขน/ร่างกายดูดีขึ้น',
        cat: 'สำหรับแมว ให้ใช้ของเล่นที่กระตุ้นความอยากล่า เช่น ไม้กระดก, ลูกบอลพอง, ปลายเชือก, และที่เลีย/ที่ซ่อนตัวเพื่อให้แมวมีพื้นที่ระบายพลังงาน',
        bird: 'สำหรับนก ให้ใช้กิ่งไม้, ที่ยืน, ของเล่นเคี้ยว, และจานน้ำ/อาหารสะอาด เพื่อให้เจริญเติบโตและลดความเครียด',
        rabbit: 'สำหรับกระต่าย ให้ใช้หลุมซ่อน, ลู่วิ่งเล็ก, และของเล่นที่ช่วยเพิ่มการเคลื่อนไหว เช่น ท่อหรือห่วงบ้างเล็กน้อย',
        hamster: 'สำหรับแฮมสเตอร์ ให้ใช้ลู่วิ่ง, ท่อเล็ก, ที่ซ่อนตัว, และวัสดุที่ปลอดภัยให้เคลื่อนไหวและพักผ่อน',
        fish: 'สำหรับปลา ให้ใช้ทรงหิน, ร่มไม้, เครื่องกรองน้ำ, และพื้นที่วางซ่อนเพื่อให้ปลารู้สึกปลอดภัย',
        mouse: 'สำหรับหนู ให้ใช้ลู่วิ่ง, ที่หลบซ่อน, และที่นอนที่สะอาดเพื่อช่วยให้หนูคลายเครียดและเล่นได้บ่อยขึ้น'
      };

      return toySuggestions[petType] || 'ควรเลือกของเล่นหรืออุปกรณ์ให้เหมาะกับขนาดและพฤติกรรมของสัตว์ เช่น ของเล่นเสริมสมอง, ของที่ทำความสะอาดง่าย, และอุปกรณ์ช่วยลดความเครียด';
    }

    if (/(อาการ|ป่วย|ปัญหา|ไอ|ท้องเสีย|ท้องผูก|คัน|ตา|หู|เจ็บ|ปวด|ล้ม|อ่อนเพลีย|เหงื่อ|กินไม่ไหว)/i.test(input)) {
      const careAdvice = {
        dog: 'ถ้าสุนัขมีอาการผิดปกติ เช่น ไอ ท้องเสีย หรืออ่อนเพลีย ให้สังเกตอาการและให้กินน้ำสะอาด ปรับอาหารให้ย่อยง่าย และควรปรึกษาสัตวแพทย์ทันทีหากมีไข้, อาเจียน, หรืออาการรุนแรง',
        cat: 'ถ้าแมวมีอาการคัน, กระหายน้ำมากผิดปกติ, ไอ, หรือท้องเสีย ให้สังเกตการกินและการขับถ่าย และหากมีอาการรุนแรง เช่น ซึม, หายใจเร็ว, หรือท้องอืด ควรพบสัตวแพทย์ทันที',
        bird: 'ถ้านกมีอาการอ่อนแรง, ขนยุ่ง, หรือหายใจไม่ปกติ ให้ดูความสะอาดของกรงและอุณหภูมิแวดล้อม หากมีไอหรือขนร่วงมาก ควรพบสัตวแพทย์เร็ว',
        rabbit: 'ถ้ากระต่ายมีอาการท้องเสีย, อาเจียน, หรือเคลื่อนไหวลดลง ให้แยกจากตัวอื่น, ตรวจอุณหภูมิ, และปรึกษาสัตวแพทย์ เพราะความเครียดและอาหารผิดชนิดอาจเป็นสาเหตุ',
        hamster: 'ถ้าแฮมสเตอร์มีอาการคัน, ขนร่วง, หรือเหยียดตัวผิดปกติ ให้เช็คความสะอาดของกรงและอาหาร หากอาการไม่ดีขึ้น ควรปรึกษาสัตวแพทย์',
        fish: 'ถ้าปลามีอาการหายใจเร็ว, ลำตัวบวม, หรือผิวหนังเปลี่ยนสี ให้ตรวจคุณภาพน้ำและอุณหภูมิด้วย หากยังไม่ดีขึ้น ควรปรึกษาสัตวแพทย์',
        mouse: 'ถ้าหนูมีอาการอ่อนแรง, ท้องเสีย, หรือขนหลุด ให้ดูความสะอาดของกรงและความชื้น และหากอาการรุนแรงกว่าปกติ ควรพบสัตวแพทย์' 
      };

      return careAdvice[petType] || 'หากสัตว์เลี้ยงมีอาการผิดปกติ ให้ดูสภาพร่างกายและพฤติกรรมก่อน ให้ดื่มน้ำสะอาดและลดความเครียด หากมีไข้/ซึม/หายใจเร็วหรืออาการรุนแรง ควรพบสัตวแพทย์ทันที';
    }

    if (/(pet hydro|hydro-feed|calculator|คำนวณ|น้ำ|อาหาร|ml|g|formula|สูตร)/i.test(input)) {
      return 'Pet Hydro-Feed Calculator จะคำนวณตามน้ำหนักสัตว์และระดับกิจกรรม เช่น น้ำ = น้ำหนัก × 60 และ อาหาร = น้ำหนัก × 18 × ตัวคูณกิจกรรม (Low 1.0 / Medium 1.2 / High 1.4) ถ้าต้องการให้สุนัขของคุณได้อาหารถูกปริมาณ ผมแนะนำให้กรอกน้ำหนักและระดับกิจกรรมให้ตรงจริงก่อนตัดสินใจ';
    }

    const petLabel = petType ? {
      dog: 'สุนัข',
      cat: 'แมว',
      bird: 'นก',
      rabbit: 'กระต่าย',
      hamster: 'แฮมสเตอร์',
      fish: 'ปลา',
      mouse: 'หนู'
    }[petType] : 'สัตว์เลี้ยง';

    return `ผมช่วยเรื่อง${petLabel}ได้ครับ โดยเริ่มจากดูอายุ น้ำหนัก พฤติกรรม และความต้องการเฉพาะตัวก่อนแล้วค่อยปรับอาหาร หรือของเล่นให้เหมาะสม ถ้าคุณมีคำถามที่ตรงจุด เช่น “Golden Retriever ต้องกินอาหารยี่ห้ออะไรให้ขนสวย” ผมจะตอบแบบเจาะจงมากขึ้นได้ทันที`;
  }

  const api = {
    detectPetType,
    isAllowedAdvisorTopic,
    buildAdvisorReply
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof window !== 'undefined') {
    window.chatAdvisor = api;
  }
})();
