// Launch countdown (RS-0050), used by LaunchStatus + the home hero.
// Counts down to local midnight of the launch date (or LAUNCH_AT if set).
  function target(el: HTMLElement): number {
    const at = el.dataset.launchAt;
    if (at) return Date.parse(at);
    const [y, m, d] = (el.dataset.launchDate || '').split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0).getTime();
  }
  function tick() {
    document.querySelectorAll<HTMLElement>('[data-launch-date]').forEach((el) => {
      const ms = target(el) - Date.now();
      const row = el.querySelector<HTMLElement>('[data-cd-row]');
      const when = el.querySelector<HTMLElement>('[data-cd-when]');
      if (!row || !when) return;
      if (ms <= 0) { row.hidden = true; when.textContent = 'is out now'; return; }
      const mins = Math.floor(ms / 60000);
      const set = (k: string, v: number) => { const s = el.querySelector(`[data-cd="${k}"]`); if (s) s.textContent = String(v).padStart(k === 'd' ? 1 : 2, '0'); };
      set('d', Math.floor(mins / 1440)); set('h', Math.floor((mins % 1440) / 60)); set('m', mins % 60);
      when.textContent = 'in';
      row.hidden = false;
    });
  }
  tick();
  setInterval(tick, 30000);
