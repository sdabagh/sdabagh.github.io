/* ============================================================
   AI Certificate PDF generator (client-side, jsPDF).
   Renders a landscape A4 certificate with the learner's name.
   ============================================================ */

(function () {
  function loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (window.jspdf && window.jspdf.jsPDF) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(s);
    });
  }

  async function buildCertificate(name) {
    await loadJsPDF();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Outer border
    doc.setDrawColor(107, 70, 193);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, W - 20, H - 20);
    doc.setLineWidth(0.3);
    doc.rect(14, 14, W - 28, H - 28);

    // Header strip
    doc.setFillColor(76, 49, 144);
    doc.rect(14, 14, W - 28, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CERTIFICATE OF COMPLETION', W / 2, 28, { align: 'center' });

    // Title
    doc.setTextColor(30, 30, 30);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(28);
    doc.text('AI Certificate in 28 Days', W / 2, 58, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(90, 90, 90);
    doc.text('28 days. 15 minutes a day. 26 AI tools, plus a capstone.', W / 2, 70, { align: 'center' });

    // "This is to certify that"
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(70, 70, 70);
    doc.text('This certificate is awarded to', W / 2, 90, { align: 'center' });

    // Name
    doc.setFont('times', 'italic');
    doc.setFontSize(34);
    doc.setTextColor(76, 49, 144);
    doc.text(name || 'Your Name', W / 2, 112, { align: 'center' });

    // Underline under name
    doc.setDrawColor(107, 70, 193);
    doc.setLineWidth(0.5);
    const nameWidth = Math.min(180, Math.max(120, doc.getTextWidth(name || 'Your Name') + 20));
    doc.line(W / 2 - nameWidth / 2, 116, W / 2 + nameWidth / 2, 116);

    // Citation paragraph
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    const citation =
      'for successfully completing all 28 days of hands-on practice across conversational AI, ' +
      'agentic builders, image and video generation, voice and audio, and productivity tools — ' +
      'and for demonstrating practical fluency with modern AI in daily work.';
    doc.text(citation, W / 2, 134, { align: 'center', maxWidth: W - 60 });

    // Date + signature line
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Awarded: ' + today, 50, H - 38);

    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.4);
    doc.line(W - 110, H - 40, W - 40, H - 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.text('Safaa Dabagh', W - 75, H - 33, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Learn Without Walls  ·  Course Author', W - 75, H - 27, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('learnwithoutwalls.com  /  AI Certificate Program', W / 2, H - 18, { align: 'center' });

    const safe = (name || 'Learner').replace(/[^A-Za-z0-9_-]+/g, '_');
    doc.save('AI_Certificate_' + safe + '.pdf');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('generate-cert-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const input = document.querySelector('.name-input');
      const name = input && input.value.trim() ? input.value.trim() : 'Your Name';
      btn.disabled = true;
      btn.textContent = 'Generating…';
      try {
        await buildCertificate(name);
        btn.textContent = 'Download Again';
      } catch (e) {
        btn.textContent = 'Retry';
        alert('Certificate generation failed: ' + e.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
})();
