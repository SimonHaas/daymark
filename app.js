(() => {
  const STORAGE_KEY = 'daymark.habits.v1';
  const list = document.querySelector('#habit-list');
  const form = document.querySelector('#add-form');
  const input = document.querySelector('#habit-name');
  const emptyState = document.querySelector('#empty-state');
  const todayLabel = document.querySelector('#today-label');

  const todayKey = () => localDateKey(new Date());
  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  function dateOffset(key, days) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - days);
    return localDateKey(date);
  }
  function daysBetween(startKey, endKey) {
    const [sy, sm, sd] = startKey.split('-').map(Number);
    const [ey, em, ed] = endKey.split('-').map(Number);
    return Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000);
  }
  function startDateFor(habit) {
    const recordedDays = Object.keys(habit.days).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
    return [habit.createdOn, ...recordedDays].filter(Boolean).sort()[0] || todayKey();
  }
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data.filter(h => h && typeof h.id === 'string' && typeof h.name === 'string' && h.days && typeof h.days === 'object') : [];
    } catch { return []; }
  }
  let habits = load();
  for (const habit of habits) {
    if (!habit.createdOn) {
      const recordedDays = Object.keys(habit.days).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort();
      habit.createdOn = recordedDays[0] || todayKey();
    }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }

  function scoreFor(habit) {
    let earned = 0;
    let possible = 0;
    const dayCount = Math.max(1, daysBetween(startDateFor(habit), todayKey()) + 1);
    for (let age = 0; age < dayCount; age++) {
      const weight = 1 / (1 + age);
      possible += weight;
      if (habit.days[dateOffset(todayKey(), age)]) earned += weight;
    }
    return possible ? Math.round((earned / possible) * 100) : 0;
  }

  function render() {
    todayLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
    list.replaceChildren();
    emptyState.hidden = habits.length > 0;
    for (const habit of habits) {
      const score = scoreFor(habit);
      const card = document.createElement('article');
      card.className = 'habit-card';
      const head = document.createElement('div');
      head.className = 'habit-head';
      const nameWrap = document.createElement('div');
      nameWrap.className = 'habit-name-wrap';
      const name = document.createElement('div');
      name.className = 'habit-name';
      name.textContent = habit.name;
      const sub = document.createElement('div');
      sub.className = 'habit-sub';
      sub.textContent = 'All-time consistency score';
      nameWrap.append(name, sub);
      const scoreEl = document.createElement('div');
      scoreEl.className = 'score';
      scoreEl.innerHTML = `<strong>${score}</strong><span>/ 100</span>`;
      head.append(nameWrap, scoreEl);

      const track = document.createElement('div');
      track.className = 'progress-track';
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-label', `${habit.name} score`);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(score));
      const fill = document.createElement('div');
      fill.className = 'progress-fill';
      fill.style.width = `${score}%`;
      track.append(fill);

      const foot = document.createElement('div');
      foot.className = 'habit-foot';
      const history = document.createElement('div');
      history.className = 'history';
      history.setAttribute('aria-label', 'Daily history since this habit was added, oldest to newest');
      const dayCount = Math.max(1, daysBetween(startDateFor(habit), todayKey()) + 1);
      for (let age = dayCount - 1; age >= 0; age--) {
        const key = dateOffset(todayKey(), age);
        const completed = Boolean(habit.days[key]);
        const editable = age <= 1;
        const dot = document.createElement(editable ? 'button' : 'span');
        if (editable) {
          dot.type = 'button';
          dot.setAttribute('aria-label', `${key}: ${completed ? 'completed' : 'not completed'}. Click to change.`);
          dot.setAttribute('aria-pressed', String(completed));
          dot.addEventListener('click', () => {
            if (habit.days[key]) delete habit.days[key];
            else habit.days[key] = true;
            save(); render();
          });
        }
        dot.className = `day-dot${habit.days[key] ? ' on' : ''}${age === 0 ? ' today' : ''}`;
        dot.title = `${key} · ${completed ? 'completed' : 'not completed'}${editable ? ' · click to change' : ''}`;
        history.append(dot);
      }
      const caption = document.createElement('span');
      caption.className = 'history-caption';
      caption.textContent = `${dayCount} day${dayCount === 1 ? '' : 's'}`;
      history.append(caption);
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.alignItems = 'center';
      const toggle = document.createElement('button');
      const completeToday = Boolean(habit.days[todayKey()]);
      toggle.className = `today-toggle${completeToday ? ' done' : ''}`;
      toggle.type = 'button';
      toggle.textContent = completeToday ? '✓ Done today' : '＋ Mark today';
      toggle.setAttribute('aria-pressed', String(completeToday));
      toggle.addEventListener('click', () => {
        const key = todayKey();
        if (habit.days[key]) delete habit.days[key];
        else habit.days[key] = true;
        save(); render();
      });
      const remove = document.createElement('button');
      remove.className = 'delete-button';
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Delete ${habit.name}`);
      remove.addEventListener('click', () => {
        habits = habits.filter(item => item.id !== habit.id);
        save(); render();
      });
      actions.append(toggle, remove);
      foot.append(history, actions);
      card.append(head, track, foot);
      list.append(card);
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    habits.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, createdOn: todayKey(), days: {} });
    save();
    input.value = '';
    render();
  });
  render();
})();
