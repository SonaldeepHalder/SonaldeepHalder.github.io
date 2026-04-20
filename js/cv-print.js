document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('print-btn');
    if (btn) btn.addEventListener('click', () => window.print());
});
