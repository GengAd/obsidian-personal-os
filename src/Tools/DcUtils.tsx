/**
 * Returns a Datacore query filter for tasks that are not completed and not cancelled.
 */
export const notCompletedOrCancelled = `($completed != true and $status != "-")`;

/**
 * Returns a Datacore query filter for pages that are not archived and not handled by someone else.
 */
export const notArchivedOrHandled = `!Archived and (!$frontmatter.contains("handled by") or ($frontmatter.contains("handled by") and !$frontmatter["handled by"].value))`;

import moment from "moment";

/**
 * Returns today's date as an ISO string (YYYY-MM-DD) in local time.
 */
export function getTodayISO() {
  return moment().format('YYYY-MM-DD');
}

/**
 * Extracts a date (YYYY-MM-DD) from text, given a symbol (e.g. '📅', '⏳').
 * Cleans the text (removes spaces) before matching.
 */
export function extractDateFromText(text: string, symbol: string): string | null {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/\s+/g, '');
  const regex = new RegExp(`${symbol}(\\d{4}-\\d{2}-\\d{2})`);
  const match = cleaned.match(regex);
  return match ? match[1] : null;
}

/**
 * Extracts a time (HH:mm) from text, looking for the ⌚ symbol.
 * Cleans the text (removes spaces) before matching.
 */
export function extractTimeFromText(text: string): string | null {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/\s+/g, '');
  const match = cleaned.match(/⌚(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

/**
 * Returns the list of work-in-progress folders from the app config.
 */
export function getWorkInProgressFolders(app: any): string[] {
  return Array.isArray(app?.plugins?.plugins?.['personal-os']?.graph?.officePages)
    ? app.plugins.plugins['personal-os'].graph.officePages
    : [];
}

/**
 * Returns a Datacore query fragment for filtering by folders.
 */
export function getExcludedFolderQuery(folders: string[]): string {
  if (!folders.length) return '';
  return `childof(@page and (${folders.map(folder => `!path(\"${folder}\")`).join(' and ')}))`;
}

/**
 * Returns a Datacore query fragment for filtering pages by folders (for @page queries).
 */
export function getPageExcludedFolderQuery(folders: string[]): string {
  if (!folders.length) return '';
  return `(${folders.map(folder => `!path(\"${folder}\")`).join(' and ')})`;
}

/**
 * Renders a badge-like h1 for a count, with color and emoji logic.
 * 0 = 👍 (green), 1-3 = normal, 4-10 = orange, >10 = red.
 */
export function CountBadge({ count }: { count: number }) {
  let color = "var(--text-success)";
  if (count > 7) color = "var(--text-error)";
  else if (count > 3) color = "var(--text-warning)";
  else if (count > 0) color = "var(--text-normal)";
  return (
    <h1
      style={{
        color,
        fontSize: "2.5em",
        margin: 0,
        fontWeight: 700,
        lineHeight: 1,
        display: "inline-block",
        background: "var(--background-secondary)",
        borderRadius: "1.5em",
        padding: "0.2em 0.8em",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        border: `2px solid ${color}`,
        minWidth: "1.5em",
        textAlign: "center"
      }}
    >
      {count === 0 ? "👍" : count}
    </h1>
  );
}

export function HandledBadge({ count }: { count: number }) {
  let color = count >= 10 ? "var(--text-success)" : "var(--text-normal)";
  return (
    <h1
      style={{
        color,
        fontSize: "2.5em",
        margin: 0,
        fontWeight: 700,
        lineHeight: 1,
        display: "inline-block",
        background: "var(--background-secondary)",
        borderRadius: "0.5em",
        padding: "0.2em 0.8em",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        border: `2px solid ${color}`,
        minWidth: "1.5em",
        textAlign: "center"
      }}
    >
      {count}
    </h1>
  );
}

/**
 * Parses a duration string like '7d', '3M', '2w' into a moment duration.
 * Supports days (d), weeks (w), months (M), years (y).
 * Returns a moment object offset from today.
 */
export function parseDuration(duration: string): moment.Moment {
  const regex = /^(\d+)([dwMy])$/;
  const match = duration.trim().match(regex);
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'd': return moment().add(value, 'days');
    case 'w': return moment().add(value, 'weeks');
    case 'M': return moment().add(value, 'months');
    case 'y': return moment().add(value, 'years');
    default: throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Given two duration strings (e.g. '7d', '30d'), returns an object with start and end ISO dates.
 * The range is [today + from, today + to), both inclusive.
 */
export function getDateRangeFromDurations(from: string, to: string): { start: string, end: string } {
  const start = parseDuration(from).format('YYYY-MM-DD');
  const end = parseDuration(to).format('YYYY-MM-DD');
  return { start, end };
}

/**
 * Returns all requirement list items for a file that are under a parent section titled 'Requirements'.
 */
export function getRequirementItems(dc: any, file: any) {
  if (!file?.$path) return [];
  const listItems = dc.useQuery(`@list-item and $file="${file.$path}"`);
  // Only those under a parent section titled 'Requirements'
  return listItems.filter((item: any) => {
    let current = item;
    while (current) {
      if (current.$typename === "Section" && typeof current.$title === "string" && current.$title.trim() === "Requirements") {
        return true;
      }
      current = current.$parent;
    }
    return false;
  });
}

/**
 * Returns true if a requirement item is met, using robust logic (level, completed on, archived, template completion).
 */
export function verifyRequirement(dc: any, item: any) {
  const link = item.$links?.[0];
  if (!link) return false;
  const linkedPage = dc.useFile(link.path);
  if (!linkedPage) return false;
  // Level-based requirement
  if (item.$infields?.level?.value != null) {
    const required = item.$infields?.level?.value ?? 0;
    const actual = linkedPage.$frontmatter?.level?.value ?? 0;
    return actual >= required;
  }
  // If the linked file is a template, check for archived generated file
  const classRaw = linkedPage.$frontmatter?.class?.raw || "";
  if (typeof classRaw === "string" && classRaw.includes("-Template")) {
    // Query all files generated from templates
    const allFilesWithTemplate = dc.useQuery(`@page and $frontmatter.contains("from template") and $frontmatter["from template"].value`);
    return allFilesWithTemplate.some((file: any) => {
      const fromTemplate = file.$frontmatter?.["from template"]?.value;
      return fromTemplate?.path === linkedPage.$path && file.$path !== linkedPage.$path && file.$frontmatter?.archived?.value === true;
    });
  }
  // Otherwise, check for completed on
  if (linkedPage.$frontmatter?.["completed on"]?.value != null) return true;
  return false;
}

/**
 * Returns { total, completed, percentage } for requirements in a file.
 */
export function getRequirementProgress(dc: any, file: any) {
  const items = getRequirementItems(dc, file);
  const total = items.length;
  const completed = items.filter((item: any) => verifyRequirement(dc, item)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

// Inclusion logic (legacy)
export function getFolderQuery(folders: string[]): string {
  if (!folders.length) return '';
  return `childof(@page and (${folders.map(folder => `path(\"${folder}\")`).join(' or ')}))`;
}

export function getPageFolderQuery(folders: string[]): string {
  if (!folders.length) return '';
  return `(${folders.map(folder => `path(\"${folder}\")`).join(' or ')})`;
}
