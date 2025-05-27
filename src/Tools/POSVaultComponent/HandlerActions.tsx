/** @jsxImportSource preact */
import { CountBadge, extractDateFromText, extractTimeFromText, getTodayISO, getWorkInProgressFolders, getExcludedFolderQuery, notCompletedOrCancelled, notArchivedOrHandled } from "../DcUtils";

interface HandlerActionsProps {
  dc: any;
  app: any;
  date?: string;
}

/**
 * HandlerActions: Shows the number of available handled actions (late, timed, due, scheduled)
 * in files that are handled by the current file.
 */
export const HandlerActions = ({ dc, app, date }: HandlerActionsProps) => {
  const today = date || getTodayISO();
  const currentFile = dc.useCurrentFile && dc.useCurrentFile();
  if (!currentFile) return null;

  // 1. Find all files with any 'Handled By' (case-insensitive) frontmatter
  const handledFilesRaw = dc.useQuery(`@page and $frontmatter.contains("handled by")`);

  // 2. Filter for those where value.path === currentFile.$path
  const handledFiles = handledFilesRaw.filter((file: any) => {
    const fm = file.$frontmatter;
    if (!fm) return false;
    // Try all possible case variants
    const key = Object.keys(fm).find(k => k.toLowerCase() === "handled by");
    if (!key) return false;
    const value = fm[key]?.value;
    // value can be an array or object
    if (Array.isArray(value)) {
      return value.some((v: any) => v?.path === currentFile.$path);
    } else if (value && typeof value === 'object' && value.path) {
      return value.path === currentFile.$path;
    }
    return false;
  });

  if (!handledFiles.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4 }}>Handled Actions</div>
        <CountBadge count={0} />
      </div>
    );
  }

  // 3. For each handled file, get all tasks (not completed/cancelled)
  let availableActions = 0;
  handledFiles.forEach((file: any) => {
    const tasks = dc.useQuery(`@task and $file="${file.$path}" and ${notCompletedOrCancelled}`);
    tasks.forEach((task: any) => {
      // Late: due or scheduled before today
      const due = extractDateFromText(task.$text, '📅');
      const scheduled = extractDateFromText(task.$text, '⏳');
      const hasTime = !!extractTimeFromText(task.$text);
      // Timed: due or scheduled today with time
      const isTimed = (hasTime && ((due === today) || (scheduled === today)));
      // Due: due today (no time)
      const isDue = (due === today && !hasTime);
      // Scheduled: scheduled today (no time, not due today)
      const isScheduled = (scheduled === today && due !== today && !hasTime);
      // Late: due or scheduled before today
      const isLate = (due && due < today) || (scheduled && scheduled < today);
      if (isLate || isTimed || isDue || isScheduled) {
        availableActions++;
      }
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4 }}>Handled Actions</div>
      <CountBadge count={availableActions} />
    </div>
  );
};
