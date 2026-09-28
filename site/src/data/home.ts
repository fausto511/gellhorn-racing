// Compact crew / event cards for the home page strips (2026-09-28).
// Full cards live in The Hub; these link there.
import { esc, crewEmblemHtml, crewTagHtml, focusLabels, eventTypeLabels, type HubCrew, type HubEvent } from './hub';

const base = import.meta.env.BASE_URL;

export function homeCrewCard(c: HubCrew): string {
  const focus = c.focus.slice(0, 2).map((f) => `<span class="chip">${esc(focusLabels[f] ?? f)}</span>`).join('');
  const sub = [c.member_count != null ? `${c.member_count} members` : null, c.region].filter(Boolean).map(esc).join(' · ');
  return `<a class="hc-card" href="${base}hub/crews/?q=${encodeURIComponent(c.tag)}">
  <span class="hc-top">${crewEmblemHtml(c.color)}<span style="min-width:0"><span class="hc-name">${esc(c.name)}</span><span class="hc-sub">${sub}</span></span></span>
  <span class="hc-chips">${crewTagHtml(c.tag, c.color, 'sm')}${focus}</span>
</a>`;
}

export function homeEventCard(e: HubEvent): string {
  const d = new Date(e.starts_at);
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' });
  const mon = d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const where = e.location ? ` · ${esc(e.location)}` : '';
  return `<a class="hc-card" href="${base}hub/events/">
  <span class="he-date" data-ts="${esc(e.starts_at)}"><span data-fmt="wd">${esc(wd)}</span><span class="he-day" data-fmt="day">${esc(day)}</span><span data-fmt="mon">${esc(mon)}</span></span>
  <span class="he-title">${esc(e.title)}</span>
  <span class="he-meta"><span data-ts="${esc(e.starts_at)}" data-fmt="time">${esc(time)}</span>${where}</span>
  <span class="hc-chips"><span class="chip chip-type chip-${esc(e.event_type)}">${esc(eventTypeLabels[e.event_type] ?? e.event_type)}</span>${e.host ? crewTagHtml(e.host.tag, e.host.color, 'sm') : ''}</span>
</a>`;
}
