// Utility functions for robust task completion and recurrence handling
// All functions are pure and do not depend on Obsidian APIs

// --- Regex constants for metadata extraction ---
const EMOJI_RECURRENCE_REGEX = /🔁\s*([^🛫⏳📅⌚✅➕🔁@#\n]*)/u; // up to next metadata or end
const DV_RECURRENCE_REGEX = /\[(?:repeat|recurrence|🔁)::\s*([^\]]+)\]/i;
const EMOJI_DUE_REGEX = /📅\s*\d{4}-\d{2}-\d{2}/g;
const EMOJI_SCHEDULED_REGEX = /⏳\s*\d{4}-\d{2}-\d{2}/g;
const EMOJI_START_REGEX = /🛫\s*\d{4}-\d{2}-\d{2}/g;
const EMOJI_COMPLETED_REGEX = /✅\s*\d{4}-\d{2}-\d{2}/g;
const EMOJI_CREATED_REGEX = /➕\s*\d{4}-\d{2}-\d{2}/g;
const DV_DUE_REGEX = /\[(?:due|🗓️)::\s*\d{4}-\d{2}-\d{2}\]/gi;
const DV_COMPLETION_REGEX = /\[(?:completion|✅)::\s*\d{4}-\d{2}-\d{2}\]/gi;
const DV_CREATED_REGEX = /\[(?:created|➕)::\s*\d{4}-\d{2}-\d{2}\]/gi;
const DV_START_REGEX = /\[(?:start|🛫)::\s*\d{4}-\d{2}-\d{2}\]/gi;
const DV_SCHEDULED_REGEX = /\[(?:scheduled|⏳)::\s*\d{4}-\d{2}-\d{2}\]/gi;
const EMOJI_PRIORITY_REGEX = /\s+(🔼|🔽|⏫|⏬|🔺|\[#[A-C]\])/g;
const DV_PRIORITY_REGEX = /\[priority::\s*\w+\]/gi;
const EMOJI_RECURRENCE_CLEAN_REGEX = /🔁\s*[^🛫⏳📅⌚✅➕🔁@#\n]*/gu;
const DV_RECURRENCE_CLEAN_REGEX = /\[(?:repeat|recurrence)::\s*[^\]]+\]/gi;
const PROJECT_REGEX = /\[project::\s*[^\]]+\]/gi;
const CONTEXT_REGEX = /\[context::\s*[^\]]+\]/gi;
const TAG_REGEX = /\s+#\S+/g;
const AT_CONTEXT_REGEX = /\s+@\S+/g;
const EXTRA_WHITESPACE_REGEX = /\s+/g;

// --- RRule import for advanced recurrence ---
import { RRule, rrulestr } from 'rrule';
import { moment } from 'obsidian';

// --- Date helpers ---
export function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

export function formatDateISO(date: Date | number | string): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return d.toISOString().slice(0, 10);
}

// --- Utility to create UTC midnight Date from YYYY-MM-DD ---
function makeUTCDate(dateStr: string): Date {
  // dateStr: 'YYYY-MM-DD'
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// --- Recurrence extraction ---
/**
 * Extracts the recurrence string from a markdown task line (emoji or dataview format).
 * Returns the recurrence string or undefined if not found.
 */
export function extractRecurrenceFromLine(line: string): string | undefined {
  // Try dataview format first
  let match = line.match(DV_RECURRENCE_REGEX);
  if (match && match[1]) return match[1].trim();
  // Try emoji format (robust: up to next metadata emoji or end)
  match = line.match(EMOJI_RECURRENCE_REGEX);
  if (match && match[1]) return match[1].trim();
  return undefined;
}

// --- Metadata cleaning ---
export function cleanTaskLineMetadata(line: string): string {
  // Remove all emoji and dataview metadata, tags, and recurrence
  return line
    .replace(EMOJI_DUE_REGEX, '')
    .replace(EMOJI_START_REGEX, '')
    .replace(EMOJI_SCHEDULED_REGEX, '')
    .replace(EMOJI_COMPLETED_REGEX, '')
    .replace(EMOJI_CREATED_REGEX, '')
    .replace(DV_DUE_REGEX, '')
    .replace(DV_COMPLETION_REGEX, '')
    .replace(DV_CREATED_REGEX, '')
    .replace(DV_START_REGEX, '')
    .replace(DV_SCHEDULED_REGEX, '')
    .replace(EMOJI_PRIORITY_REGEX, '')
    .replace(DV_PRIORITY_REGEX, '')
    .replace(EMOJI_RECURRENCE_CLEAN_REGEX, '')
    .replace(DV_RECURRENCE_CLEAN_REGEX, '')
    .replace(PROJECT_REGEX, '')
    .replace(CONTEXT_REGEX, '')
    .replace(TAG_REGEX, '')
    .replace(AT_CONTEXT_REGEX, '')
    .replace(EXTRA_WHITESPACE_REGEX, ' ')
    .trim();
}

// --- Task completion ---
/**
 * Marks a task as complete in the markdown lines, appends a completion date, and
 * if the task is recurring, inserts a new recurring task line above the completed one.
 *
 * @param lines - The file lines
 * @param lineIdx - The index of the task line to complete
 * @param today - The completion date (YYYY-MM-DD)
 * @returns The updated lines array
 */
export function finishTaskInMarkdown(
  lines: string[],
  lineIdx: number,
  today?: string
): string[] {
  const line = lines[lineIdx];
  if (!line) return lines;
  const date = today || getTodayISO();
  // Clean old completed dates and mark as complete
  let newLine = line
    .replace(/- \[ \]/, '- [x]')
    .replace(EMOJI_COMPLETED_REGEX, '')
    .trim();
  newLine = newLine + ` ✅ ${date}`;
  lines[lineIdx] = newLine;

  // If recurring, insert new recurring task above
  const recurrence = extractRecurrenceFromLine(line);
  if (recurrence) {
    // Extract all metadata from the original line
    const indentationMatch = line.match(/^(\s*)/);
    const indentation = indentationMatch ? indentationMatch[1] : '';
    const listMarkerMatch = line.match(/^(\s*[-*+]\s|\s*\d+\.\s)/);
    const listMarker = listMarkerMatch ? listMarkerMatch[0].trim() + ' ' : '- ';
    // Extract content (remove checkbox and all metadata)
    let content = line.replace(/^(\s*[-*+]\s*\[.\]\s*)/, '');
    content = cleanTaskLineMetadata(content);
    // Extract tags, project, context, priority, and dates using regex constants
    const tags = (line.match(TAG_REGEX) || []).map(t => t.trim());
    // For project/context, use inline regex for capturing group
    const projectMatch = line.match(/#project\/([^\s#@]+)/);
    const project = projectMatch ? projectMatch[1] : undefined;
    const contextMatch = line.match(/@([^\s#@]+)/);
    const context = contextMatch ? contextMatch[1] : undefined;
    let priority: number | undefined = undefined;
    if (/🔺/.test(line)) priority = 5;
    else if (/⏫/.test(line)) priority = 4;
    else if (/🔼/.test(line)) priority = 3;
    else if (/🔽/.test(line)) priority = 2;
    else if (/⏬/.test(line)) priority = 1;
    // Dates using regex constants
    const dueDateMatch = EMOJI_DUE_REGEX.exec(line);
    const dueDate = dueDateMatch ? dueDateMatch[0].replace(/📅\s*/, '').trim() : undefined;
    const scheduledDateMatch = EMOJI_SCHEDULED_REGEX.exec(line);
    const scheduledDate = scheduledDateMatch ? scheduledDateMatch[0].replace(/⏳\s*/, '').trim() : undefined;
    const startDateMatch = EMOJI_START_REGEX.exec(line);
    const startDate = startDateMatch ? startDateMatch[0].replace(/🛫\s*/, '').trim() : undefined;
    // Calculate next recurrence date for each date
    let nextDue = undefined, nextScheduled = undefined, nextStart = undefined;
    if (dueDate) {
      nextDue = parseRecurrence(recurrence, dueDate);
    }
    if (scheduledDate) {
      nextScheduled = parseRecurrence(recurrence, scheduledDate);
    }
    if (startDate) {
      nextStart = parseRecurrence(recurrence, startDate);
    }
    // If neither, fallback to today
    if (!dueDate && !scheduledDate && !startDate) {
      nextDue = parseRecurrence(recurrence, getTodayISO());
    }
    // Generate new recurring task line
    if (nextDue || nextScheduled || nextStart) {
      const newRecurringLine = generateRecurringTaskLine({
        content,
        tags,
        project,
        context,
        priority,
        recurrence,
        dueDate: nextDue,
        scheduledDate: nextScheduled,
        startDate: nextStart,
        indentation,
        listMarker,
        preferDataviewFormat: false,
      });
      lines.splice(lineIdx, 0, newRecurringLine);
    }
  }
  return lines;
}

// --- Recurrence parsing ---
/**
 * Parses a recurrence string (RRULE or human-readable) and returns the next date (YYYY-MM-DD) after baseDate.
 * Uses rrulestr for RRULE, RRule.fromText for human-readable. Returns undefined if parsing fails or no next date.
 * Handles dtstart in UTC to avoid timezone issues.
 */
export function parseRecurrence(
  recurrence: string,
  baseDate: string | Date = getTodayISO()
): string | undefined {
  const base = typeof baseDate === 'string'
    ? makeUTCDate(baseDate)
    : makeUTCDate(formatDateISO(baseDate));
  let rule;
  try {
    if (/^(RRULE:|FREQ=)/i.test(recurrence.trim())) {
      rule = rrulestr(recurrence.replace(/^RRULE:/i, ''), { dtstart: base });
    } else {
      rule = RRule.fromText(recurrence.trim());
      rule = new RRule({ ...rule.origOptions, dtstart: base });
    }
    const next = rule.after(base, false);
    if (next) {
      return next.toISOString().slice(0, 10);
    }
  } catch (e) {
    // Optionally, keep a minimal error log for debugging
    // console.log('[parseRecurrence] failed:', recurrence, e);
  }
  return undefined;
}

/**
 * Generates a new recurring task line with all proper properties.
 * Supports both emoji and dataview metadata formats.
 *
 * @param props - All properties needed for the new task
 * @returns The new task line as a string
 */
export function generateRecurringTaskLine(props: {
  content: string;
  tags?: string[];
  project?: string;
  context?: string;
  priority?: number;
  recurrence?: string;
  dueDate?: string;
  scheduledDate?: string;
  startDate?: string;
  completedDate?: string;
  indentation?: string;
  listMarker?: string; // e.g. '- ', '* ', '1. '
  preferDataviewFormat?: boolean;
}): string {
  const {
    content,
    tags = [],
    project,
    context,
    priority,
    recurrence,
    dueDate,
    scheduledDate,
    startDate,
    completedDate,
    indentation = '',
    listMarker = '- ',
    preferDataviewFormat = false,
  } = props;

  // Clean content of all tags, project/context tags, and extra whitespace
  let cleanContent = content;
  const allTags = new Set(tags);
  if (project) allTags.add(`#project/${project}`);
  if (context) allTags.add(`@${context}`);
  for (const tag of allTags) {
    const tagRegex = new RegExp(`(^|\\s)${tag.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, 'g');
    cleanContent = cleanContent.replace(tagRegex, ' ').trim();
  }
  cleanContent = cleanContent.replace(EXTRA_WHITESPACE_REGEX, ' ').trim();

  // Start with the basic task
  let newTaskLine = `${indentation}${listMarker}[ ] ${cleanContent}`;

  // Compose metadata
  const metadata: string[] = [];

  // 1. Tags (excluding project/context tags)
  const generalTags = tags.filter(
    (tag) => !tag.startsWith('#project/') && !(context && tag === `@${context}`)
  );
  if (generalTags.length > 0) {
    const uniqueTags = [...new Set(generalTags)].map((tag) =>
      tag.startsWith('#') ? tag : `#${tag}`
    );
    metadata.push(...uniqueTags);
  }

  // 2. Project
  if (project) {
    if (preferDataviewFormat) {
      metadata.push(`[project:: ${project}]`);
    } else {
      const projectTag = `#project/${project}`;
      if (!metadata.includes(projectTag)) metadata.push(projectTag);
    }
  }

  // 3. Context
  if (context) {
    if (preferDataviewFormat) {
      metadata.push(`[context:: ${context}]`);
    } else {
      const contextTag = `@${context}`;
      if (!metadata.includes(contextTag)) metadata.push(contextTag);
    }
  }

  // 4. Priority
  if (priority) {
    if (preferDataviewFormat) {
      let priorityValue: string | number;
      switch (priority) {
        case 5: priorityValue = 'highest'; break;
        case 4: priorityValue = 'high'; break;
        case 3: priorityValue = 'medium'; break;
        case 2: priorityValue = 'low'; break;
        case 1: priorityValue = 'lowest'; break;
        default: priorityValue = priority;
      }
      metadata.push(`[priority:: ${priorityValue}]`);
    } else {
      let priorityMarker = '';
      switch (priority) {
        case 5: priorityMarker = '🔺'; break;
        case 4: priorityMarker = '⏫'; break;
        case 3: priorityMarker = '🔼'; break;
        case 2: priorityMarker = '🔽'; break;
        case 1: priorityMarker = '⏬'; break;
      }
      if (priorityMarker) metadata.push(priorityMarker);
    }
  }

  // 5. Recurrence
  if (recurrence) {
    metadata.push(
      preferDataviewFormat
        ? `[repeat:: ${recurrence}]`
        : `🔁 ${recurrence}`
    );
  }

  // 6. Start Date
  if (startDate) {
    metadata.push(
      preferDataviewFormat
        ? `[start:: ${startDate}]`
        : `🛫 ${startDate}`
    );
  }

  // 7. Scheduled Date
  if (scheduledDate) {
    metadata.push(
      preferDataviewFormat
        ? `[scheduled:: ${scheduledDate}]`
        : `⏳ ${scheduledDate}`
    );
  }

  // 8. Due Date
  if (dueDate) {
    metadata.push(
      preferDataviewFormat
        ? `[due:: ${dueDate}]`
        : `📅 ${dueDate}`
    );
  }

  // 9. Completion Date (only if present)
  if (completedDate) {
    metadata.push(
      preferDataviewFormat
        ? `[completion:: ${completedDate}]`
        : `✅ ${completedDate}`
    );
  }

  // Append all metadata to the line
  if (metadata.length > 0) {
    newTaskLine = `${newTaskLine} ${metadata.join(' ')}`;
  }

  return newTaskLine;
}