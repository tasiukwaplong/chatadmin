/**
 * 02 Innovation Lab - WhatsApp Accounting Chatbot Prototype Engine
 * Handles interactive simulation, step-by-step playback, typing delays,
 * and developer inspector synchronization.
 */

class ChatPrototypeEngine {
  constructor(config) {
    this.scenarioId = config.scenarioId;
    this.messages = config.messages || [];
    this.container = document.getElementById(config.containerId || 'chatBody');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.stepDisplay = document.getElementById('stepCounter');
    this.devSpecCallback = config.onStepChange || null;
    
    this.currentStep = 0;
    this.isPlaying = false;
    this.playTimer = null;
    
    this.initControls();
    this.initThemeToggle();
    this.initQuickInteractions();
  }

  initControls() {
    const playBtn = document.getElementById('btnPlay');
    const nextBtn = document.getElementById('btnNext');
    const resetBtn = document.getElementById('btnReset');
    const completeBtn = document.getElementById('btnComplete');

    if (playBtn) playBtn.addEventListener('click', () => this.toggleAutoPlay());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetChat());
    if (completeBtn) completeBtn.addEventListener('click', () => this.jumpToEnd());

    // Input bar sending simulation
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn && chatInput) {
      const handleCustomSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;
        this.appendMessage({
          sender: 'me',
          type: 'text',
          text: text,
          time: this.getCurrentTime()
        });
        chatInput.value = '';
        this.showTyping(true);
        setTimeout(() => {
          this.showTyping(false);
          this.appendMessage({
            sender: 'bot',
            type: 'text',
            text: `✅ <strong>Recorded:</strong> "${text}"<br>Manage your records anytime at <a href="https://chatadmin.02innovationslab.com/records/manage" target="_blank" class="wa-link">chatadmin.02innovationslab.com/records/manage</a>`,
            time: this.getCurrentTime()
          });
        }, 1200);
      };

      sendBtn.addEventListener('click', handleCustomSend);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCustomSend();
      });
    }
  }

  initThemeToggle() {
    const themeBtn = document.getElementById('btnThemeToggle');
    if (!themeBtn) return;
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      themeBtn.innerHTML = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
  }

  initQuickInteractions() {
    // Zoom modal handling
    const modal = document.getElementById('imageModal');
    const closeBtn = document.getElementById('modalClose');
    if (modal && closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    // Tab switcher in dev spec panel
    const tabBtns = document.querySelectorAll('.dev-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.dev-tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  }

  showTyping(show) {
    if (!this.typingIndicator) return;
    if (show) {
      this.typingIndicator.style.display = 'inline-flex';
      this.scrollToBottom();
    } else {
      this.typingIndicator.style.display = 'none';
    }
  }

  scrollToBottom() {
    if (this.container) {
      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  renderMessageHtml(msg) {
    const isOutgoing = msg.sender === 'me';
    const alignClass = isOutgoing ? 'outgoing' : 'incoming';
    const ticksHtml = isOutgoing ? `<span class="wa-ticks">✓✓</span>` : '';
    
    let contentHtml = '';

    if (msg.type === 'image') {
      contentHtml = `
        <div class="wa-receipt-card" onclick="openReceiptModal('${msg.imageSrc || 'assets/receipt.jpg'}')">
          <img src="${msg.imageSrc || 'assets/receipt.jpg'}" alt="Receipt" class="wa-receipt-img" />
          <div class="wa-receipt-overlay">
            <span>📷 Receipt Attached</span>
            <span class="ocr-tag">AI OCR Scan Ready</span>
          </div>
        </div>
        ${msg.caption ? `<p>${msg.caption}</p>` : ''}
      `;
    } else if (msg.type === 'doc') {
      contentHtml = `
        <div class="wa-doc-card" onclick="window.open('${msg.docUrl || '#'}', '_blank')">
          <div class="wa-doc-icon">PDF</div>
          <div class="wa-doc-details">
            <div class="wa-doc-name">${msg.fileName || 'summary.pdf'}</div>
            <div class="wa-doc-size">${msg.fileSize || '1.2 MB • 4 pages'}</div>
          </div>
          <div class="wa-doc-download">📥</div>
        </div>
        ${msg.text ? `<p>${msg.text}</p>` : ''}
      `;
    } else {
      contentHtml = `<p>${msg.text}</p>`;
    }

    if (msg.reportCard) {
      contentHtml += `
        <div class="wa-report-card">
          ${msg.reportCard.map(row => `
            <div class="wa-report-row ${row.isNet ? 'highlight-net' : ''}">
              <span>${row.label}:</span>
              <strong>${row.value}</strong>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (msg.alertCard) {
      contentHtml += `
        <div class="wa-alert-warning">
          <strong>⚠️ ${msg.alertCard.title}</strong><br>
          ${msg.alertCard.message}
        </div>
      `;
    }

    if (msg.actions && msg.actions.length > 0) {
      contentHtml += `
        <div class="wa-action-buttons">
          ${msg.actions.map(act => `
            <a href="${act.url || '#'}" ${act.url ? 'target="_blank"' : ''} class="wa-btn-chip ${act.danger ? 'danger' : ''}" onclick="${act.onClick || ''}">
              ${act.icon || ''} ${act.label}
            </a>
          `).join('')}
        </div>
      `;
    }

    const wrapper = document.createElement('div');
    wrapper.className = `wa-msg ${alignClass}`;
    wrapper.id = `msg-${this.currentStep}`;
    wrapper.innerHTML = `
      <div class="wa-bubble">
        ${contentHtml}
        <span class="wa-bubble-meta">
          <span>${msg.time || '10:48 AM'}</span>
          ${ticksHtml}
        </span>
      </div>
    `;

    return wrapper;
  }

  appendMessage(msg) {
    const el = this.renderMessageHtml(msg);
    if (this.typingIndicator && this.typingIndicator.parentNode === this.container) {
      this.container.insertBefore(el, this.typingIndicator);
    } else {
      this.container.appendChild(el);
    }
    this.scrollToBottom();
  }

  nextStep() {
    if (this.currentStep >= this.messages.length) {
      this.stopAutoPlay();
      return false;
    }

    const msg = this.messages[this.currentStep];
    this.currentStep++;
    this.updateCounter();

    if (msg.sender === 'bot') {
      this.showTyping(true);
      setTimeout(() => {
        this.showTyping(false);
        this.appendMessage(msg);
        if (this.devSpecCallback) this.devSpecCallback(this.currentStep - 1, msg);
      }, 700);
    } else {
      this.appendMessage(msg);
      if (this.devSpecCallback) this.devSpecCallback(this.currentStep - 1, msg);
    }

    return true;
  }

  toggleAutoPlay() {
    const playBtn = document.getElementById('btnPlay');
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.isPlaying = true;
      if (playBtn) playBtn.innerHTML = '⏸️ Pause';
      if (this.currentStep >= this.messages.length) {
        this.resetChat();
      }
      this.runAutoPlayStep();
    }
  }

  runAutoPlayStep() {
    if (!this.isPlaying) return;
    if (this.currentStep >= this.messages.length) {
      this.stopAutoPlay();
      return;
    }

    const hasMore = this.nextStep();
    if (hasMore) {
      const delay = this.messages[this.currentStep - 1]?.sender === 'bot' ? 2400 : 1800;
      this.playTimer = setTimeout(() => this.runAutoPlayStep(), delay);
    } else {
      this.stopAutoPlay();
    }
  }

  stopAutoPlay() {
    this.isPlaying = false;
    if (this.playTimer) clearTimeout(this.playTimer);
    const playBtn = document.getElementById('btnPlay');
    if (playBtn) playBtn.innerHTML = '▶️ Auto-Play';
  }

  jumpToEnd() {
    this.stopAutoPlay();
    this.resetChat();
    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      this.currentStep = i + 1;
      this.appendMessage(msg);
    }
    this.updateCounter();
    if (this.devSpecCallback && this.messages.length > 0) {
      this.devSpecCallback(this.messages.length - 1, this.messages[this.messages.length - 1]);
    }
  }

  resetChat() {
    this.stopAutoPlay();
    this.currentStep = 0;
    this.updateCounter();
    
    // Clear bubbles except static encryption header and typing indicator
    const msgs = this.container.querySelectorAll('.wa-msg');
    msgs.forEach(m => m.remove());
    this.showTyping(false);
    
    if (this.devSpecCallback) {
      this.devSpecCallback(0, null);
    }
  }

  updateCounter() {
    if (this.stepDisplay) {
      this.stepDisplay.innerText = `Step ${this.currentStep} of ${this.messages.length}`;
    }
  }
}

// Global modal helper
function openReceiptModal(src) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  if (modal && modalImg) {
    modalImg.src = src;
    modal.classList.add('open');
  }
}

function copyCode(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => {
    alert('Copied JSON payload to clipboard!');
  });
}
