/** @jsxImportSource preact */
import { getWorkInProgressFolders } from "../DcUtils";

interface XPProps {
  dc: any;
  app: any;
}

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

// 1. TotalXP component
export const TotalXP = ({ dc, app }: XPProps) => {
  const allTasks = dc.useQuery(`@task and $completed = true`);
  const totalXP = allTasks.reduce((acc: number, task: any) => acc + calculateTaskPoints(task), 0);
  return (
    <dc.Stack style={{ alignItems: 'center', gap: '8px' }}>
      <dc.Text style={{ fontSize: '2.2em', fontWeight: 700 }}>{totalXP}</dc.Text>
    </dc.Stack>
  );
};

// 2. CharacterLevel component
export const CharacterLevel = ({ dc, app }: XPProps) => {
  const allTasks = dc.useQuery(`@task and $completed = true`);
  const totalXP = allTasks.reduce((acc: number, task: any) => acc + calculateTaskPoints(task), 0);
  const x = 2, y = 2;
  const level = Math.floor(currentLevelBasedOnXp(totalXP, x, y));
  return (
    <dc.Stack style={{ alignItems: 'center', gap: '3px' }}>
      <dc.Text style={{ fontSize: '0.95em', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2px' }}>Level</dc.Text>
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
    </dc.Stack>
  );
};

// 3. CurrentLevelXPBar component
export const CurrentLevelXPBar = ({ dc, app }: XPProps) => {
  const allTasks = dc.useQuery(`@task and $completed = true`);
  const totalXP = allTasks.reduce((acc: number, task: any) => acc + calculateTaskPoints(task), 0);
  const x = 2, y = 2;
  const level = Math.floor(currentLevelBasedOnXp(totalXP, x, y));
  const neededXp = Math.floor(totalXpToTargetLevel(level, x, y));
  const xpRequired = Math.ceil(xpForNextLevel(level, x, y));
  const differencialXp = totalXP - neededXp;
  const percent = xpRequired > 0 ? Math.round((differencialXp / xpRequired) * 100) : 0;
  const barColor = '#20bfa9'; // Teal
  return (
    <dc.Stack style={{ gap: '8px', alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          overflow: 'hidden',
          height: '20px',
          margin: '10px 0',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
      <style>
        {`
          @keyframes progress-bar-stripes {
            from { background-position: 1rem 0; }
            to { background-position: 0 0; }
          }
        `}
      </style>
      <dc.Text style={{ fontSize: '0.95em', color: 'var(--text-muted)', marginTop: '-4px', textAlign: 'center', width: '100%' }}>{differencialXp} / {xpRequired} XP</dc.Text>
    </dc.Stack>
  );
};
