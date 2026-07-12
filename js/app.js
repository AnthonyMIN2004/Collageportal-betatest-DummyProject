// ── COLLEGIATE PORTAL | APP.JS ──
// Tab controller, weather applet, app initialization

// ── TAB CONTROLLER ──
function switchTab(workspaceId) {
  document.querySelectorAll('.ws-view').forEach(view => {
    view.classList.add('hidden');
    view.classList.remove('block');
  });
  const target = document.getElementById('ws-' + workspaceId);
  if (target) {
    target.classList.add('block');
    target.classList.remove('hidden');
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.className = 'nav-btn flex items-center justify-between w-full p-3 rounded-xl font-bold text-xs text-left transition-all group text-slate-600 hover:bg-slate-50';
  });
  const allNavBtns = Array.from(document.querySelectorAll('.nav-btn'));
  const activeBtn = allNavBtns.find(btn => btn.getAttribute('onclick')?.includes(`'${workspaceId}'`));
  if (activeBtn) {
    activeBtn.className = 'nav-btn active flex items-center justify-between w-full p-3 rounded-xl font-bold text-xs text-left transition-all group bg-brand-50 text-brand-600';
  }

  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.className = 'mobile-nav-btn flex flex-col items-center gap-1 text-slate-400 active:scale-95 transition-all';
  });
  const allMobileBtns = Array.from(document.querySelectorAll('.mobile-nav-btn'));
  const activeMobileBtn = allMobileBtns.find(btn => btn.getAttribute('onclick')?.includes(`'${workspaceId}'`));
  if (activeMobileBtn) {
    activeMobileBtn.className = 'mobile-nav-btn active flex flex-col items-center gap-1 text-brand-500 active:scale-95 transition-all';
  }

  const tabTitles = {
    home: lang === 'en' ? 'Dashboard Home' : '総合ダッシュボード',
    classes: lang === 'en' ? 'Enrolled Classes' : '授業カリキュラム',
    schedule: lang === 'en' ? 'Weekly Time Planner' : '週間スケジュール',
    reviews: lang === 'en' ? 'Anonymous Feedback' : '講義評価ボード'
  };
  document.getElementById('active-tab-lbl').textContent = tabTitles[workspaceId] || 'Portal Workspace';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── WEATHER APPLET ──
async function renderWeatherApplet() {
  const wCard = document.getElementById('weather-details-card');
  if (!navigator.geolocation) {
    wCard.innerHTML = `<p class="text-xs font-semibold text-slate-400">GPS Blocked</p>`;
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      const { latitude: lat, longitude: lon } = pos.coords;
      const data = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,relative_humidity_2m,windspeed_10m`)).json();
      const { temperature_2m: temp, weathercode: code, relative_humidity_2m: hum, windspeed_10m: wind } = data.current;

      let emoji = '☀️', desc = 'Clear Sky';
      if (code >= 80) { emoji = '⛈️'; desc = 'Thunderstorm'; }
      else if (code >= 61) { emoji = '🌧️'; desc = 'Rainy'; }
      else if (code >= 51) { emoji = '🌦️'; desc = 'Drizzle'; }
      else if (code >= 3) { emoji = '☁️'; desc = 'Cloudy'; }
      else if (code >= 1) { emoji = '⛅'; desc = 'Partly cloudy'; }

      document.getElementById('header-weather-icon').textContent = emoji;
      document.getElementById('header-weather-temp').textContent = `${temp}°C`;
      document.getElementById('header-weather-desc').innerHTML = `${desc} &bull; Hum ${hum}%`;

      wCard.innerHTML = `
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Osaka Weather</p>
        <div class="py-2 flex items-center gap-3">
          <span class="text-4xl">${emoji}</span>
          <div>
            <span class="text-2xl font-black block">${temp}°C</span>
            <span class="text-xs font-bold text-slate-500">${desc}</span>
          </div>
        </div>
        <span class="text-[9px] font-bold text-slate-400 block mt-1">💨 Wind: ${wind} km/h &bull; 💧 Hum: ${hum}%</span>
      `;
    } catch (e) {
      wCard.innerHTML = `<p class="text-xs font-bold text-slate-400">API Fetch Error</p>`;
    }
  }, () => {
    wCard.innerHTML = `
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Osaka Weather</p>
      <div class="py-2 flex items-center gap-2">
        <span class="text-2xl">⛅</span>
        <div>
          <span class="text-base font-black block">24°C</span>
          <span class="text-[10px] font-bold text-slate-500">Sunny</span>
        </div>
      </div>
      <span class="text-[9px] font-bold text-slate-400 block">Location access required for real weather.</span>
    `;
  });
}

// ── APP INITIALIZATION ──
// Each feature initializes inside its own try/catch, so if one widget
// throws (bad data, missing element...) the rest of the portal still works.
function runSafe(label, fn) {
  try {
    fn();
  } catch (e) {
    console.error(`[init] ${label} failed:`, e);
  }
}

function init() {
  runSafe('local database', loadLocalDatabase);
  runSafe('quick tasks', loadQuickTasks);
  runSafe('clock', runRealTimeClock);
  runSafe('greeting', updateGreeting);
  runSafe('review select', populateReviewSelect);
  runSafe('mascot speech', renderMascotSpeech);
  runSafe('today classes', renderTodayClasses);
  runSafe('bring reminder', renderBringReminder);
  runSafe('weather', renderWeatherApplet);
  runSafe('exams', renderExams);
  runSafe('events', renderEvents);
  runSafe('class grid', renderBlockGrid);
  runSafe('full schedule', renderFullSchedule);
  runSafe('reviews', renderReviews);
  runSafe('next class timer', updateNextClassTimer);

  runSafe('class badge', () => {
    document.getElementById('class-badge-count').textContent = ALL_CLASSES.length;
  });

  if (typeof initOrbs === 'function') runSafe('mascot orbs', initOrbs);
}

if (studentId) {
  init();
}
