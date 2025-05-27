// Datacore runtime provides `dc` globally. For TypeScript, declare it:
// (No longer needed, will use dc as a prop)
// React is not needed in Datacore components.

// NOTE: React import is not needed. JSX is supported by Datacore's runtime in Obsidian.
// All UI primitives must be from dc (Datacore), not React.

import { notCompletedOrCancelled, notArchivedOrHandled, getTodayISO, extractDateFromText, extractTimeFromText, getWorkInProgressFolders, getExcludedFolderQuery, CountBadge, HandledBadge, getDateRangeFromDurations, getPageExcludedFolderQuery, getPageFolderQuery } from "../DcUtils";

interface CountProps {
  date?: string; // ISO date string
  dc: any; // Datacore instance
  app: any; // Obsidian app instance
}

// 1. TimedCount: Pages with a timed task for the date
export const TimedCount = ({ date, dc, app }: CountProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  if (!folders.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Timed</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={0} />
      </span>
    </div>
  );
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  const timedTasks = tasks.filter((t: any) => {
    const hasTime = !!extractTimeFromText(t.$text);
    const due = extractDateFromText(t.$text, '📅');
    const scheduled = extractDateFromText(t.$text, '⏳');
    return hasTime && (due === day || scheduled === day);
  });
  const count = Number(new Set(timedTasks.map((t: any) => t.$file)).size);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Timed</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={count} />
      </span>
    </div>
  );
};

// 2. DueCount: Pages with a due task for the date (no time)
export const DueCount = ({ date, dc, app }: CountProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  if (!folders.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Due</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={0} />
      </span>
    </div>
  );
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  const dueTasks = tasks.filter((t: any) => extractDateFromText(t.$text, '📅') === day && !extractTimeFromText(t.$text));
  const count = Number(new Set(dueTasks.map((t: any) => t.$file)).size);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Due</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={count} />
      </span>
    </div>
  );
};

// 3. ScheduledCount: Pages with a scheduled task for the date (no time, not due same day)
export const ScheduledCount = ({ date, dc, app }: CountProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  if (!folders.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Scheduled</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={0} />
      </span>
    </div>
  );
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  const scheduledTasks = tasks.filter((t: any) =>
    extractDateFromText(t.$text, '⏳') === day &&
    extractDateFromText(t.$text, '📅') !== day &&
    !extractTimeFromText(t.$text)
  );
  const count = Number(new Set(scheduledTasks.map((t: any) => t.$file)).size);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Scheduled</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={count} />
      </span>
    </div>
  );
};

// 4. NextCount: Pages considered "Next" (see IsNextPage logic)
export const NextCount = ({ date, dc, app }: CountProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  if (!folders.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Next</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={0} />
      </span>
    </div>
  );
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

  let count = 0;
  for (const file in tasksByFile) {
    const pageTasks = tasksByFile[file];
    // 1. Primary: any task with start <= today and no scheduled, and not due today
    const hasNext = pageTasks.some(t => {
      const start = extractDateFromText(t.$text, '🛫');
      const scheduled = extractDateFromText(t.$text, '⏳');
      const due = extractDateFromText(t.$text, '📅');
      return start && isSameOrBefore(start) && !scheduled && due !== day;
    });
    if (hasNext) {
      count++;
      continue;
    }
    // 1b. New: any task with due > today, and no start, no scheduled
    const hasFutureDueOnly = pageTasks.some(t => {
      const start = extractDateFromText(t.$text, '🛫');
      const scheduled = extractDateFromText(t.$text, '⏳');
      const due = extractDateFromText(t.$text, '📅');
      return due && due > day && !start && !scheduled 
    });
    if (hasFutureDueOnly) {
      count++;
      continue;
    }
    // 2. Fallback: no not completed/cancelled task with start, due, or scheduled
    const hasSpecial = pageTasks.some(t =>
      extractDateFromText(t.$text, '🛫') ||
      extractDateFromText(t.$text, '📅') ||
      extractDateFromText(t.$text, '⏳')
    );
    if (!hasSpecial && pageTasks.length > 0) {
      count++;
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Next</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={count} />
      </span>
    </div>
  );
};

// 5. HandledCount: Pages with a completed task for the date (global, not filtered by folders)
export const HandledCount = ({ date, dc, app }: CountProps) => {
  const day = date || getTodayISO();
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  const query = `@task and $text.contains("${day}") and $completed = true`;
  const tasks = dc.useQuery(query);
  // Handled if any task contains a completed date (✅ YYYY-MM-DD) for the day
  const handledTasks = tasks.filter((t: any) => extractDateFromText(t.$text, '✅') === day);
  const count = Number(new Set(handledTasks.map((t: any) => t.$file)).size);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Handled</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <HandledBadge count={count} />
      </span>
    </div>
  );
};

// 6. FutureCount: Pages with tasks that will become available in a future period
interface FutureCountProps extends CountProps {
  from: string; // e.g. '7d'
  to: string;   // e.g. '30d'
  ceiling: number; // max allowed before warning/error
  label?: string; // small title above the badge
}

export const FutureCount = ({ from, to, ceiling, dc, app, label }: FutureCountProps) => {
  const folders = getWorkInProgressFolders(app);
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  const displayLabel = label || 'Future';
  if (!folders.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>{displayLabel}</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <span style={{ fontSize: '1.5em', fontWeight: 700 }}>0 / {ceiling}</span>
      </span>
    </div>
  );
  const folderQuery = getExcludedFolderQuery(folders);
  const { start, end } = getDateRangeFromDurations(from, to);
  // Query all not completed/cancelled tasks in WIP folders
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  // Filter for tasks that become available in the window
  const inRange = (date: string | null) => date && date >= start && date < end;
  const futureTasks = tasks.filter((t: any) => {
    const startDate = extractDateFromText(t.$text, '🛫');
    const scheduledDate = extractDateFromText(t.$text, '⏳');
    const dueDate = extractDateFromText(t.$text, '📅');
    // Rule 1: start in range, no schedule
    if (startDate && inRange(startDate) && !scheduledDate) return true;
    // Rule 2: schedule in range
    if (scheduledDate && inRange(scheduledDate)) return true;
    return false;
  });
  const count = Number(new Set(futureTasks.map((t: any) => t.$file)).size);
  // Color logic
  let color = 'var(--text-normal)';
  if (count >= ceiling) color = 'var(--text-error)';
  else if (ceiling - count < 10) color = 'var(--text-warning)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>{displayLabel}</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <span style={{ fontSize: '1.5em', fontWeight: 700, color }}>{count}</span>
        <span style={{ fontSize: '1.5em', fontWeight: 700, color }}> / {ceiling}</span>
      </span>
    </div>
  );
};

// 7. LateCount: Pages with late (overdue) tasks (due or scheduled date in the past)
export const LateCount = ({ dc, app }: CountProps) => {
  const today = getTodayISO();
  const folders = getWorkInProgressFolders(app);
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  if (!folders.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Late</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <CountBadge count={0} />
      </span>
    </div>
  );
  const folderQuery = getExcludedFolderQuery(folders);
  const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
  const tasks = dc.useQuery(query);
  // Filter for tasks with due or scheduled date before today
  const lateTasks = tasks.filter((t: any) => {
    const due = extractDateFromText(t.$text, '📅');
    const scheduled = extractDateFromText(t.$text, '⏳');
    // Only count if due or scheduled exists and is before today
    return (due && due < today) || (scheduled && scheduled < today);
  });
  const count = Number(new Set(lateTasks.map((t: any) => t.$file)).size);
  // Color: green if 0, error (red) if > 0
  const color = count === 0 ? 'var(--text-success)' : 'var(--text-error)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Late</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <h1
          style={{
            color,
            fontSize: '2.5em',
            margin: 0,
            fontWeight: 700,
            lineHeight: 1,
            display: 'inline-block',
            background: 'var(--background-secondary)',
            borderRadius: '1.5em',
            padding: '0.2em 0.8em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            border: `2px solid ${color}`,
            minWidth: '1.5em',
            textAlign: 'center',
          }}
        >
          {count}
        </h1>
      </span>
    </div>
  );
};

// 8. ToProcessCount: Pages considered 'To Process' (see requirements)
export const ToProcessCount = ({ dc, app }: CountProps) => {
  // --- Folder setup ---
  const pos = (app as any).plugins.plugins["personal-os"];
  const workInProgressFolders = Array.isArray(pos?.graph?.officePages) ? pos.graph.officePages : [];
  const instrumentalFolders = Array.isArray(pos?.settings?.instrumentalFolders) ? pos.settings.instrumentalFolders : [];
  // Inbox: if defined, otherwise fallback to WIP
  const inboxFolders = Array.isArray(pos?.settings?.inboxPages) && pos.settings.inboxPages.length > 0
    ? pos.settings.inboxPages : workInProgressFolders;

  // --- 1. Late: Pages in WIP with overdue tasks ---
  const today = getTodayISO();
  let lateFiles = new Set<string>();
  if (workInProgressFolders.length) {
    const folderQuery = getExcludedFolderQuery(workInProgressFolders);
    const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and childof(@page and ${notArchivedOrHandled})`;
    const tasks = dc.useQuery(query);
    tasks.forEach((t: any) => {
      const due = extractDateFromText(t.$text, '📅');
      const scheduled = extractDateFromText(t.$text, '⏳');
      if ((due && due < today) || (scheduled && scheduled < today)) {
        lateFiles.add(t.$file);
      }
    });
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

  // --- Deduplicate all files ---
  const allFiles = new Set([
    ...lateFiles,
    ...inboxFiles,
    ...openNoActionFiles,
    ...instrumentalNoSupportFiles,
    ...instrumentalWithActionFiles,
  ]);
  const count = allFiles.size;

  // --- UI ---
  const currentFile = dc.useCurrentFile();
  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };
  // Color: green if 0, warning if > 0
  const color = count === 0 ? 'var(--text-success)' : 'var(--text-warning)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>To Process</div>
      <span style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleOpenFile}>
        <h1
          style={{
            color,
            fontSize: '2.5em',
            margin: 0,
            fontWeight: 700,
            lineHeight: 1,
            display: 'inline-block',
            background: 'var(--background-secondary)',
            borderRadius: '1.5em',
            padding: '0.2em 0.8em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            border: `2px solid ${color}`,
            minWidth: '1.5em',
            textAlign: 'center',
          }}
        >
          {count}
        </h1>
      </span>
    </div>
  );
};
