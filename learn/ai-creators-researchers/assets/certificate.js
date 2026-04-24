/* ============================================================
   AI for Creators & Researchers — premium certificate generator
   Landscape A4, charcoal + gold foil aesthetic, jsPDF-powered.
   ============================================================ */
(function () {
  function loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (window.jspdf && window.jspdf.jsPDF) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(s);
    });
  }

  async function build(name) {
    await loadJsPDF();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Background: warm cream
    doc.setFillColor(255, 251, 235);
    doc.rect(0, 0, W, H, 'F');

    // Outer border frame (gold)
    doc.setDrawColor(202, 138, 4);
    doc.setLineWidth(1.8);
    doc.rect(10, 10, W - 20, H - 20);
    // Inner fine line (ink)
    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(0.3);
    doc.rect(14, 14, W - 28, H - 28);

    // Header band
    doc.setFillColor(17, 24, 39);
    doc.rect(14, 14, W - 28, 20, 'F');

    // Gold divider on band
    doc.setFillColor(202, 138, 4);
    doc.rect(14, 34, W - 28, 1.5, 'F');

    // Header text
    doc.setTextColor(255, 251, 235);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('LEARN WITHOUT WALLS', W / 2, 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(202, 138, 4);
    doc.text('CERTIFICATE OF COMPLETION', W / 2, 29, { align: 'center', charSpace: 2 });

    // Course title
    doc.setTextColor(17, 24, 39);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(26);
    doc.text('AI for Creators', W / 2, 60, { align: 'center' });
    doc.setFontSize(22);
    doc.text('& Researchers', W / 2, 73, { align: 'center' });

    // Ornament
    doc.setDrawColor(202, 138, 4);
    doc.setLineWidth(0.6);
    doc.line(W / 2 - 40, 80, W / 2 - 8, 80);
    doc.line(W / 2 + 8, 80, W / 2 + 40, 80);
    doc.setFillColor(202, 138, 4);
    doc.circle(W / 2, 80, 1.4, 'F');

    // Presented-to line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text('Presented to', W / 2, 96, { align: 'center' });

    // Name (centerpiece)
    doc.setFont('times', 'italic');
    doc.setFontSize(36);
    doc.setTextColor(17, 24, 39);
    doc.text(name || 'Your Name', W / 2, 116, { align: 'center' });

    // Gold underline
    doc.setDrawColor(202, 138, 4);
    doc.setLineWidth(0.6);
    const nameWidth = Math.min(200, Math.max(110, doc.getTextWidth(name || 'Your Name') + 22));
    doc.line(W / 2 - nameWidth / 2, 121, W / 2 + nameWidth / 2, 121);

    // Citation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    const citation =
      'for the completion of thirty days of hands-on practice across deep research, ' +
      'coding and vibe-building, voice and audio, video creation, business power tools, ' +
      'and college-student AI, together with a multi-tool capstone project demonstrating ' +
      'practical fluency with the modern creator-and-researcher AI stack.';
    doc.text(citation, W / 2, 138, { align: 'center', maxWidth: W - 68 });

    // Footer details
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Awarded ' + today, 48, H - 40);

    // Signature block
    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(0.5);
    doc.line(W - 120, H - 42, W - 40, H - 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('Safaa Dabagh', W - 80, H - 35, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text('Founder, Learn Without Walls', W - 80, H - 30, { align: 'center' });

    // Gold footer ornament + URL
    doc.setFillColor(202, 138, 4);
    doc.rect(14, H - 16, W - 28, 0.6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('learnwithoutwalls.com  ·  AI for Creators & Researchers  ·  30-day certificate program',
             W / 2, H - 10, { align: 'center' });

    const safe = (name || 'Learner').replace(/[^A-Za-z0-9_-]+/g, '_');
    doc.save('AI_Creators_Researchers_' + safe + '.pdf');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('cert-generate');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const input = document.querySelector('.name-input-large');
      const n = input && input.value.trim() ? input.value.trim() : 'Your Name';
      btn.disabled = true;
      btn.textContent = 'Generating…';
      try {
        await build(n);
        btn.textContent = 'Download again';
      } catch (e) {
        btn.textContent = 'Retry';
        alert('Certificate generation failed: ' + e.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
})();
