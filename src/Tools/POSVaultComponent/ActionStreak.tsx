/** @jsxImportSource preact */

import moment from 'moment';
import { extractDateFromText } from '../DcUtils';

interface ActionStreakProps {
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
  let streak = 0;
  for (let i = 0; i < arr.length; i++) {
    if (i === 0 && !arr[i] && !cancelArr[i]) {
      continue;
    }
    if (cancelArr[i]) {
      break;
    }
    if (!arr[i]) {
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

export const ActionStreak = ({ app, dc, file, filterText, N = 21 }: ActionStreakProps) => {
  const currentFile = file || dc.useCurrentFile();
  if (!currentFile?.$path) return null;
  let query = `@task and $file="${currentFile.$path}"`;
  if (filterText) query += ` and $text.contains("${filterText}")`;
  const tasks = dc.useQuery(query);

  // Get all completed tasks with a ✅ date
  const completedTasks = tasks.filter((t: any) => extractDateFromText(t.$text, '✅'));
  const totalCompleted = completedTasks.length;

  // Build last N days (including today), most recent first
  const today = moment.utc().startOf('day');
  const lastNDates = Array.from({ length: N }, (_, i) => today.clone().subtract(i, 'days').format('YYYY-MM-DD'));

  // For each date, check if a completed task exists for that date
  const completions: boolean[] = lastNDates.map(dateStr => {
    return completedTasks.some((t: any) => extractDateFromText(t.$text, '✅') === dateStr);
  });
  // For ActionStreak, we don't consider cancellations
  const cancelArr: boolean[] = lastNDates.map(_ => false);
  const dateArr = lastNDates;

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
  const valueStyle = { fontSize: isMobile ? 20 : 24, fontWeight: 700, marginBottom: 8 };
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
  const streakTotalRowStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'flex-end',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  };
  const streakTotalCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  };

  return (
    <div style={groupStyle}>
      {/* Streak Counter with Total */}
      <div style={cardStyle}>
        <div style={streakTotalRowStyle}>
          <div style={streakTotalCardStyle}>
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
          <div style={streakTotalCardStyle}>
            <div style={labelStyle}>Total</div>
            <div style={{
              ...valueStyle,
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px auto',
              background: 'transparent',
              color: 'var(--text-accent)',
              border: '3px solid var(--text-accent)',
            }}>{totalCompleted}</div>
          </div>
        </div>
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
            <span>
              {consistency.badge.name}
              <span style={{ fontSize: isMobile ? 24 : 32, marginLeft: 8 }}>{consistency.badge.emoji}</span>
            </span>
          ) : '—'}
        </div>
      </div>
    </div>
  );
};
