<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import SessionHistoryCard from "../components/SessionHistoryCard.svelte";
  import { modalStore } from "../lib/stores/modalStore.js";
  import { getHiddenExerciseNames, saveHiddenExerciseNames } from "../lib/db/sessionService.js";
  import { getAllWorkouts } from "../lib/db/workoutService.js";
  import { statisticsStore } from "../lib/stores/statisticsStore.js";

  let activeTab = $state("summary");
  let exerciseFilter = $state("visible");
  let search = $state("");
  let historyRange = $state("1m");
  let summaryRange = $state("3m");
  let activityZoom = $state("weekly");
  let activityYear = $state(new Date().getFullYear());
  let activityChart = $state();
  let calendarMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  let sessionDateFilter = $state("30d");
  let completionFilter = $state("all");
  let routineFilter = $state("all");
  let selectedMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  let customStart = $state("");
  let customEnd = $state("");
  let selectedExercise = $state(null);
  let hiddenExerciseNames = $state(new Set());
  let currentWorkouts = $state([]);

  const exercises = $derived(getExercises($statisticsStore.sessions, currentWorkouts));
  const qualifyingSessions = $derived($statisticsStore.sessions.filter(hasCompletedSet));
  const summarySessions = $derived(filterSessionsBySummaryRange(qualifyingSessions, summaryRange));
  const weeklyActivity = $derived(weeklyActivityFor(summarySessions, summaryRange));
  const activityBuckets = $derived(activityBucketsFor(qualifyingSessions, activityZoom, activityYear));
  const summaryStats = $derived(summaryMetrics(qualifyingSessions, summarySessions));
  const calendarDays = $derived(calendarDaysFor(calendarMonth, qualifyingSessions));

  $effect(() => {
    activityBuckets;
    const chart = activityChart;
    if (chart)
      requestAnimationFrame(() => {
        const filledBars = chart.querySelectorAll('[data-filled="true"]');
        const latestFilledBar = filledBars[filledBars.length - 1];
        if (latestFilledBar) chart.scrollLeft = Math.max(0, latestFilledBar.offsetLeft + latestFilledBar.offsetWidth - chart.clientWidth);
        else chart.scrollLeft = 0;
      });
  });
  const routineNames = $derived(
    [...new Set($statisticsStore.sessions.map((session) => session.routineName))].sort((first, second) => first.localeCompare(second)),
  );
  const filteredSessions = $derived(filterSessions($statisticsStore.sessions));
  const filteredExercises = $derived(
    exercises.filter((exercise) => {
      const isHidden = hiddenExerciseNames.has(exercise.name);
      return (exerciseFilter === "hidden" ? isHidden : !isHidden) && exercise.name.toLowerCase().includes(search.trim().toLowerCase());
    }),
  );
  const allSelectedRecords = $derived(selectedExercise ? recordsFor(selectedExercise.name, $statisticsStore.sessions) : []);
  const selectedRecords = $derived(filterRecordsByRange(allSelectedRecords, historyRange));
  const chartPoints = $derived(pointsFor(selectedRecords));
  const chartAxisLabels = $derived(axisLabelsFor(selectedRecords, selectedExercise?.unit));
  const highestAmount = $derived(allSelectedRecords.reduce((highest, record) => Math.max(highest, record.amount ?? 0), 0));
  const lastRecord = $derived(allSelectedRecords.at(-1));

  onMount(async () => {
    const [hidden, workouts] = await Promise.all([getHiddenExerciseNames(), getAllWorkouts(), statisticsStore.load()]);
    hiddenExerciseNames = new Set(hidden);
    currentWorkouts = workouts;
  });

  function getExercises(sessions, workouts) {
    const exercisesByName = new Map();
    for (const session of sessions) {
      for (const exercise of session.exercises ?? []) {
        const existing = exercisesByName.get(exercise.name) ?? {
          name: exercise.name,
          sessions: 0,
          lastPerformed: session.finishedAt,
          unit: exercise.unit,
        };
        existing.sessions += 1;
        if (new Date(session.finishedAt) > new Date(existing.lastPerformed)) {
          existing.lastPerformed = session.finishedAt;
          existing.unit = exercise.unit;
        }
        exercisesByName.set(exercise.name, existing);
      }
    }
    for (const workout of workouts) {
      if (!exercisesByName.has(workout.name)) {
        exercisesByName.set(workout.name, { name: workout.name, sessions: 0, lastPerformed: null, unit: workout.unit });
      }
    }
    return [...exercisesByName.values()].sort((first, second) => first.name.localeCompare(second.name));
  }

  function recordsFor(name, sessions) {
    return sessions
      .flatMap((session) =>
        (session.exercises ?? []).filter((exercise) => exercise.name === name).map((exercise) => ({ ...exercise, finishedAt: session.finishedAt })),
      )
      .sort((first, second) => new Date(first.finishedAt) - new Date(second.finishedAt));
  }

  function pointsFor(records) {
    if (!records.length) return "";
    const amounts = records.map((record) => Number(record.amount) || 0);
    const minimum = Math.min(...amounts);
    const range = Math.max(...amounts) - minimum || 1;
    return amounts
      .map((amount, index) => {
        const x = records.length === 1 ? 50 : (index / (records.length - 1)) * 100;
        return `${x},${90 - ((amount - minimum) / range) * 80}`;
      })
      .join(" ");
  }

  function axisLabelsFor(records, unit) {
    if (!records.length) return [];
    const amounts = records.map((record) => Number(record.amount) || 0);
    const minimum = Math.min(...amounts);
    const maximum = Math.max(...amounts);
    return [maximum, (maximum + minimum) / 2, minimum].map((amount) => ({
      value: amount,
      label: amountLabel(Number.isInteger(amount) ? amount : amount.toFixed(1), unit),
    }));
  }

  function filterRecordsByRange(records, range) {
    if (range === "all") return records;
    const start = new Date();
    start.setMonth(start.getMonth() - Number(range.replace("m", "")));
    return records.filter((record) => new Date(record.finishedAt) >= start);
  }

  function filterSessions(sessions) {
    const { start, end } = sessionDateBounds();
    return sessions.filter((session) => {
      const finishedAt = new Date(session.finishedAt);
      return (
        (!start || finishedAt >= start) &&
        (!end || finishedAt < end) &&
        (completionFilter === "all" || session.status === completionFilter) &&
        (routineFilter === "all" || session.routineName === routineFilter)
      );
    });
  }

  function sessionDateBounds() {
    const today = startOfLocalDay(new Date());
    if (sessionDateFilter === "7d") return { start: addDays(today, -6) };
    if (sessionDateFilter === "30d") return { start: addDays(today, -29) };
    if (sessionDateFilter === "3m") {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      return { start };
    }
    if (sessionDateFilter === "month") {
      return { start: selectedMonth, end: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1) };
    }
    if (sessionDateFilter === "custom") {
      return {
        start: customStart ? localDateFromInput(customStart) : null,
        end: customEnd ? addDays(localDateFromInput(customEnd), 1) : null,
      };
    }
    return {};
  }

  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  function localDateFromInput(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  function shiftSelectedMonth(amount) {
    selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + amount, 1);
  }
  function clearSessionFilters() {
    sessionDateFilter = "30d";
    completionFilter = "all";
    routineFilter = "all";
    customStart = "";
    customEnd = "";
    selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }
  function requestClearSessionFilters() {
    modalStore.show({
      title: "Clear filters?",
      content: "This will restore the default filters.",
      acceptText: "Clear filters",
      closeText: "Cancel",
      onAccept: clearSessionFilters,
    });
  }

  function hasCompletedSet(session) {
    return (session.exercises ?? []).some((exercise) => exercise.completedSets > 0);
  }

  function filterSessionsBySummaryRange(sessions, range) {
    if (range === "all") return sessions;
    const start = startOfLocalDay(new Date());
    start.setMonth(start.getMonth() - Number(range.replace("m", "")));
    return sessions.filter((session) => new Date(session.finishedAt) >= start);
  }

  function startOfWeek(date) {
    const start = startOfLocalDay(date);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
  }

  function weeklyActivityFor(sessions, range) {
    const nowWeek = startOfWeek(new Date());
    const firstWeek =
      range === "all" && sessions.length
        ? startOfWeek(new Date(sessions.at(-1).finishedAt))
        : range === "all"
          ? nowWeek
          : (() => {
              const date = startOfLocalDay(new Date());
              date.setMonth(date.getMonth() - Number(range.replace("m", "")));
              return startOfWeek(date);
            })();
    const counts = new Map();
    for (const session of sessions) {
      const key = startOfWeek(new Date(session.finishedAt)).toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const weeks = [];
    for (let week = firstWeek; week <= nowWeek; week = addDays(week, 7)) {
      const key = week.toISOString().slice(0, 10);
      weeks.push({ key, label: `W${weeks.length + 1}`, count: counts.get(key) ?? 0 });
    }
    return weeks;
  }

  function activityBucketsFor(sessions, zoom, year) {
    const counts = new Map();
    const add = (key) => counts.set(key, (counts.get(key) ?? 0) + 1);
    if (zoom === "yearly") {
      for (const session of sessions) add(String(new Date(session.finishedAt).getFullYear()));
      const firstYear = sessions.length
        ? Math.min(...sessions.map((session) => new Date(session.finishedAt).getFullYear()))
        : new Date().getFullYear();
      return Array.from({ length: new Date().getFullYear() - firstYear + 1 }, (_, index) => {
        const label = String(firstYear + index);
        return { key: label, label, count: counts.get(label) ?? 0 };
      });
    }
    if (zoom === "monthly") {
      for (const session of sessions) {
        const date = new Date(session.finishedAt);
        if (date.getFullYear() === year) add(String(date.getMonth()));
      }
      return Array.from({ length: 12 }, (_, month) => ({
        key: String(month),
        label: new Date(year, month, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        count: counts.get(String(month)) ?? 0,
      }));
    }
    const firstWeek = startOfWeek(new Date(year, 0, 1));
    for (const session of sessions) {
      const date = new Date(session.finishedAt);
      if (date.getFullYear() === year) add(startOfWeek(date).toISOString().slice(0, 10));
    }
    return Array.from({ length: 52 }, (_, index) => {
      const date = addDays(firstWeek, index * 7);
      const key = date.toISOString().slice(0, 10);
      return { key, label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }), count: counts.get(key) ?? 0 };
    });
  }

  function shiftActivityYear(amount) {
    activityYear += amount;
  }
  function resetActivityDate() {
    activityYear = new Date().getFullYear();
  }

  function summaryMetrics(allSessions, periodSessions) {
    const now = new Date();
    const monthSessions = allSessions.filter((session) => {
      const date = new Date(session.finishedAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
    const activeDays = new Set(periodSessions.map((session) => localDayKey(new Date(session.finishedAt)))).size;
    const duration = periodSessions.reduce((total, session) => total + Math.max(0, new Date(session.finishedAt) - new Date(session.startedAt)), 0);
    return {
      sessionsThisMonth: monthSessions.length,
      sessionsPerWeek: weeklyActivity.length ? periodSessions.length / weeklyActivity.length : 0,
      activeDays,
      currentStreak: activeWeekStreak(allSessions),
      averageDuration: periodSessions.length ? Math.round(duration / periodSessions.length / 60000) : 0,
    };
  }

  function activeWeekStreak(sessions) {
    const activeWeeks = new Set(sessions.map((session) => startOfWeek(new Date(session.finishedAt)).toISOString().slice(0, 10)));
    let streak = 0;
    for (let week = startOfWeek(new Date()); activeWeeks.has(week.toISOString().slice(0, 10)); week = addDays(week, -7)) streak += 1;
    return streak;
  }

  function localDayKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  function calendarDaysFor(month, sessions) {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const cells = Array((first.getDay() + 6) % 7).fill(null);
    const counts = new Map();
    for (const session of sessions) {
      const date = new Date(session.finishedAt);
      if (date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()) {
        const key = localDayKey(date);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    for (let day = 1; day <= last.getDate(); day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      cells.push({ day, count: counts.get(localDayKey(date)) ?? 0 });
    }
    return cells;
  }

  function shiftCalendarMonth(amount) {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1);
  }

  async function setExerciseVisibility(name, visible) {
    const nextNames = new Set(hiddenExerciseNames);
    if (visible) nextNames.delete(name);
    else nextNames.add(name);
    hiddenExerciseNames = nextNames;
    await saveHiddenExerciseNames([...nextNames]);
  }

  function requestDelete(session) {
    modalStore.show({
      title: "Delete session?",
      content: `Permanently delete the ${session.routineName} session from ${formatDate(session.finishedAt)}? Its routine will not be changed.`,
      acceptText: "Delete",
      closeText: "Cancel",
      onAccept: () => statisticsStore.remove(session.id),
    });
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function amountLabel(amount, unit) {
    return unit && unit !== "none" ? `${amount} ${unit}` : String(amount);
  }
</script>

<section class="statistics-view">
  <div class="stats-tabs" role="tablist" aria-label="Statistics views">
    <button class:active={activeTab === "summary"} role="tab" aria-selected={activeTab === "summary"} onclick={() => (activeTab = "summary")}
      >Summary</button
    >
    <button class:active={activeTab === "sessions"} role="tab" aria-selected={activeTab === "sessions"} onclick={() => (activeTab = "sessions")}
      >Sessions</button
    >
    <button
      class:active={activeTab === "progression"}
      role="tab"
      aria-selected={activeTab === "progression"}
      onclick={() => (activeTab = "progression")}>Exercise progression</button
    >
  </div>

  {#if activeTab === "summary"}
    <section class="summary-view" transition:fade={{ duration: 250 }}>
      {#if $statisticsStore.loading}
        <p class="empty">Loading summary…</p>
      {:else}
        <div class="summary-header">
          <h2>Training summary</h2>
          <div class="summary-range">
            <button class:active={summaryRange === "3m"} onclick={() => (summaryRange = "3m")}>3 months</button><button
              class:active={summaryRange === "6m"}
              onclick={() => (summaryRange = "6m")}>6 months</button
            ><button class:active={summaryRange === "all"} onclick={() => (summaryRange = "all")}>All time</button>
          </div>
        </div>
        <div class="summary-metrics">
          <div><strong>{summaryStats.sessionsThisMonth}</strong><span>Sessions this month</span><small>Finished sessions</small></div>
          <div>
            <strong>{summaryStats.sessionsPerWeek.toFixed(1)}</strong><span>Sessions per week</span><small>Average over selected period</small>
          </div>
          <div><strong>{summaryStats.activeDays}</strong><span>Active days</span><small>Unique dates trained</small></div>
          <div>
            <strong>{summaryStats.currentStreak} {summaryStats.currentStreak === 1 ? "week" : "weeks"}</strong><span>Current streak</span><small
              >Consecutive active weeks</small
            >
          </div>
          <div><strong>{summaryStats.averageDuration} min</strong><span>Average duration</span><small>Per finished session</small></div>
        </div>
        <section class="weekly-chart">
          <div class="activity-header">
            <h3>Activity</h3>
            <div class="activity-zoom">
              <button class:active={activityZoom === "weekly"} onclick={() => (activityZoom = "weekly")}>Weekly</button><button
                class:active={activityZoom === "monthly"}
                onclick={() => (activityZoom = "monthly")}>Monthly</button
              ><button class:active={activityZoom === "yearly"} onclick={() => (activityZoom = "yearly")}>Yearly</button>
            </div>
          </div>
          {#if activityZoom !== "yearly"}<div class="activity-pagination">
              <button onclick={() => shiftActivityYear(-1)} aria-label="Previous year"><span class="material-icons">chevron_left</span></button
              ><strong>{activityYear}</strong><button onclick={() => shiftActivityYear(1)} aria-label="Next year"
                ><span class="material-icons">chevron_right</span></button
              ><button class="current-year" onclick={resetActivityDate}>Current date</button>
            </div>{/if}
          <div class="bar-chart" bind:this={activityChart}>
            {#each activityBuckets as bucket (bucket.key)}<div
                class="bar-column"
                data-filled={bucket.count > 0}
                title={`${bucket.label}: ${bucket.count} sessions`}
              >
                <span>{bucket.count || ""}</span><i
                  style={`height: ${Math.max(3, (bucket.count / Math.max(1, ...activityBuckets.map((item) => item.count))) * 100)}%`}
                ></i><small>{bucket.label}</small>
              </div>{/each}
          </div>
        </section>
        <section class="training-calendar">
          <div class="calendar-header">
            <h3>Training calendar</h3>
            <div>
              <button onclick={() => shiftCalendarMonth(-1)} aria-label="Previous month"><span class="material-icons">chevron_left</span></button
              ><strong>{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong><button
                onclick={() => shiftCalendarMonth(1)}
                aria-label="Next month"><span class="material-icons">chevron_right</span></button
              >
            </div>
          </div>
          <div class="calendar-weekdays"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
          <div class="calendar-grid">
            {#each calendarDays as day, index (index)}{#if day}<div
                  class:active-day={day.count > 0}
                  class:busy-day={day.count > 1}
                  title={day.count ? `${day.count} session${day.count === 1 ? "" : "s"}` : "No sessions"}
                >
                  <span>{day.day}</span>{#if day.count > 0}<small>{day.count}</small>{/if}
                </div>{:else}<div class="calendar-blank"></div>{/if}{/each}
          </div>
        </section>
      {/if}
    </section>
  {:else if activeTab === "sessions"}
    <div class="statistics-panel" transition:fade={{ duration: 250 }}>
      <h2 class="sessions-title">Sessions</h2>
      {#if $statisticsStore.loading}
        <p class="empty">Loading session history…</p>
      {:else if $statisticsStore.sessions.length === 0}
        <div class="empty">
          <span class="material-icons">insights</span>
          <h3>No completed routines yet</h3>
          <p>Finish or save a routine to start building your history.</p>
        </div>
      {:else}
        <div class="session-filters">
          <label
            >Date filter
            <select bind:value={sessionDateFilter}>
              <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="3m">Last 3 months</option><option
                value="all">All time</option
              ><option value="month">Specific month</option><option value="custom">Custom range</option>
            </select>
          </label>
          <label
            >Completion
            <select bind:value={completionFilter}
              ><option value="all">All</option><option value="completed">Completed</option><option value="partial">Partial</option></select
            >
          </label>
          <label
            >Routine
            <select bind:value={routineFilter}
              ><option value="all">All routines</option>{#each routineNames as name}<option value={name}>{name}</option>{/each}</select
            >
          </label>
          <button class="clear-filters" onclick={requestClearSessionFilters}>Clear filters</button>
        </div>
        {#if sessionDateFilter === "month"}
          <div class="month-navigation">
            <button onclick={() => shiftSelectedMonth(-1)} aria-label="Previous month"><span class="material-icons">chevron_left</span></button
            ><strong>{selectedMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button
              onclick={() => shiftSelectedMonth(1)}
              aria-label="Next month"><span class="material-icons">chevron_right</span></button
            >
          </div>
        {:else if sessionDateFilter === "custom"}
          <div class="custom-date-range">
            <label>From <input type="date" bind:value={customStart} /></label><label>To <input type="date" bind:value={customEnd} /></label>
          </div>
        {/if}
        {#if filteredSessions.length === 0}
          <p class="empty filtered-empty">No sessions match these filters.</p>
        {:else}
          <div class="session-list">
            {#each filteredSessions as session (session.id)}<SessionHistoryCard {session} onDelete={requestDelete} />{/each}
          </div>
        {/if}
      {/if}
    </div>
  {:else if selectedExercise}
    <section class="exercise-detail" transition:fade={{ duration: 250 }}>
      <button class="back-button" onclick={() => (selectedExercise = null)}><span class="material-icons">arrow_back</span> All exercises</button>
      <header>
        <div>
          <h2>{selectedExercise.name}</h2>
          <p>{allSelectedRecords.length} sessions · Last performed {lastRecord ? formatDate(lastRecord.finishedAt) : "never"}</p>
        </div>
        <button
          class="visibility-button"
          onclick={() => setExerciseVisibility(selectedExercise.name, hiddenExerciseNames.has(selectedExercise.name))}
        >
          <span class="material-icons">{hiddenExerciseNames.has(selectedExercise.name) ? "visibility" : "visibility_off"}</span
          >{hiddenExerciseNames.has(selectedExercise.name) ? "Show" : "Hide"}
        </button>
      </header>
      <div class="progress-summary">
        <div><span>Highest logged amount</span><strong>{amountLabel(highestAmount, selectedExercise.unit)}</strong></div>
        <div><span>Last completed sets</span><strong>{lastRecord?.completedSets ?? 0} / {lastRecord?.sets ?? 0}</strong></div>
      </div>
      <div class="history-ranges" role="tablist" aria-label="Progression date range">
        <button class:active={historyRange === "1m"} onclick={() => (historyRange = "1m")}>1M</button>
        <button class:active={historyRange === "3m"} onclick={() => (historyRange = "3m")}>3M</button>
        <button class:active={historyRange === "6m"} onclick={() => (historyRange = "6m")}>6M</button>
        <button class:active={historyRange === "all"} onclick={() => (historyRange = "all")}>All</button>
      </div>
      <div class="chart" aria-label={`Progression chart for ${selectedExercise.name}`}>
        {#if chartPoints}
          <div class="chart-plot">
            <div class="chart-axis" aria-hidden="true">{#each chartAxisLabels as axis}<span>{axis.label}</span>{/each}</div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
              <line x1="0" y1="10" x2="100" y2="10" /><line x1="0" y1="50" x2="100" y2="50" /><line x1="0" y1="90" x2="100" y2="90" />
              <polyline points={chartPoints} />
              {#each selectedRecords as record, index}
                {@const [x, y] = chartPoints.split(" ")[index].split(",")}
                {#if record.completedSets > 0}
                  <circle
                    class:complete-point={record.completedSets >= record.sets}
                    class:partial-point={record.completedSets < record.sets}
                    cx={x}
                    cy={y}
                    r="1.8"><title>{formatDate(record.finishedAt)}: {amountLabel(record.amount, record.unit)}</title></circle
                  >
                {/if}
              {/each}
            </svg>
          </div>
          <div class="chart-labels">
            <span>{formatDate(selectedRecords[0].finishedAt)}</span><span>{formatDate(selectedRecords.at(-1).finishedAt)}</span>
          </div>
          <div class="chart-legend">
            <span><i class="legend-dot complete-point"></i>All sets completed</span><span
              ><i class="legend-dot partial-point"></i>Some sets completed</span
            ><span><i class="legend-line"></i>No sets completed</span>
          </div>
        {:else}<p>No saved progression data in this range.</p>{/if}
      </div>
    </section>
  {:else}
    <section class="exercise-list-view" transition:fade={{ duration: 250 }}>
      <h2>Exercise progression</h2>
      <p>Track routine values across all saved sessions, including exercises no longer in a routine.</p>
      <input class="exercise-search" type="search" bind:value={search} placeholder="Search exercises…" aria-label="Search exercises" />
      <div class="exercise-filters" role="tablist" aria-label="Exercise visibility filter">
        <button class:active={exerciseFilter === "visible"} onclick={() => (exerciseFilter = "visible")}>Visible</button>
        <button class:active={exerciseFilter === "hidden"} onclick={() => (exerciseFilter = "hidden")}
          >Hidden ({exercises.filter((exercise) => hiddenExerciseNames.has(exercise.name)).length})</button
        >
      </div>
      {#if $statisticsStore.loading}<p class="empty">Loading exercises…</p>
      {:else if filteredExercises.length === 0}<p class="empty">{exerciseFilter === "hidden" ? "No hidden exercises." : "No matching exercises."}</p>
      {:else}
        <div class="exercise-list">
          {#each filteredExercises as exercise (exercise.name)}
            <article class="exercise-item">
              <button class="exercise-select" onclick={() => (selectedExercise = exercise)}
                ><span><strong>{exercise.name}</strong><small>{exercise.sessions} {exercise.sessions === 1 ? "session" : "sessions"}</small></span
                ><span class="material-icons">chevron_right</span></button
              >
              <button
                class="item-visibility"
                onclick={() => setExerciseVisibility(exercise.name, exerciseFilter === "hidden")}
                title={exerciseFilter === "hidden" ? "Show exercise" : "Hide exercise"}
                ><span class="material-icons">{exerciseFilter === "hidden" ? "visibility" : "visibility_off"}</span></button
              >
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</section>

<style>
  .statistics-view {
    max-width: 900px;
    margin: 0 auto;
  }
  .stats-tabs,
  .exercise-filters {
    display: flex;
    gap: var(--spacing-sm);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--spacing-lg);
  }
  .stats-tabs button,
  .exercise-filters button {
    color: var(--text-secondary);
    background: transparent;
    border-radius: 0;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  .stats-tabs button.active,
  .exercise-filters button.active {
    color: var(--color-accent-primary);
    border-bottom: 2px solid var(--color-accent-primary);
  }
  .session-list {
    display: grid;
    gap: var(--spacing-md);
  }
  .sessions-title {
    margin: 0 0 var(--spacing-md);
  }
  .summary-header,
  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }
  .summary-header h2,
  .weekly-chart h3,
  .training-calendar h3 {
    margin: 0;
  }
  .summary-range {
    display: flex;
    gap: 2px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .summary-range button {
    color: var(--text-secondary);
    background: transparent;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 0;
    font-size: var(--font-size-xs);
  }
  .summary-range button.active {
    color: var(--bg-dark);
    background: var(--color-accent-primary);
  }
  .summary-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
  }
  .summary-metrics div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--spacing-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }
  .summary-metrics strong {
    font-size: var(--font-size-xl);
  }
  .summary-metrics span {
    font-size: var(--font-size-sm);
  }
  .summary-metrics small {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .weekly-chart,
  .training-calendar {
    margin-top: var(--spacing-xl);
    padding: var(--spacing-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }
  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);
  }
  .activity-zoom {
    display: flex;
    gap: 2px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .activity-zoom button,
  .activity-pagination button {
    color: var(--text-secondary);
    background: transparent;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: 0;
    font-size: var(--font-size-xs);
  }
  .activity-zoom button.active {
    color: var(--bg-dark);
    background: var(--color-accent-primary);
  }
  .activity-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-md);
    margin: var(--spacing-sm) 0;
  }
  .activity-pagination button {
    padding: 0;
    color: var(--text-primary);
  }
  .activity-pagination .current-year {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
  }
  .bar-chart {
    display: flex;
    align-items: end;
    gap: var(--spacing-xs);
    min-height: 280px;
    margin-top: var(--spacing-md);
    overflow-x: auto;
  }
  .bar-column {
    display: grid;
    grid-template-rows: 20px 1fr 62px;
    flex: 1 0 32px;
    min-width: 32px;
    height: 260px;
    text-align: center;
  }
  .bar-column > span,
  .bar-column small {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .bar-column small {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    justify-self: center;
    white-space: nowrap;
  }
  .bar-column i {
    align-self: end;
    display: block;
    background: linear-gradient(180deg, var(--color-accent-primary), var(--color-medium-blue));
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    min-height: 2px;
  }
  .calendar-header > div {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
  }
  .calendar-header button {
    padding: 0;
    color: var(--text-primary);
    background: transparent;
  }
  .calendar-weekdays,
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-xs);
  }
  .calendar-weekdays {
    margin-bottom: var(--spacing-xs);
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .calendar-grid > div {
    aspect-ratio: 1;
    min-height: 36px;
    padding: 3px;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .calendar-grid .active-day {
    color: var(--bg-dark);
    background: rgba(0, 255, 136, 0.65);
  }
  .calendar-grid .busy-day {
    background: var(--color-success);
  }
  .calendar-grid small {
    display: block;
    font-weight: 700;
  }
  .calendar-blank {
    visibility: hidden;
  }
  .session-filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    align-items: end;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }
  .session-filters label,
  .custom-date-range label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .session-filters select {
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  .clear-filters {
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid var(--border-color);
    padding: var(--spacing-xs) var(--spacing-sm);
    white-space: nowrap;
  }
  .month-navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    margin: var(--spacing-sm) 0 var(--spacing-md);
  }
  .month-navigation button {
    padding: 0;
    color: var(--text-primary);
    background: transparent;
  }
  .custom-date-range {
    display: flex;
    gap: var(--spacing-sm);
    margin: var(--spacing-sm) 0 var(--spacing-md);
  }
  .custom-date-range input {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  .filtered-empty {
    min-height: 160px;
  }
  .empty {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .empty h3,
  .empty p {
    margin: var(--spacing-xs);
  }
  .empty .material-icons {
    font-size: 3rem;
    color: var(--color-accent-primary);
  }
  .exercise-list-view > h2,
  .exercise-detail h2 {
    margin: 0;
  }
  .exercise-list-view > p,
  .exercise-detail header p {
    margin: var(--spacing-xs) 0 var(--spacing-md);
  }
  .exercise-search {
    width: 100%;
    margin-bottom: var(--spacing-md);
  }
  .exercise-filters {
    margin-bottom: var(--spacing-sm);
  }
  .exercise-list {
    border-top: 1px solid var(--border-color);
  }
  .exercise-item {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--border-color);
  }
  .exercise-select {
    flex: 1;
    justify-content: space-between;
    text-align: left;
    color: var(--text-primary);
    background: transparent;
    padding: var(--spacing-md) 0;
  }
  .exercise-select span:first-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .exercise-select small {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  .item-visibility,
  .visibility-button,
  .back-button {
    background: transparent;
    color: var(--text-secondary);
  }
  .item-visibility {
    padding: var(--spacing-sm);
  }
  .item-visibility:hover,
  .visibility-button:hover,
  .back-button:hover {
    color: var(--color-accent-primary);
    box-shadow: none;
  }
  .back-button {
    padding: 0;
    margin-bottom: var(--spacing-md);
  }
  .exercise-detail header {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
  .visibility-button {
    border: 1px solid var(--border-color);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  .progress-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
    margin: var(--spacing-md) 0;
  }
  .progress-summary div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
  }
  .progress-summary span {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .progress-summary strong {
    font-size: var(--font-size-lg);
  }
  .history-ranges {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-sm);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
  }
  .history-ranges button {
    flex: 1;
    color: var(--text-secondary);
    background: transparent;
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  .history-ranges button.active {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }
  .chart {
    --chart-plot-height: 340px;
    min-height: 390px;
    padding: var(--spacing-md);
    padding-left: var(--spacing-xs);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }
  .chart-plot { display: flex; gap: var(--spacing-sm); }
  .chart-axis { display: flex; flex: 0 0 3rem; flex-direction: column; justify-content: space-between; height: var(--chart-plot-height); padding: 3% 0; color: var(--text-secondary); font-size: var(--font-size-xs); text-align: right; white-space: nowrap; }
  .chart svg {
    flex: 1;
    width: 0;
    height: var(--chart-plot-height);
    overflow: visible;
  }
  .chart line {
    stroke: var(--border-color);
    stroke-dasharray: 2 2;
    vector-effect: non-scaling-stroke;
  }
  .chart polyline {
    fill: none;
    stroke: var(--color-accent-primary);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .chart circle {
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .chart .complete-point {
    fill: var(--color-accent-primary);
    stroke: var(--bg-secondary);
  }
  .chart .partial-point {
    fill: var(--bg-secondary);
    stroke: var(--color-accent-primary);
  }
  .chart-labels {
    display: flex;
    justify-content: space-between;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-left: calc(3rem + var(--spacing-sm));
  }
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .chart-legend span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .legend-dot,
  .legend-line {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .legend-dot.complete-point {
    background: var(--color-accent-primary);
  }
  .legend-dot.partial-point {
    border: 1px solid var(--color-accent-primary);
  }
  .legend-line {
    width: 10px;
    height: 1px;
    border-radius: 0;
    background: var(--color-accent-primary);
  }
  @media (max-width: 560px) {
    .summary-header,
    .calendar-header {
      align-items: flex-start;
      flex-direction: column;
    }
    .summary-metrics {
      gap: var(--spacing-sm);
    }
    .session-filters {
      grid-template-columns: 1fr 1fr;
    }
    .stats-tabs button {
      font-size: var(--font-size-sm);
      padding-inline: var(--spacing-sm);
    }
    .exercise-detail header {
      flex-direction: column;
    }
    .progress-summary {
      grid-template-columns: 1fr;
    }
    .chart {
      min-height: 330px;
      --chart-plot-height: 280px;
    }
    .chart svg {
      height: var(--chart-plot-height);
    }
  }
</style>
