/** @jsxImportSource preact */
import { extractDateFromText, getTodayISO } from "../DcUtils";

interface StreakProps {
  dc: any;
  app: any;
}

// Returns a sorted array of unique ISO dates (YYYY-MM-DD) where at least one task was completed
function getCompletedTaskDates(tasks: any[]): string[] {
  const dateSet = new Set<string>();
  for (const task of tasks) {
    // Look for a completed date in the text (✅YYYY-MM-DD)
    const completedDate = extractDateFromText(task.$text, "✅");
    if (completedDate) dateSet.add(completedDate);
  }
  return Array.from(dateSet).sort();
}

// Returns the current streak (number of consecutive days up to today with at least one completed task)
function calculateCurrentStreak(dates: string[]): number {
  if (!dates.length) return 0;
  // Convert to a Set for fast lookup
  const dateSet = new Set(dates);
  let streak = 0;
  let current = getTodayISO();
  while (dateSet.has(current)) {
    streak++;
    // Move to previous day
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    current = prev.toISOString().slice(0, 10);
  }
  return streak;
}

// Returns the tier info for a given streak
function getStreakTier(streak: number) {
  if (streak >= 365) {
    return {
      name: 'Platinum',
      color: 'linear-gradient(90deg, #a8edea 0%, #fed6e3 100%)',
      border: '3px solid #b993d6',
      glow: '0 0 16px 4px #b993d6',
      icon: '🏆',
    };
  } else if (streak >= 100) {
    return {
      name: 'Gold',
      color: '#ffd700',
      border: '3px solid #ffd700',
      glow: '0 0 16px 4px #ffd700',
      icon: '🥇',
    };
  } else if (streak >= 30) {
    return {
      name: 'Silver',
      color: '#c0c0c0',
      border: '3px solid #c0c0c0',
      glow: '0 0 16px 4px #c0c0c0',
      icon: '🥈',
    };
  } else if (streak >= 7) {
    return {
      name: 'Bronze',
      color: '#cd7f32',
      border: '3px solid #cd7f32',
      glow: '0 0 16px 4px #cd7f32',
      icon: '🥉',
    };
  } else if (streak >= 3) {
    return {
      name: 'Default',
      color: 'var(--background-secondary)',
      border: '3px solid #20bfa9',
      glow: '0 0 8px 2px #20bfa9',
      icon: '🔥',
    };
  } else {
    return {
      name: 'None',
      color: 'var(--background-secondary)',
      border: '3px solid var(--background-modifier-border)',
      glow: 'none',
      icon: '',
    };
  }
}

export const GlobalStreak = ({ dc, app }: StreakProps) => {
  // Query all completed tasks
  const allCompletedTasks = dc.useQuery(`@task and $completed = true`);
  // Get all unique completion dates
  const completedDates = getCompletedTaskDates(allCompletedTasks);
  // Calculate the current streak
  const streak = calculateCurrentStreak(completedDates);
  const tier = getStreakTier(streak);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <span style={{ fontSize: '0.95em', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2px' }}>Streak</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'transparent',
            border: tier.border,
            boxShadow: tier.glow,
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <span
            style={{
              color: 'var(--text-normal)',
              fontWeight: 800,
              fontSize: '2.1em',
              textShadow: '0 1px 6px rgba(0,0,0,0.10)',
              userSelect: 'none',
              letterSpacing: '-1px',
              zIndex: 1,
            }}
          >
            {streak}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
        <span style={{ fontSize: '0.95em', color: 'var(--text-muted)' }}>days in a row</span>
        {tier.icon && (
          <span
            style={{
              marginLeft: 6,
              fontSize: '1.3em',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
              zIndex: 2,
              pointerEvents: 'none',
              alignSelf: 'center',
            }}
          >
            {tier.icon}
          </span>
        )}
      </div>
    </div>
  );
};
