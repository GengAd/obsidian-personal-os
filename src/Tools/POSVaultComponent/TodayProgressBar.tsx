/** @jsxImportSource preact */
import { h } from "preact";
import { getTodayISO, getWorkInProgressFolders, getExcludedFolderQuery, notCompletedOrCancelled, notArchivedOrHandled, extractDateFromText, extractTimeFromText } from "../DcUtils";

interface TodayProgressBarProps {
  app: any;
  dc: any;
  date?: string;
}

export const TodayProgressBar = ({ app, dc, date }: TodayProgressBarProps) => {
  const day = date || getTodayISO();
  const folders = getWorkInProgressFolders(app);

  // Timed
  let timedPages = new Set<string>();
  if (folders.length) {
    const folderQuery = getExcludedFolderQuery(folders);
    const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
    const tasks = dc.useQuery(query);
    tasks.forEach((t: any) => {
      const hasTime = !!extractTimeFromText(t.$text);
      const due = extractDateFromText(t.$text, '📅');
      const scheduled = extractDateFromText(t.$text, '⏳');
      if (hasTime && (due === day || scheduled === day)) {
        timedPages.add(t.$file);
      }
    });
  }

  // Due
  let duePages = new Set<string>();
  if (folders.length) {
    const folderQuery = getExcludedFolderQuery(folders);
    const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
    const tasks = dc.useQuery(query);
    tasks.forEach((t: any) => {
      if (extractDateFromText(t.$text, '📅') === day && !extractTimeFromText(t.$text)) {
        duePages.add(t.$file);
      }
    });
  }

  // Scheduled
  let scheduledPages = new Set<string>();
  if (folders.length) {
    const folderQuery = getExcludedFolderQuery(folders);
    const query = `@task and ${notCompletedOrCancelled}${folderQuery ? ` and ${folderQuery}` : ''} and $text.contains("${day}") and childof(@page and ${notArchivedOrHandled})`;
    const tasks = dc.useQuery(query);
    tasks.forEach((t: any) => {
      if (
        extractDateFromText(t.$text, '⏳') === day &&
        extractDateFromText(t.$text, '📅') !== day &&
        !extractTimeFromText(t.$text)
      ) {
        scheduledPages.add(t.$file);
      }
    });
  }

  // Next
  let nextPages = new Set<string>();
  if (folders.length) {
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
        nextPages.add(file);
        continue;
      }
      // 2. Fallback: no not completed/cancelled task with start, due, or scheduled
      const hasSpecial = pageTasks.some(t =>
        extractDateFromText(t.$text, '🛫') ||
        extractDateFromText(t.$text, '📅') ||
        extractDateFromText(t.$text, '⏳')
      );
      if (!hasSpecial && pageTasks.length > 0) {
        nextPages.add(file);
      }
    }
  }

  // Handled (global, not filtered by folders)
  let handledPages = new Set<string>();
  {
    const query = `@task and $text.contains("${day}") and $completed = true`;
    const tasks = dc.useQuery(query);
    tasks.forEach((t: any) => {
      if (extractDateFromText(t.$text, '✅') === day) {
        handledPages.add(t.$file);
      }
    });
  }

  // Progress calculation
  const needToHandle = new Set([
    ...timedPages,
    ...duePages,
    ...scheduledPages,
    ...nextPages,
  ]);
  // Add handled pages to denominator as per formula
  handledPages.forEach((p) => needToHandle.add(p));
  const total = needToHandle.size;
  const completed = handledPages.size;
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "#ff4d4d";
    if (percentage < 70) return "#ffcc00";
    return "#4caf50";
  };

  return (
    <dc.Stack style={{ gap: "16px" }}>
      <dc.Text style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>Today's progress</dc.Text>
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--background-secondary)",
          borderRadius: "8px",
          overflow: "hidden",
          height: "20px",
          margin: "10px 0",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercentage}%`,
            backgroundColor: getProgressColor(progressPercentage),
            transition: "width 0.3s ease, background-color 0.3s ease",
            borderRadius: "8px",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)",
              opacity: 0.5,
              animation: "progress-bar-stripes 1s linear infinite",
            }}
          />
        </div>
        <span
          style={{
            position: "absolute",
            color: "white",
            fontWeight: "bold",
            zIndex: 1,
          }}
        >
          {progressPercentage}%
        </span>
      </div>
      <style>
        {`
          @keyframes progress-bar-stripes {
            from { background-position: 1rem 0; }
            to { background-position: 0 0; }
          }
        `}
      </style>
      {/*
      <dc.Text
        style={{
          fontSize: "14px",
          color: "var(--text-normal)",
          textAlign: "center",
        }}
      >
        {completed} / {total} Pages handled today
      </dc.Text>
      */}
    </dc.Stack>
  );
};
