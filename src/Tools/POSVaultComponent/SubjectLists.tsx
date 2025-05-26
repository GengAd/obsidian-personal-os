/** @jsxImportSource preact */
import { notCompletedOrCancelled, notArchivedOrHandled, getTodayISO, extractDateFromText, extractTimeFromText, getWorkInProgressFolders, getExcludedFolderQuery, getDateRangeFromDurations, getPageExcludedFolderQuery, getPageFolderQuery } from "../DcUtils";

interface ListProps {
  date?: string; // ISO date string
  dc: any; // Datacore instance
  app: any; // Obsidian app instance
}

function getLinkProps(file: any) {
  // Traverse up the $parent chain to find $frontmatter
  let current = file;
  while (current && !current.$frontmatter && current.$parent) {
    current = current.$parent;
  }
  let linkClass = '';
  if (current && current.$frontmatter?.class) {
    linkClass = current.$frontmatter.class.raw
      ?? current.$frontmatter.class.value
      ?? current.$frontmatter.class;
  }
  const linkTags = current && current.$frontmatter?.tags?.value
    ? Array.isArray(current.$frontmatter.tags.value)
      ? current.$frontmatter.tags.value.join(',')
      : current.$frontmatter.tags.value
    : '';
  return {
    href: file.$file || file,
    className: 'internal-link data-link-icon data-link-icon-after data-link-text',
    'data-href': file.$file || file,
    'data-type': 'file',
    'data-link-path': file.$file || file,
    'data-link-class': linkClass,
    'data-link-tags': linkTags,
    target: '_blank',
    rel: 'noopener nofollow',
    style: {
      '--data-link-Class': linkClass,
      '--data-link-path': file.$file || file,
    } as any,
    onClick: (e: any) => {
      // Only override click on desktop (no touch events)
      if (!(typeof window !== 'undefined' && 'ontouchstart' in window)) {
        e.preventDefault();
        e.stopPropagation();
        if (file.$file) {
          file.app?.workspace?.openLinkText
            ? file.app.workspace.openLinkText(file.$file, '', false)
            : file.app?.workspace?.openLinkText?.(file.$file, '', false);
        } else if (file && file.app?.workspace?.openLinkText) {
          file.app.workspace.openLinkText(file, '', false);
        }
      }
    },
  };
}

function PageLinkCard({ file, app, dc }: { file: any, app: any, dc: any }) {
  // Extract file name from path
  const fileName = file.$file?.split('/').pop()?.replace(/\.md$/, '') || file.$file;
  const linkProps = getLinkProps({ ...file, app });
  return (
    <div
      style={{
        background: 'var(--background-primary)',
        borderRadius: '10px',
        border: '1px solid var(--background-modifier-border)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
      onClick={() => app.workspace.openLinkText(file.$file, '', false)}
    >
      <a {...linkProps}>{fileName}</a>
    </div>
  );
}

// Priority mapping and helpers
const PRIORITY_ORDER = ['very high', 'high', 'normal', 'low', 'lowest'];
const PRIORITY_SYMBOLS: Record<string, string> = {
  'very high': '🔺',
  'high': '⏫',
  'normal': '',
  'low': '🔽',
  'lowest': '⏬',
};
function getPrioritySymbol(priority: string) {
  return PRIORITY_SYMBOLS[priority] ?? '';
}
function getPriorityValue(task: any) {
  // Extract priority from $text
  const text = (task.$text || '').toLowerCase();
  if (text.includes('‼️') || text.includes('🔺')) return 'very high';
  if (text.includes('!') || text.includes('⏫')) return 'high';
  if (text.includes('↓↓') || text.includes('⏬')) return 'lowest';
  if (text.includes('↓') || text.includes('🔽')) return 'low';
  return 'normal';
}
function comparePriority(a: string, b: string) {
  return PRIORITY_ORDER.indexOf(a) - PRIORITY_ORDER.indexOf(b);
}

// 1. TimedList: Pages with a timed task for the date
export const TimedList = ({ date, dc, app }: ListProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  if (!folders.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No work-in-progress folders found.</dc.Text>;
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  const timedTasks = tasks.filter((t: any) => {
    const hasTime = !!extractTimeFromText(t.$text);
    const due = extractDateFromText(t.$text, '📅');
    const scheduled = extractDateFromText(t.$text, '⏳');
    return hasTime && (due === day || scheduled === day);
  });
  // Group by $file and find earliest time per file
  const fileToEarliest: Record<string, { task: any, time: string }> = {};
  for (const t of timedTasks) {
    const time = extractTimeFromText(t.$text);
    if (!time) continue;
    if (!fileToEarliest[t.$file] || time < fileToEarliest[t.$file].time) {
      fileToEarliest[t.$file] = { task: t, time };
    }
  }
  // Sort by time (earliest first)
  const sorted = Object.values(fileToEarliest).sort((a, b) => a.time.localeCompare(b.time));
  if (!sorted.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No timed actions for this date.</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {sorted.map(({ task, time }) => (
        <div
          key={task.$file}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onClick={() => app.workspace.openLinkText(task.$file, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-normal)', fontSize: '1.1em', marginRight: 8 }}>⌚{time}</span>
          <a {...getLinkProps({ ...task, app })}>
            {task.$file?.split('/').pop()?.replace(/\.md$/, '') || task.$file}
          </a>
        </div>
      ))}
    </dc.Stack>
  );
};

// 2. DueList: Pages with a due task for the date (no time)
export const DueList = ({ date, dc, app }: ListProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  if (!folders.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No work-in-progress folders found.</dc.Text>;
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  const dueTasks = tasks.filter((t: any) => extractDateFromText(t.$text, '📅') === day && !extractTimeFromText(t.$text));
  // Group by $file, find highest priority per file
  const fileToBest: Record<string, { task: any, priority: string }> = {};
  for (const t of dueTasks) {
    const priority = getPriorityValue(t);
    if (!fileToBest[t.$file] || comparePriority(priority, fileToBest[t.$file].priority) < 0) {
      fileToBest[t.$file] = { task: t, priority };
    }
  }
  // Sort by priority (very high > high > normal > low > lowest)
  const sorted = Object.values(fileToBest).sort((a, b) => comparePriority(a.priority, b.priority));
  if (!sorted.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No due actions for this date.</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {sorted.map(({ task, priority }) => (
        <div
          key={task.$file}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            justifyContent: 'space-between',
          }}
          onClick={() => app.workspace.openLinkText(task.$file, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-normal)', fontSize: '1.1em', marginRight: 8 }}>📅</span>
          <a {...getLinkProps({ ...task, app })}>
            {task.$file?.split('/').pop()?.replace(/\.md$/, '') || task.$file}
          </a>
          <span style={{ marginLeft: 'auto', fontSize: '1.3em', fontWeight: 700, color: 'var(--text-accent)' }}>{getPrioritySymbol(priority)}</span>
        </div>
      ))}
    </dc.Stack>
  );
};

// 3. ScheduledList: Pages with a scheduled task for the date (no time, not due same day)
export const ScheduledList = ({ date, dc, app }: ListProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  if (!folders.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No work-in-progress folders found.</dc.Text>;
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  const scheduledTasks = tasks.filter((t: any) =>
    extractDateFromText(t.$text, '⏳') === day &&
    extractDateFromText(t.$text, '📅') !== day &&
    !extractTimeFromText(t.$text)
  );
  // Group by $file, find highest priority per file
  const fileToBest: Record<string, { task: any, priority: string }> = {};
  for (const t of scheduledTasks) {
    const priority = getPriorityValue(t);
    if (!fileToBest[t.$file] || comparePriority(priority, fileToBest[t.$file].priority) < 0) {
      fileToBest[t.$file] = { task: t, priority };
    }
  }
  // Sort by priority (very high > high > normal > low > lowest)
  const sorted = Object.values(fileToBest).sort((a, b) => comparePriority(a.priority, b.priority));
  if (!sorted.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No scheduled actions for this date.</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {sorted.map(({ task, priority }) => (
        <div
          key={task.$file}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            justifyContent: 'space-between',
          }}
          onClick={() => app.workspace.openLinkText(task.$file, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-normal)', fontSize: '1.1em', marginRight: 8 }}>⏳</span>
          <a {...getLinkProps({ ...task, app })}>
            {task.$file?.split('/').pop()?.replace(/\.md$/, '') || task.$file}
          </a>
          <span style={{ marginLeft: 'auto', fontSize: '1.3em', fontWeight: 700, color: 'var(--text-accent)' }}>{getPrioritySymbol(priority)}</span>
        </div>
      ))}
    </dc.Stack>
  );
};

// 4. NextList: Pages considered "Next" (see IsNextPage logic)
export const NextList = ({ date, dc, app }: ListProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  if (!folders.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No work-in-progress folders found.</dc.Text>;
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  // Group tasks by $file (page)
  const tasksByFile: Record<string, any[]> = {};
  for (const t of tasks) {
    if (!tasksByFile[t.$file]) tasksByFile[t.$file] = [];
    tasksByFile[t.$file].push(t);
  }
  const isSameOrBefore = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr <= day;
  };
  // 1. Collect future-due-only pages (due > today, no start, no scheduled)
  const futureDuePages: { file: string, due: string, task: any }[] = [];
  for (const file in tasksByFile) {
    const pageTasks = tasksByFile[file];
    // Find the earliest such due date for this file
    let minDue: string | null = null;
    let minTask: any = null;
    for (const t of pageTasks) {
      const start = extractDateFromText(t.$text, '🛫');
      const scheduled = extractDateFromText(t.$text, '⏳');
      const due = extractDateFromText(t.$text, '📅');
      if (due && due > day && !start && !scheduled) {
        if (!minDue || due < minDue) {
          minDue = due;
          minTask = t;
        }
      }
    }
    if (minDue && minTask) {
      futureDuePages.push({ file, due: minDue, task: minTask });
    }
  }
  // Sort by due date ascending
  futureDuePages.sort((a, b) => a.due.localeCompare(b.due));
  // Track files already included
  const includedFiles = new Set(futureDuePages.map(f => f.file));
  // 2. Existing logic for other "next" pages
  const nextPages: any[] = [];
  for (const file in tasksByFile) {
    if (includedFiles.has(file)) continue; // skip already included
    const pageTasks = tasksByFile[file];
    // 1. Primary: any task with start <= today and no scheduled, and not due today
    const hasNext = pageTasks.some(t => {
      const start = extractDateFromText(t.$text, '🛫');
      const scheduled = extractDateFromText(t.$text, '⏳');
      const due = extractDateFromText(t.$text, '📅');
      return start && isSameOrBefore(start) && !scheduled && due !== day;
    });
    if (hasNext) {
      nextPages.push(pageTasks[0]);
      continue;
    }
    // 2. Fallback: no not completed/cancelled task with start, due, or scheduled
    const hasSpecial = pageTasks.some(t =>
      extractDateFromText(t.$text, '🛫') ||
      extractDateFromText(t.$text, '📅') ||
      extractDateFromText(t.$text, '⏳')
    );
    if (!hasSpecial && pageTasks.length > 0) {
      nextPages.push(pageTasks[0]);
    }
  }
  // Render: future-due-only first, then others
  if (!futureDuePages.length && !nextPages.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No next actions found.</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {futureDuePages.map(({ task, due }) => (
        <div
          key={task.$file + due}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onClick={() => app.workspace.openLinkText(task.$file, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-normal)', fontSize: '1.1em', marginRight: 8 }}>📅{due}</span>
          <a {...getLinkProps({ ...task, app })}>
            {task.$file?.split('/').pop()?.replace(/\.md$/, '') || task.$file}
          </a>
        </div>
      ))}
      {nextPages.map((t: any) => (
        <PageLinkCard key={t.$file} file={t} app={app} dc={dc} />
      ))}
    </dc.Stack>
  );
};

// 5. HandledList: Pages with a completed task for the date (global, not filtered by folders)
export const HandledList = ({ date, dc, app }: ListProps) => {
  const day = date || getTodayISO();
  const query = `@task and $text.contains("${day}") and $completed = true`;
  const tasks = dc.useQuery(query);
  const handledTasks = tasks.filter((t: any) => extractDateFromText(t.$text, '✅') === day);
  // Group by $file and count tasks per file
  const fileToTasks: Record<string, any[]> = {};
  for (const t of handledTasks) {
    if (!fileToTasks[t.$file]) fileToTasks[t.$file] = [];
    fileToTasks[t.$file].push(t);
  }
  const sorted = Object.entries(fileToTasks)
    .map(([file, tasks]) => ({ file, count: tasks.length }))
    .sort((a, b) => a.file.localeCompare(b.file));
  if (!sorted.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No handled subjects for this date.</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {sorted.map(({ file, count }) => (
        <div
          key={file}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onClick={() => app.workspace.openLinkText(file, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-success)', fontSize: '1.1em', marginRight: 8 }}>{count}✅</span>
          <a {...getLinkProps({ $file: file, app })}>
            {file?.split('/').pop()?.replace(/\.md$/, '') || file}
          </a>
        </div>
      ))}
    </dc.Stack>
  );
};

// 6. FutureList: Pages with tasks that will become available in a future period
interface FutureListProps {
  from: string; // e.g. '7d'
  to: string;   // e.g. '30d'
  dc: any;
  app: any;
}

export const FutureList = ({ from, to, dc, app }: FutureListProps) => {
  const folders = getWorkInProgressFolders(app);
  if (!folders.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No work-in-progress folders found.</dc.Text>;
  const folderQuery = getExcludedFolderQuery(folders);
  const { start, end } = getDateRangeFromDurations(from, to);
  // Query all not completed/cancelled tasks in WIP folders
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  // Filter for tasks that become available in the window (scheduled or start only)
  const inRange = (date: string | null) => date && date >= start && date < end;
  // For each file, find the earliest available scheduled/start date in range, and show due if present
  type FileDateInfo = { task: any, date: string, type: string, symbol: string, due?: string };
  const fileToEarliest: Record<string, FileDateInfo> = {};
  for (const t of tasks) {
    const scheduled = extractDateFromText(t.$text, '⏳');
    const startDate = extractDateFromText(t.$text, '🛫');
    const due = extractDateFromText(t.$text, '📅') || undefined;
    let best: FileDateInfo | null = null;
    if (scheduled && inRange(scheduled)) {
      best = { task: t, date: scheduled, type: 'scheduled', symbol: '⏳', due };
    } else if (startDate && inRange(startDate)) {
      best = { task: t, date: startDate, type: 'start', symbol: '🛫', due };
    }
    if (best) {
      if (!fileToEarliest[t.$file] || best.date < fileToEarliest[t.$file].date || (best.date === fileToEarliest[t.$file].date && best.type === 'scheduled')) {
        fileToEarliest[t.$file] = best;
      }
    }
  }
  // Sort by date, then by type priority (⏳ > 🛫)
  const typePriority = (type: string) => (type === 'scheduled' ? 0 : 1);
  const sorted = Object.values(fileToEarliest).sort((a, b) => a.date.localeCompare(b.date) || typePriority(a.type) - typePriority(b.type));
  if (!sorted.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No future actions in this range.</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {sorted.map(({ task, date, symbol, due }) => (
        <div
          key={task.$file}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onClick={() => app.workspace.openLinkText(task.$file, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-normal)', fontSize: '1.1em', marginRight: 8 }}>{symbol}{date}{due && due !== date ? <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.95em' }}>📅{due}</span> : null}</span>
          <a {...getLinkProps({ ...task, app })}>
            {task.$file?.split('/').pop()?.replace(/\.md$/, '') || task.$file}
          </a>
        </div>
      ))}
    </dc.Stack>
  );
};

// 7. LateList: Pages with late (overdue) tasks (due or scheduled date in the past)
export const LateList = ({ dc, app }: { dc: any, app: any }) => {
  const today = getTodayISO();
  const folders = getWorkInProgressFolders(app);
  if (!folders.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No work-in-progress folders found.</dc.Text>;
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  // For each file, find the earliest late date (due or scheduled before today), and the type (📅 > ⏳)
  const DATE_TYPES = [
    { key: 'due', symbol: '📅', extract: (t: any) => extractDateFromText(t.$text, '📅') },
    { key: 'scheduled', symbol: '⏳', extract: (t: any) => extractDateFromText(t.$text, '⏳') },
  ];
  type FileDateInfo = { task: any, date: string, type: string, symbol: string };
  const fileToEarliest: Record<string, FileDateInfo> = {};
  for (const t of tasks) {
    const found: { date: string, type: string, symbol: string }[] = [];
    for (const { key, symbol, extract } of DATE_TYPES) {
      const d = extract(t);
      if (d && d < today) found.push({ date: d, type: key, symbol });
    }
    if (found.length) {
      found.sort((a, b) => a.date.localeCompare(b.date));
      const earliestDate = found[0].date;
      // Among all with that date, pick the highest priority type
      const best = DATE_TYPES.map(dt => found.find(f => f.date === earliestDate && f.type === dt.key)).find(Boolean);
      if (best) {
        if (!fileToEarliest[t.$file] || best.date < fileToEarliest[t.$file].date || (best.date === fileToEarliest[t.$file].date && DATE_TYPES.findIndex(dt => dt.key === best.type) < DATE_TYPES.findIndex(dt => dt.key === fileToEarliest[t.$file].type))) {
          fileToEarliest[t.$file] = { task: t, date: best.date, type: best.type, symbol: best.symbol };
        }
      }
    }
  }
  // Sort by date, then by type priority (📅 > ⏳)
  const typePriority = (type: string) => DATE_TYPES.findIndex(dt => dt.key === type);
  const sorted = Object.values(fileToEarliest).sort((a, b) => a.date.localeCompare(b.date) || typePriority(a.type) - typePriority(b.type));
  if (!sorted.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-success)' }}>No late actions!</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {sorted.map(({ task, date, symbol }) => (
        <div
          key={task.$file}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onClick={() => app.workspace.openLinkText(task.$file, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-error)', fontSize: '1.1em', marginRight: 8 }}>{symbol}{date}</span>
          <a {...getLinkProps({ ...task, app })}>
            {task.$file?.split('/').pop()?.replace(/\.md$/, '') || task.$file}
          </a>
        </div>
      ))}
    </dc.Stack>
  );
};

// 8. ToProcessList: Pages considered 'To Process' (see requirements)
export const ToProcessList = ({ dc, app }: { dc: any, app: any }) => {
  // --- Folder setup ---
  const pos = (app as any).plugins.plugins["personal-os"];
  const workInProgressFolders = Array.isArray(pos?.graph?.officePages) ? pos.graph.officePages : [];
  const instrumentalFolders = Array.isArray(pos?.settings?.instrumentalFolders) ? pos.settings.instrumentalFolders : [];
  // Inbox: if defined, otherwise fallback to WIP
  const inboxFolders = Array.isArray(pos?.settings?.inboxPages) && pos.settings.inboxPages.length > 0
    ? pos.settings.inboxPages : workInProgressFolders;

  // --- 1. Late: Pages in WIP with overdue tasks ---
  const today = getTodayISO();
  let lateFiles: Record<string, { date: string, symbol: string }> = {};
  if (workInProgressFolders.length) {
    const folderQuery = getExcludedFolderQuery(workInProgressFolders);
    const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
    const tasks = dc.useQuery(query);
    for (const t of tasks) {
      const due = extractDateFromText(t.$text, '📅');
      const scheduled = extractDateFromText(t.$text, '⏳');
      let best: { date: string, symbol: string } | null = null;
      if (due && due < today) best = { date: due, symbol: '📅' };
      else if (scheduled && scheduled < today) best = { date: scheduled, symbol: '⏳' };
      if (best) {
        if (!lateFiles[t.$file] || best.date < lateFiles[t.$file].date || (best.date === lateFiles[t.$file].date && best.symbol === '📅')) {
          lateFiles[t.$file] = best;
        }
      }
    }
  }

  // --- 2. InboxPage: Pages in Inbox folders ---
  let inboxFiles = new Set<string>();
  if (inboxFolders.length) {
    const folderQuery = getPageFolderQuery(inboxFolders);
    const query = `@page${folderQuery ? ` and ${folderQuery}` : ''}`;
    const pages = dc.useQuery(query);
    pages.forEach((p: any) => inboxFiles.add(p.$path));
  }

  // --- 3. OpenPageWithNoAction: Pages in WIP with no open tasks ---
  let openNoActionFiles = new Set<string>();
  if (workInProgressFolders.length) {
    const folderQuery = getPageExcludedFolderQuery(workInProgressFolders);
    // All non-archived, non-handled pages in WIP
    const pageQuery = `@page${folderQuery ? ` and ${folderQuery}` : ''} and ${notArchivedOrHandled}`;
    const pages = dc.useQuery(pageQuery);
    // All open tasks in WIP
    const taskFolderQuery = getExcludedFolderQuery(workInProgressFolders);
    const taskQuery = `@task and ${notCompletedOrCancelled}${taskFolderQuery ? ` and ${taskFolderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
    const tasks = dc.useQuery(taskQuery);
    const filesWithOpenTasks = new Set(tasks.map((t: any) => t.$file));
    pages.forEach((p: any) => {
      if (!filesWithOpenTasks.has(p.$path)) {
        openNoActionFiles.add(p.$path);
      }
    });
  }

  // --- 4. Instrumental with no supports/undermines ---
  let instrumentalNoSupportFiles = new Set<string>();
  if (instrumentalFolders.length) {
    const folderQuery = getPageFolderQuery(instrumentalFolders);
    const query = `@page${folderQuery ? ` and ${folderQuery}` : ''} and ${notArchivedOrHandled}`;
    const pages = dc.useQuery(query);
    pages.forEach((p: any) => {
      const hasSupports = p.$frontmatter?.supports?.value != null && p.$frontmatter.supports.value.length > 0;
      const hasUndermines = p.$frontmatter?.undermines?.value != null && p.$frontmatter.undermines.value.length > 0;
      if (!hasSupports && !hasUndermines) {
        instrumentalNoSupportFiles.add(p.$path);
      }
    });
  }

  // --- 5. Instrumental with action, not handled ---
  let instrumentalWithActionFiles = new Set<string>();
  if (instrumentalFolders.length) {
    const folderQuery = getPageFolderQuery(instrumentalFolders);
    // All non-archived, non-handled pages in instrumental
    const pageQuery = `@page${folderQuery ? ` and ${folderQuery}` : ''} and ${notArchivedOrHandled}`;
    const pages = dc.useQuery(pageQuery);
    // All open tasks in instrumental
    const taskFolderQuery = getExcludedFolderQuery(instrumentalFolders);
    const taskQuery = `@task and ${notCompletedOrCancelled}${taskFolderQuery ? ` and ${taskFolderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
    const tasks = dc.useQuery(taskQuery);
    const filesWithOpenTasks = new Set(tasks.map((t: any) => t.$file));
    pages.forEach((p: any) => {
      if (filesWithOpenTasks.has(p.$path)) {
        instrumentalWithActionFiles.add(p.$path);
      }
    });
  }

  // --- Deduplicate all files, assign category and info ---
  const fileToCategory: Record<string, { category: string, info: any }> = {};
  // 1. Late
  for (const file in lateFiles) {
    fileToCategory[file] = { category: 'late', info: lateFiles[file] };
  }
  // 2. Open no action
  for (const file of openNoActionFiles) {
    if (!fileToCategory[file]) fileToCategory[file] = { category: 'openNoAction', info: {} };
  }
  // 3. Instrumental no support
  for (const file of instrumentalNoSupportFiles) {
    if (!fileToCategory[file]) fileToCategory[file] = { category: 'instrumentalNoSupport', info: {} };
  }
  // 4. Instrumental with action
  for (const file of instrumentalWithActionFiles) {
    if (!fileToCategory[file]) fileToCategory[file] = { category: 'instrumentalWithAction', info: {} };
  }
  // 5. Inbox
  for (const file of inboxFiles) {
    if (!fileToCategory[file]) fileToCategory[file] = { category: 'inbox', info: {} };
  }

  // Order: late > openNoAction > instrumentalNoSupport > instrumentalWithAction > inbox
  const CATEGORY_ORDER = ['late', 'openNoAction', 'instrumentalNoSupport', 'instrumentalWithAction', 'inbox'];
  const CATEGORY_EMOJI: Record<string, string> = {
    late: '', // handled per file
    openNoAction: '📝',
    instrumentalNoSupport: '🧩',
    instrumentalWithAction: '🗂️',
    inbox: '📥',
  };
  const CATEGORY_MSG: Record<string, string> = {
    late: 'Re-schedule it',
    openNoAction: 'Add an action or archive it',
    instrumentalNoSupport: 'It should support or undermine another subject',
    instrumentalWithAction: 'Actions on non-active subjects should be handled by another subject',
    inbox: 'Process this inbox page',
  };
  const sorted = Object.entries(fileToCategory)
    .sort((a, b) => {
      const ca = CATEGORY_ORDER.indexOf(a[1].category);
      const cb = CATEGORY_ORDER.indexOf(b[1].category);
      if (ca !== cb) return ca - cb;
      // For late, order by date
      if (a[1].category === 'late' && b[1].category === 'late') {
        return a[1].info.date.localeCompare(b[1].info.date);
      }
      // Otherwise, alphabetical
      return a[0].localeCompare(b[0]);
    });
  if (!sorted.length) return <dc.Text style={{ textAlign: 'center', color: 'var(--text-success)' }}>No pages to process!</dc.Text>;
  return (
    <dc.Stack style={{ gap: '16px' }}>
      {sorted.map(([file, { category, info }]) => {
        let left = null;
        if (category === 'late') {
          left = <span style={{ fontWeight: 600, color: 'var(--text-error)', fontSize: '1.1em', marginRight: 8 }}>{info.symbol}{info.date}</span>;
        } else {
          left = <span style={{ fontWeight: 600, color: 'var(--text-normal)', fontSize: '1.1em', marginRight: 8 }}>{CATEGORY_EMOJI[category]}</span>;
        }
        return (
          <div
            key={file}
            style={{
              background: 'var(--background-primary)',
              borderRadius: '10px',
              border: '1px solid var(--background-modifier-border)',
              padding: '16px',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
            onClick={() => app.workspace.openLinkText(file, '', false)}
          >
            {left}
            <a {...getLinkProps({ $file: file, app })}>
              {file?.split('/').pop()?.replace(/\.md$/, '') || file}
            </a>
            <span style={{ color: 'var(--text-muted)', marginLeft: 12, fontSize: '1em' }}>{CATEGORY_MSG[category]}</span>
          </div>
        );
      })}
    </dc.Stack>
  );
};