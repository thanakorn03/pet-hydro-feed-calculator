// =============================================
// app.js — Frontend Application Logic
// Pet Hydro-Feed Calculator
// =============================================

(() => {
  'use strict';

  // ===== Configuration =====
  const API_BASE = window.location.hostname === 'localhost'
    ? ''
    : (window.__API_BASE || '');

  // ===== Activity Multipliers (mirrors server) =====
  const ACTIVITY_MULTIPLIER = { low: 1.0, medium: 1.2, high: 1.4 };

  const ACTIVITY_LABELS = {
    low: 'น้อย',
    medium: 'ปานกลาง',
    high: 'สูง'
  };

  const TYPE_LABELS = {
    dog: '🐕 สุนัข',
    cat: '🐈 แมว',
    bird: '🐦 นก',
    rabbit: '🐇 กระต่าย',
    hamster: '🐹 หนูแฮมสเตอร์',
    fish: '🐟 ปลา',
    mouse: '🐭 หนู'
  };

  // ===== DOM Elements =====
  const form = document.getElementById('pet-form');
  const nameInput = document.getElementById('pet-name');
  const typeInput = document.getElementById('pet-type');
  const breedInput = document.getElementById('pet-breed');
  const weightInput = document.getElementById('pet-weight');
  const activityInput = document.getElementById('pet-activity');
  const btnSubmit = document.getElementById('btn-submit');

  const errorName = document.getElementById('error-name');
  const errorType = document.getElementById('error-type');
  const errorWeight = document.getElementById('error-weight');
  const errorActivity = document.getElementById('error-activity');

  const previewBox = document.getElementById('preview-box');
  const previewWater = document.getElementById('preview-water');
  const previewFood = document.getElementById('preview-food');

  const summaryTotalPets = document.getElementById('summary-total-pets');
  const summaryTotalWater = document.getElementById('summary-total-water');
  const summaryTotalFood = document.getElementById('summary-total-food');

  const emptyState = document.getElementById('empty-state');
  const tableContainer = document.getElementById('table-container');
  const tableBody = document.getElementById('pets-table-body');
  const toastContainer = document.getElementById('toast-container');

  const aiChatForm = document.getElementById('ai-chat-form');
  const aiChatInput = document.getElementById('ai-chat-input');
  const aiChatMessages = document.getElementById('ai-chat-messages');
  const aiChatFab = document.getElementById('ai-chat-fab');
  const aiChatPanel = document.getElementById('ai-chat-panel');
  const aiChatClose = document.getElementById('ai-chat-close');

  // =============================================
  // SweetAlert2 Notifications
  // =============================================
  function showToast(message, type = 'success') {
    const iconMap = {
      success: 'success',
      error: 'error',
      info: 'info'
    };

    Swal.fire({
      icon: iconMap[type] || 'success',
      title: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      background: '#1f1630',
      color: '#f5f3ff',
      customClass: {
        popup: 'swal2-dark-popup',
        title: 'swal2-dark-title'
      }
    });
  }

  // =============================================
  // Form Validation
  // =============================================
  function showError(element, errorEl) {
    element.classList.add('input-error');
    errorEl.classList.remove('hidden');
  }

  function clearError(element, errorEl) {
    element.classList.remove('input-error');
    errorEl.classList.add('hidden');
  }

  function clearAllErrors() {
    clearError(nameInput, errorName);
    clearError(typeInput, errorType);
    clearError(weightInput, errorWeight);
    clearError(activityInput, errorActivity);
  }

  /**
   * Validate form inputs
   * @returns {boolean} - true if all inputs are valid
   */
  function validateForm() {
    let isValid = true;
    clearAllErrors();

    // Name validation
    if (!nameInput.value.trim()) {
      showError(nameInput, errorName);
      isValid = false;
    }

    // Type validation
    if (!typeInput.value) {
      showError(typeInput, errorType);
      isValid = false;
    }

    // Weight validation
    const weight = parseFloat(weightInput.value);
    if (!weightInput.value || isNaN(weight) || weight <= 0) {
      showError(weightInput, errorWeight);
      isValid = false;
    }

    // Activity validation
    if (!activityInput.value) {
      showError(activityInput, errorActivity);
      isValid = false;
    }

    return isValid;
  }

  // =============================================
  // Real-time Calculation Preview
  // =============================================
  function updatePreview() {
    const weight = parseFloat(weightInput.value);
    const activity = activityInput.value;

    if (weight > 0 && activity && ACTIVITY_MULTIPLIER[activity] !== undefined) {
      const waterMl = weight * 60;
      const foodG = weight * 18 * ACTIVITY_MULTIPLIER[activity];

      previewWater.textContent = `${formatNumber(waterMl)} ml`;
      previewFood.textContent = `${formatNumber(foodG)} g`;
      previewBox.classList.remove('hidden');
    } else {
      previewBox.classList.add('hidden');
    }
  }

  // =============================================
  // Number Formatting
  // =============================================
  function formatNumber(num) {
    if (num === 0) return '0';
    return num % 1 === 0
      ? num.toLocaleString('en-US')
      : num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  }

  // =============================================
  // API Calls
  // =============================================

  /**
   * Fetch all pets from API
   */
  async function fetchPets() {
    try {
      const res = await fetch(`${API_BASE}/api/pets`);
      const data = await res.json();
      if (data.success) {
        renderTable(data.data);
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
  }

  /**
   * Fetch dashboard summary from API
   */
  async function fetchSummary() {
    try {
      const res = await fetch(`${API_BASE}/api/summary`);
      const data = await res.json();
      if (data.success) {
        animateCounter(summaryTotalPets, data.data.totalPets);
        animateCounter(summaryTotalWater, data.data.totalWater);
        animateCounter(summaryTotalFood, data.data.totalFood);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }

  /**
   * Save a new pet via API
   * @param {Object} petData - { name, type, weight, activity }
   */
  async function savePet(petData) {
    try {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        กำลังบันทึก...
      `;

      const res = await fetch(`${API_BASE}/api/pets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
      });

      const data = await res.json();

      if (data.success) {
        showToast(`บันทึก "${petData.name}" สำเร็จ!`, 'success');
        resetForm();
        await refreshData();
      } else {
        const errorMsg = data.errors ? data.errors.join(', ') : data.error;
        showToast(errorMsg || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (err) {
      console.error('Error saving pet:', err);
      showToast('ไม่สามารถบันทึกข้อมูลได้', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        บันทึกข้อมูล
      `;
    }
  }

  /**
   * Delete a pet via API
   * @param {string} id - Pet UUID
   * @param {string} name - Pet name (for toast message)
   */
  async function deletePetById(id, name) {
    try {
      const res = await fetch(`${API_BASE}/api/pets/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        showToast(`ลบ "${name}" แล้ว`, 'info');
        await refreshData();
      } else {
        showToast(data.error || 'ไม่สามารถลบได้', 'error');
      }
    } catch (err) {
      console.error('Error deleting pet:', err);
      showToast('ไม่สามารถลบข้อมูลได้', 'error');
    }
  }

  // =============================================
  // Render Functions
  // =============================================

  /**
   * Render the history table
   * @param {Array} pets - List of pet records
   */
  function renderTable(pets) {
    tableBody.innerHTML = '';

    if (!pets || pets.length === 0) {
      emptyState.classList.remove('hidden');
      tableContainer.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    pets.forEach((pet, index) => {
      const row = document.createElement('tr');
      row.className = 'row-animate-in';
      row.style.animationDelay = `${index * 0.05}s`;

      row.innerHTML = `
        <td class="table-cell font-medium text-white">${escapeHtml(pet.name)}</td>
        <td class="table-cell">
          <div class="flex flex-col gap-1">
            <span class="badge badge-${pet.type}">
              ${TYPE_LABELS[pet.type] || pet.type}
            </span>
            ${pet.breed ? `<span class="text-[11px] text-violet-200/80">${escapeHtml(pet.breed)}</span>` : ''}
          </div>
        </td>
        <td class="table-cell text-right text-violet-200">${formatNumber(pet.weight)} kg</td>
        <td class="table-cell">
          <span class="badge badge-${pet.activity}">
            ${ACTIVITY_LABELS[pet.activity] || pet.activity}
          </span>
        </td>
        <td class="table-cell text-right text-sky-300">${formatNumber(pet.water_ml)} ml</td>
        <td class="table-cell text-right text-amber-300">${formatNumber(pet.food_g)} g</td>
        <td class="table-cell text-center">
          <button
            class="btn-delete"
            data-id="${pet.id}"
            data-name="${escapeHtml(pet.name)}"
            title="ลบ ${escapeHtml(pet.name)}"
            aria-label="ลบ ${escapeHtml(pet.name)}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  /**
   * Animate counter number
   * @param {HTMLElement} el - Target element
   * @param {number} target - Target number
   */
  function animateCounter(el, target) {
    const current = parseFloat(el.textContent.replace(/,/g, '')) || 0;
    const diff = target - current;
    const steps = 20;
    const stepDuration = 30;
    let step = 0;

    function update() {
      step++;
      const progress = step / steps;
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = current + diff * eased;
      el.textContent = formatNumber(Math.round(value * 100) / 100);

      if (step < steps) {
        requestAnimationFrame(update);
      } else {
        el.textContent = formatNumber(target);
      }
    }

    if (diff !== 0) {
      requestAnimationFrame(update);
    } else {
      el.textContent = formatNumber(target);
    }
  }

  // =============================================
  // Utility Functions
  // =============================================

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - Input string
   * @returns {string} - Escaped string
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Reset the form to initial state
   */
  function resetForm() {
    form.reset();
    clearAllErrors();
    previewBox.classList.add('hidden');
  }

  function addChatMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `facebook-chat-bubble ${role === 'user' ? 'user' : 'bot'}`;
    bubble.textContent = text;
    aiChatMessages.appendChild(bubble);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  async function handleAiChatSubmit(event) {
    event.preventDefault();
    const question = aiChatInput.value.trim();
    if (!question) {
      showToast('กรุณาพิมพ์คำถามก่อนส่ง', 'error');
      return;
    }

    addChatMessage('user', question);
    aiChatInput.value = '';

    try {
      const response = await fetch(`${API_BASE}/api/ai/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question })
      });

      const data = await response.json();
      const reply = data?.answer || window.chatAdvisor.buildAdvisorReply(question);
      addChatMessage('bot', reply);
    } catch (error) {
      console.error('AI advisor request failed:', error);
      const reply = window.chatAdvisor.buildAdvisorReply(question);
      addChatMessage('bot', reply);
    }
  }

  /**
   * Refresh both table and summary data
   */
  async function refreshData() {
    await Promise.all([fetchPets(), fetchSummary()]);
  }

  // =============================================
  // Event Listeners
  // =============================================

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    const petData = {
      name: nameInput.value.trim(),
      type: typeInput.value,
      breed: breedInput.value.trim(),
      weight: parseFloat(weightInput.value),
      activity: activityInput.value
    };

    await savePet(petData);
  });

  // Real-time preview on weight/activity change
  weightInput.addEventListener('input', updatePreview);
  activityInput.addEventListener('change', updatePreview);

  // Clear errors on input
  nameInput.addEventListener('input', () => clearError(nameInput, errorName));
  typeInput.addEventListener('change', () => clearError(typeInput, errorType));
  weightInput.addEventListener('input', () => {
    clearError(weightInput, errorWeight);
    updatePreview();
  });
  activityInput.addEventListener('change', () => {
    clearError(activityInput, errorActivity);
    updatePreview();
  });

  // Delegated event listener for delete buttons
  tableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;

    const { id, name } = btn.dataset;

    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `ต้องการลบ "${name}" ออกจากรายการใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#374151',
      background: '#1f1630',
      color: '#f5f3ff'
    });

    if (result.isConfirmed) {
      await deletePetById(id, name);
    }
  });

  aiChatFab.addEventListener('click', () => {
    aiChatPanel.classList.toggle('hidden');
    aiChatFab.classList.toggle('active');
    if (!aiChatPanel.classList.contains('hidden')) {
      setTimeout(() => aiChatInput.focus(), 100);
    }
  });

  aiChatClose.addEventListener('click', () => {
    aiChatPanel.classList.add('hidden');
    aiChatFab.classList.remove('active');
  });

  aiChatForm.addEventListener('submit', handleAiChatSubmit);

  document.querySelectorAll('.facebook-ai-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      aiChatInput.value = chip.dataset.question || '';
      aiChatInput.focus();
      handleAiChatSubmit(new Event('submit'));
    });
  });

  // =============================================
  // Initialize App
  // =============================================
  async function init() {
    console.log('🐾 Pet Hydro-Feed Calculator initialized');
    await refreshData();
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
