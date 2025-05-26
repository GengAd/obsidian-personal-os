import { useEffect, useState} from 'preact/hooks';

// XP/Level math helpers for Datacore tasks
function getParentPage(task: any) {
  let current = task;
  while (current && current.$typename !== "Page") {
    current = current.$parent;
  }
  return current;
}

function calculateTaskPoints(task: any) {
  // Get parent page
  const page = getParentPage(task);
  // Page multiplier from frontmatter
  const pageMulti = page?.$frontmatter?.["✳️"]?.value !== undefined ? page.$frontmatter["✳️"].value : 1;
  // Task multiplier from inline fields
  const taskMulti = task.$infields?.["✳️"]?.value !== undefined ? task.$infields["✳️"].value : 1;
  return 10 * taskMulti * pageMulti;
}

function currentLevelBasedOnXp(totalXp: number, x: number, y: number) {
  let level = 0;
  let xpNeeded = 0;
  while (xpNeeded <= totalXp) {
    level++;
    xpNeeded += Math.pow(x * level, y);
  }
  return level - 1;
}

function xpForNextLevel(currentLevel: number, x: number, y: number) {
  return Math.pow(x * (currentLevel + 1), y);
}

function totalXpToTargetLevel(targetLevel: number, x: number, y: number) {
  let totalXp = 0;
  for (let level = 1; level <= targetLevel; level++) {
    totalXp += Math.pow(x * level, y);
  }
  return totalXp;
}

// Streak logic
function getTodayISO() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}
function extractDateFromText(text: string, symbol: string): string | null {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/\s+/g, '');
  const regex = new RegExp(`${symbol}(\\d{4}-\\d{2}-\\d{2})`);
  const match = cleaned.match(regex);
  return match ? match[1] : null;
}
function getCompletedTaskDates(tasks: any[]): string[] {
  const dateSet = new Set<string>();
  for (const task of tasks) {
    const completedDate = extractDateFromText(task.$text, "✅");
    if (completedDate) dateSet.add(completedDate);
  }
  return Array.from(dateSet).sort();
}
function calculateCurrentStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const dateSet = new Set(dates);
  let streak = 0;
  let current = getTodayISO();
  while (dateSet.has(current)) {
    streak++;
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    current = prev.toISOString().slice(0, 10);
  }
  return streak;
}
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

const ProfileComponent = ({ app, dc, plugin }: any) => {
  // Polling state to force re-render every 3 seconds
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  // Avatar logic
  let imgURL = '';
  try {
    const configFolder = plugin?.settings?.configFolder || '';
    const imgPath = app.vault.getFileByPath(`${configFolder}/Avatar.png`);
    if (imgPath) {
      imgURL = app.vault.getResourcePath(imgPath);
    }
  } catch {}

  // Level logic
  const allTasks = dc.query(`@task and $completed = true`);
  const totalXP = allTasks.reduce((acc: number, task: any) => acc + calculateTaskPoints(task), 0);
  const x = 2, y = 2;
  const level = Math.floor(currentLevelBasedOnXp(totalXP, x, y));

  // XP bar logic
  const neededXp = Math.floor(totalXpToTargetLevel(level, x, y));
  const xpRequired = Math.ceil(xpForNextLevel(level, x, y));
  const differencialXp = totalXP - neededXp;
  const percent = xpRequired > 0 ? Math.round((differencialXp / xpRequired) * 100) : 0;
  const barColor = '#20bfa9';

  // Streak logic
  const completedDates = getCompletedTaskDates(allTasks);
  const streak = calculateCurrentStreak(completedDates);
  const tier = getStreakTier(streak);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        padding: '24px 8px 24px 4px',
        flexWrap: 'wrap',
      }}
    >
      {/* Avatar on the left, bigger */}
      <div
        style={{
          width: 128,
          height: 128,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(32,191,169,0.18)',
          background: 'var(--background-secondary)',
          marginRight: 6,
          flexShrink: 0,
          marginBottom: 0,
        }}
      >
        {imgURL ? (
          <img src={imgURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 48 }}>?</div>
        )}
      </div>
      {/* Right side: Level, Streak, XP bar */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          minWidth: 0,
        }}
      >
        {/* Level and Streak row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 18,
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* Level */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
            <div style={{ fontSize: '1em', color: '#888', marginBottom: 4 }}>Level</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'transparent',
                border: '3px solid #20bfa9',
                boxShadow: '0 2px 12px rgba(32,191,169,0.18)',
                margin: '0 auto',
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '2.1em',
                  textShadow: '0 1px 6px rgba(0,0,0,0.10)',
                  userSelect: 'none',
                  letterSpacing: '-1px',
                }}
              >
                {level}
              </span>
            </div>
          </div>
          {/* Streak */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
            <div style={{ fontSize: '1em', color: '#888', marginBottom: 4 }}>Streak</div>
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
        </div>
        {/* XP Progress Bar */}
        <div style={{ width: '100%', margin: '0 0 0 0' }}>
          <div
            style={{
              width: '100%',
              backgroundColor: 'var(--background-secondary)',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '24px',
              margin: '10px 0',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid var(--background-modifier-border)', // fine border
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, percent))}%`,
                backgroundColor: barColor,
                transition: 'width 0.3s ease, background-color 0.3s ease',
                borderRadius: '8px',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '100%',
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)',
                  opacity: 0.5,
                  animation: 'progress-bar-stripes 1s linear infinite',
                }}
              />
            </div>
            <span
              style={{
                position: 'absolute',
                color: 'white',
                fontWeight: 'bold',
                zIndex: 1,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {percent}%
            </span>
          </div>
          <div style={{ fontSize: '0.95em', color: 'var(--text-muted)', marginTop: '-4px', textAlign: 'center', width: '100%' }}>{differencialXp} / {xpRequired} XP</div>
        </div>
      </div>
      {/* Responsive style */}
      <style>
        {`
          @keyframes progress-bar-stripes {
            from { background-position: 1rem 0; }
            to { background-position: 0 0; }
          }
          @media (max-width: 700px) {
            .profile-flex-root {
              flex-direction: column !important;
              align-items: center !important;
              gap: 16px !important;
              padding: 16px !important;
            }
            .profile-flex-right {
              width: 100% !important;
              min-width: 0 !important;
              gap: 16px !important;
            }
            .profile-flex-row {
              flex-direction: row !important;
              gap: 16px !important;
              justify-content: center !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ProfileComponent;
