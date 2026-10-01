// Wires the shared vehicle tiles (components/VehicleTile.astro): the "+"
// compare marker (state in localStorage, scripts/compare.ts) and the "Owned"
// pill for the signed-in driver's own vehicles (RS-0032). Used by The Garage,
// the class/manufacturer pages and the home page.
import { isSelected, toggleSelected } from './compare';
import { currentDriverId, fetchOwned } from './owned';

export function initVehicleTiles(root: ParentNode = document, onCompareChange?: () => void) {
  root.querySelectorAll<HTMLButtonElement>('.v-compare-mark').forEach((btn) => {
    const id = btn.dataset.id!;
    if (isSelected(id)) {
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nowSelected = toggleSelected(id);
      btn.classList.toggle('is-selected', nowSelected);
      btn.setAttribute('aria-pressed', String(nowSelected));
      onCompareChange?.();
    });
  });

  // Private data, only visible to that driver; nothing happens when signed out.
  (async () => {
    if (!(await currentDriverId())) return;
    const owned = await fetchOwned();
    owned.forEach((id) => {
      const tile = root.querySelector<HTMLElement>(`.v-tile[data-id="${CSS.escape(id)}"]`);
      if (!tile || tile.classList.contains('is-owned')) return;
      tile.classList.add('is-owned');
      tile.querySelector('.v-badges')?.insertAdjacentHTML('afterbegin', '<span class="v-owned" title="In My Garage">Owned</span>');
    });
  })();
}
