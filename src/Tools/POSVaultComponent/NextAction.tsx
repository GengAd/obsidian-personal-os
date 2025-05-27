/** @jsxImportSource preact */
import { extractDateFromText, extractTimeFromText } from "../DcUtils";
import {
  finishTaskInMarkdown,
  parseRecurrence,
  getTodayISO,
  extractRecurrenceFromLine,
} from "../TaskUtils";
import { notCompletedOrCancelled } from "../DcUtils";

/**
 * NextAction component: Shows the next 2 actions for the current file, following Engage.ts logic.
 */
interface NextActionProps {
  dc: any;
  app: any;
}

const isToday = (dateStr: string | null) => {
  if (!dateStr) return false;
  try {
    const today = new Date();
    const d = new Date(dateStr);
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  } catch {
    return false;
  }
};

const isPastOrToday = (dateStr: string | null) => {
  if (!dateStr) return true;
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    return d <= today;
  } catch {
    return true;
  }
};

const getTime = (timeStr: string | null) => {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const [h, m] = parts.map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

export const NextAction = ({ dc, app }: NextActionProps) => {
  if (!dc || !app) return null;
  const currentFile = dc.useCurrentFile && dc.useCurrentFile();
  if (!currentFile) return <div>No file context.</div>;
  // Exclude completed and cancelled tasks
  const tasks = dc.useQuery ? dc.useQuery(`@task and $file="${currentFile.$path}" and ${notCompletedOrCancelled}`) : [];

  // Helper: get due/scheduled from text (SubjectLists.tsx style)
  const getDue = (task: any) => extractDateFromText(task?.$text || '', "📅");
  const getScheduled = (task: any) => extractDateFromText(task?.$text || '', "⏳");
  const getTimeStr = (task: any) => extractTimeFromText(task?.$text || '');

  // Mark task as completed and handle recurrence
  const handleComplete = async (task: any) => {
    try {
      if (app && app.vault && task?.$file && typeof task?.$line === 'number') {
        const file = app.vault.getAbstractFileByPath(task.$file);
        if (file) {
          const content = await app.vault.read(file);
          let lines = content.split('\n');
          // Mark as complete, add completed date, and regenerate recurrence if needed (handled in finishTaskInMarkdown)
          lines = finishTaskInMarkdown(lines, task.$line, getTodayISO());
          await app.vault.modify(file, lines.join('\n'));
          if (dc.refresh) dc.refresh();
          return;
        }
      }
      alert('Could not mark task as completed.');
    } catch (e) {
      alert('Error marking task as completed: ' + e);
    }
  };

  // Only show tasks that are not in the future (due/scheduled today or earlier, or no due/scheduled)
  const isNotFuture = (task: any) => {
    const due = getDue(task);
    const scheduled = getScheduled(task);
    return isPastOrToday(due) && isPastOrToday(scheduled);
  };

  // 1. Due today with time
  let dueWithTime = (tasks || []).filter((task: any) => {
    if (!isNotFuture(task)) return false;
    const due = getDue(task);
    const time = getTimeStr(task);
    return due && isToday(due) && !!time;
  }).sort((a: any, b: any) => {
    const ta = getTime(getTimeStr(a));
    const tb = getTime(getTimeStr(b));
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta - tb;
  });

  // 2. Due today (date only, no time)
  let dueTodayNoTime = (tasks || []).filter((task: any) => {
    if (!isNotFuture(task)) return false;
    const due = getDue(task);
    const time = getTimeStr(task);
    return due && isToday(due) && !time;
  });

  // 3. Scheduled today (no due)
  let scheduledToday = (tasks || []).filter((task: any) => {
    if (!isNotFuture(task)) return false;
    const scheduled = getScheduled(task);
    return scheduled && isToday(scheduled);
  });

  // 4. Future due dates (should be empty now, but keep for logic)
  let futureDue: any[] = [];

  // 5. Next Page (fallback: any remaining tasks)
  let nextPage = (tasks || []).filter((task: any) => isNotFuture(task));

  // Compose the next 2 actions by priority, dedupe by $id or object ref
  const seen = new Set();
  let nextActions = [] as any[];
  for (const t of [...dueWithTime, ...dueTodayNoTime, ...scheduledToday, ...futureDue, ...nextPage]) {
    const id = t?.$id || t;
    if (!seen.has(id)) {
      seen.add(id);
      nextActions.push(t);
      if (nextActions.length === 2) break;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Next Actions</div>
      {nextActions.length === 0 && <div>No next actions found for this file.</div>}
      {nextActions.map((task: any, idx: number) => (
        <div key={task?.$id || idx} style={{ display: 'flex', alignItems: 'center', margin: '8px 0', padding: '8px', border: '1px solid var(--background-modifier-border)', borderRadius: 6 }}>
          <input
            class="task-list-item-checkbox"
            type="checkbox"
            data-task=" "
            style={{ marginRight: 12 }}
            checked={false}
            onChange={() => handleComplete(task)}
          />
          <div style={{ flex: 1 }}>
            <div>{task?.$text || 'Untitled action'}</div>
            {getDue(task) && <div style={{ color: 'var(--text-muted)' }}>Due: {getDue(task)}</div>}
            {getScheduled(task) && <div style={{ color: 'var(--text-muted)' }}>Scheduled: {getScheduled(task)}</div>}
            {getTimeStr(task) && <div style={{ color: 'var(--text-muted)' }}>Time: {getTimeStr(task)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
