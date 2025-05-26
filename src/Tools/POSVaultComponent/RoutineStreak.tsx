import { RRule } from 'rrule';
import moment from 'moment';
import { extractDateFromText } from '../DcUtils';

interface RoutineStreakProps {
  app: any;
  dc: any;
  file?: any; // Datacore file object, optional
  filterText?: string;
  N?: number;
}

const BADGES = [
  { min: 0, max: 39, name: 'Flaky', emoji: '😶', desc: `You barely show up. You're not following through.` },
  { min: 40, max: 59, name: 'Shaky', emoji: '😬', desc: `You try, but not consistently. Discipline is unstable.` },
  { min: 60, max: 79, name: 'Steady', emoji: '🙂', desc: `You show up more often than not. Building momentum.` },
  { min: 80, max: 94, name: 'Reliable', emoji: '😎', desc: `You're solid. You follow through on your own plans.` },
  { min: 95, max: 100, name: 'Rock-Solid', emoji: '🤖', desc: `You don't miss. You're a machine of execution.` },
];

function getBadge(rate: number) {
  return BADGES.find(b => rate >= b.min && rate <= b.max)!;
}

function getStreak(arr: boolean[], dateArr: string[], cancelArr: boolean[]): number {
  // Only break the streak if a previous day is missed or cancelled, not the current day
  let streak = 0;
  for (let i = 0; i < arr.length; i++) {
    if (i === 0 && !arr[i] && !cancelArr[i]) {
      // If the most recent day is unhandled and not cancelled, skip it (don't break streak)
      continue;
    }
    if (cancelArr[i]) {
      break;
    }
    if (!arr[i]) {
      // If a previous day is missed, break
      break;
    }
    streak++;
  }
  return streak;
}

function getMomentum(arr: boolean[], N: number) {
  let sum = 0;
  for (let i = 0; i < N; i++) {
    if (arr[i]) sum += (N - i) / N;
  }
  const maxSum = (N + 1) / 2;
  return { value: sum, percent: (sum / maxSum) * 100 };
}

function getConsistency(arr: boolean[], N: number) {
  const completed = arr.filter(Boolean).length;
  const rate = (completed / N) * 100;
  const badge = getBadge(rate);
  return { rate, badge };
}

function getRecurrenceRule(task: any): RRule | null {
  // Try to extract recurrence from task text (e.g. 🔁 ...)
  const recurMatch = task.$text?.match(/🔁\s*([^\n]*)/);
  if (recurMatch && recurMatch[1]) {
    try {
      // Use due or scheduled as dtstart (extract from $text)
      let dtstart: Date | undefined;
      const due = extractDateFromText(task.$text, '📅');
      const scheduled = extractDateFromText(task.$text, '⏳');
      const start = extractDateFromText(task.$text, '🛫');
      if (due) dtstart = moment(due).startOf('day').toDate();
      else if (scheduled) dtstart = moment(scheduled).startOf('day').toDate();
      else if (start) dtstart = moment(start).startOf('day').toDate();
      if (!dtstart) return null;
      const rule = new RRule({ ...RRule.fromText(recurMatch[1].trim()).origOptions, dtstart });
      return rule;
    } catch (e) { return null; }
  }
  return null;
}

// Glow color table for streak
function getStreakGlow(streak: number) {
  if (streak >= 50) {
    return {
      boxShadow: '0 0 24px 6px #a8edea, 0 0 32px 8px #fed6e3',
      border: '3px solid #b993d6',
      color: '#b993d6',
    };
  } else if (streak >= 30) {
    return {
      boxShadow: '0 0 16px 4px #ffd700',
      border: '3px solid #ffd700',
      color: '#ffd700',
    };
  } else if (streak >= 15) {
    return {
      boxShadow: '0 0 16px 4px #c0c0c0',
      border: '3px solid #c0c0c0',
      color: '#c0c0c0',
    };
  } else if (streak >= 7) {
    return {
      boxShadow: '0 0 16px 4px #cd7f32',
      border: '3px solid #cd7f32',
      color: '#cd7f32',
    };
  } else if (streak >= 3) {
    return {
      boxShadow: '0 0 8px 2px #20bfa9',
      border: '3px solid #20bfa9',
      color: '#20bfa9',
    };
  } else {
    return {
      boxShadow: 'none',
      border: '3px solid var(--background-modifier-border)',
      color: 'var(--text-muted)',
    };
  }
}

function getMomentumBadge(percent: number) {
  if (percent >= 85) return { label: 'Peak', emoji: '💥', color: '#b993d6' };
  if (percent >= 60) return { label: 'Active', emoji: '⚡', color: '#20bfa9' };
  if (percent >= 30) return { label: 'Charging', emoji: '🔥', color: '#ff9800' };
  return { label: 'Dormant', emoji: '🔋', color: '#ff4d4d' };
}

export const RoutineStreak = ({ app, dc, file, filterText, N = 21 }: RoutineStreakProps) => {
  const currentFile = file || dc.useCurrentFile();
  if (!currentFile?.$path) return null;
  // Query all tasks in the file
  let query = `@task and $file="${currentFile.$path}"`;
  if (filterText) query += ` and $text.contains("${filterText}")`;
  const tasks = dc.useQuery(query);

  // Find the first recurring task (for now, only support one per file)
  const recurringTask = tasks.find((t: any) => getRecurrenceRule(t));
  if (!recurringTask) {
    return <dc.Stack style={{alignItems:'center',justifyContent:'center',padding:24}}><dc.Text>No recurring routine found.</dc.Text></dc.Stack>;
  }
  // Find all tasks with the same recurrence rule (same text up to 🔁)
  const baseText = recurringTask.$text.split('🔁')[0].trim();
  const recurrenceTasks = tasks.filter((t: any) => t.$text.split('🔁')[0].trim() === baseText);
  // Find the earliest completion/cancellation date among them
  const allCompletionDates = recurrenceTasks
    .map((t: any) => extractDateFromText(t.$text, '✅'))
    .filter(Boolean)
    .map((d: string) => moment.utc(d, 'YYYY-MM-DD'));
  const allCancelDates = recurrenceTasks
    .map((t: any) => extractDateFromText(t.$text, '❌'))
    .filter(Boolean)
    .map((d: string) => moment.utc(d, 'YYYY-MM-DD'));
  const allRelevantDates = allCompletionDates.concat(allCancelDates);
  const earliest = allRelevantDates.length > 0 ? moment.min(allRelevantDates) : null;
  // Use this as dtstart for RRule
  const recurMatch = recurringTask.$text?.match(/🔁\s*([^\n]*)/);
  let rule = null;
  if (recurMatch && recurMatch[1] && earliest) {
    try {
      rule = new RRule({ ...RRule.fromText(recurMatch[1].trim()).origOptions, dtstart: earliest.startOf('day').toDate() });
    } catch (e) { rule = null; }
  }
  if (!earliest) {
    return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:160}}>
      <span style={{color:'var(--text-success)',fontSize:22,fontWeight:600,textAlign:'center'}}>Take the first step!</span>
    </div>;
  }
  if (!rule) {
    return <dc.Stack style={{alignItems:'center',justifyContent:'center',padding:24}}><dc.Text>Invalid recurrence rule.</dc.Text></dc.Stack>;
  }

  // Get last N scheduled dates (most recent first)
  const now = moment.utc().endOf('day').toDate();
  const allDates = rule.between(earliest ? earliest.startOf('day').toDate() : now, now, true)
    .sort((a,b) => b.getTime() - a.getTime());
  const lastNDates = allDates.slice(0, N);

  // For each date, check if a completed or cancelled task exists for that date
  const completions: boolean[] = lastNDates.map(date => {
    const dateStr = moment.utc(date).format('YYYY-MM-DD');
    const handled = recurrenceTasks.some((t: any) => {
      const completed = extractDateFromText(t.$text, '✅');
      const cancelled = extractDateFromText(t.$text, '❌');
      return (
        (completed && completed === dateStr)
      );
    });
    return handled;
  });
  const cancelArr: boolean[] = lastNDates.map(date => {
    const dateStr = moment.utc(date).format('YYYY-MM-DD');
    return recurrenceTasks.some((t: any) => {
      const cancelled = extractDateFromText(t.$text, '❌');
      return cancelled && cancelled === dateStr;
    });
  });
  const dateArr = lastNDates.map(d => moment.utc(d).format('YYYY-MM-DD'));

  // Calculate metrics
  const streak = getStreak(completions, dateArr, cancelArr);
  const momentum = getMomentum(completions, Math.ceil(N/2));
  const consistency = getConsistency(completions, N);

  // Card style (like TodayProgressBar)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
  const cardStyle = {
    borderRadius: 12,
    background: 'var(--background-secondary)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    padding: isMobile ? 12 : 20,
    minWidth: isMobile ? 0 : 120,
    minHeight: 120,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: isMobile ? '8px 0' : 8,
    flex: 1,
    maxWidth: isMobile ? '100%' : '100%',
    width: isMobile ? '100%' : undefined,
    boxSizing: 'border-box',
  };
  const valueStyle = { fontSize: isMobile ? 24 : 32, fontWeight: 700, marginBottom: 8 };
  const labelStyle = { fontSize: isMobile ? 14 : 16, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 };
  const streakGlow = getStreakGlow(streak);
  const barContainerStyle = {
    width: isMobile ? '100%' : 120,
    minWidth: isMobile ? 0 : 80,
    maxWidth: '100%',
    height: 18,
    background: 'var(--background-modifier-border)',
    borderRadius: 9,
    overflow: 'hidden',
    margin: isMobile ? '0 0 12px 0' : '0 auto 12px auto',
    position: 'relative',
    boxSizing: 'border-box',
  };
  const groupStyle = {
    gap: 16,
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    flexDirection: isMobile ? 'column' : 'row',
    display: 'flex',
  };

  return (
    <dc.Group style={groupStyle}>
      {/* Stream (Streak Counter) */}
      <div style={cardStyle}>
        <div style={labelStyle}>Streak</div>
        <div style={{
          ...valueStyle,
          ...streakGlow,
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px auto',
          background: 'transparent',
        }}>{streak}</div>
      </div>
      {/* Momentum (Weighted Score) */}
      <div style={cardStyle}>
        <div style={labelStyle}>Momentum</div>
        <div style={barContainerStyle}>
          <div style={{
            width: `${momentum.percent}%`,
            height: '100%',
            background: getMomentumBadge(momentum.percent).color,
            borderRadius: 9,
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: getMomentumBadge(momentum.percent).color, marginTop: 2 }}>
          {getMomentumBadge(momentum.percent).label} {getMomentumBadge(momentum.percent).emoji}
        </div>
      </div>
      {/* Consistency (Badge) */}
      <div style={cardStyle}>
        <div style={labelStyle}>Consistency</div>
        <div
          style={{
            ...valueStyle,
            color: consistency.badge ? undefined : 'var(--text-muted)',
            marginBottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'help',
          }}
          title={consistency.badge ? `${consistency.badge.desc} (${consistency.rate.toFixed(0)}%)` : ''}
        >
          {consistency.badge ? (
            <>
              {consistency.badge.name}
              <span style={{ fontSize: isMobile ? 24 : 32, marginLeft: 8 }}>{consistency.badge.emoji}</span>
            </>
          ) : '—'}
        </div>
      </div>
    </dc.Group>
  );
};
