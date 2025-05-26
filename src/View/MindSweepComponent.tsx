/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { useRef as useDomRef } from 'preact/hooks';
import { useCallback } from 'preact/hooks';
import { normalizePath, App} from 'obsidian';

interface Category {
  title: string;
  triggers: string[];
}

interface MindSweepComponentProps {
  categories: Category[];
  isLoading: boolean;
}

// Confetti utility
function Confetti() {
  // Fewer confetti, shorter duration
  const confettiArray = Array.from({ length: 10 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    emoji: ["🎉", "✨", "🎊", "🥳", "💫"][i % 5],
  }));
  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 10 }}>
      {confettiArray.map((c, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${c.left}%`,
          top: 0,
          fontSize: '1.7em',
          opacity: 0.85,
          animation: `confetti-fall 0.9s ${c.delay}s cubic-bezier(.6,1.5,.6,1) forwards`,
        }}>{c.emoji}</span>
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-40px) rotate(-10deg); opacity: 0.7; }
          80% { opacity: 0.85; }
          100% { transform: translateY(40vh) rotate(20deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function MindSweepComponent({ categories, isLoading }: MindSweepComponentProps) {
  const [screen, setScreen] = useState<'Intro' | 'Home' | 'End'>('Intro');
  const [inputValue, setInputValue] = useState('');
  const [entries, setEntries] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null); // null = all
  const [triggers, setTriggers] = useState<string[]>([]);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTriggerIdx, setCurrentTriggerIdx] = useState(0);
  const [triggerFade, setTriggerFade] = useState(true);
  const triggerCardRef = useDomRef<HTMLDivElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [addPulse, setAddPulse] = useState(false);
  const [timerShake, setTimerShake] = useState(false);
  const [entryBadgePulse, setEntryBadgePulse] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [showHomeIntro, setShowHomeIntro] = useState(false); // Overlay for Home intro
  const [homeIntroCountdown, setHomeIntroCountdown] = useState(7); // 7 seconds

  // When triggers change (category changes), reset currentTriggerIdx
  useEffect(() => {
    setCurrentTriggerIdx(0);
  }, [triggers]);

  // Animate trigger card fade-in on trigger change
  useEffect(() => {
    setTriggerFade(false);
    const timeout = setTimeout(() => setTriggerFade(true), 50);
    return () => clearTimeout(timeout);
  }, [currentTriggerIdx, triggers]);

  // Helper to reset all state except countdownActive
  const resetAllExceptCountdown = () => {
    setInputValue('');
    setEntries([]);
    setSelectedCategory(null);
    setTriggers([]);
    setTimer(30);
    setCurrentTriggerIdx(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Helper to start/reset timer interval
  const startTimer = () => {
    setTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!countdownActive) return;
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current!);
          return 0;
        }       
        return +(prev - 0.1).toFixed(1);
      });
    }, 100);
  };

  // Go to next trigger or end
  const handleNextTrigger = async () => {
    if (inputValue.trim()) await addEntry();
    if (currentTriggerIdx < triggers.length - 1) {
      setCurrentTriggerIdx(idx => {
        const nextIdx = idx + 1;
        return nextIdx;
      });
      setInputValue('');
      setTimer(30);
      startTimer();
      setTimerShake(false);
    } else if (currentTriggerIdx === triggers.length - 1) {
      // Last trigger, go to End screen
      if (timerRef.current) clearInterval(timerRef.current);
      setScreen('End');
      setTimerShake(true);
      setTimeout(() => setTimerShake(false), 600);
    }
  };

  // Go to previous trigger
  const handlePrevTrigger = async () => {
    if (inputValue.trim()) await addEntry();
    if (currentTriggerIdx > 0) {
      setCurrentTriggerIdx(idx => {
        const prevIdx = idx - 1;
        return prevIdx;
      });
      setInputValue('');
      setTimer(30);
      startTimer();
      setTimerShake(false);
    }
  };

  // Timer effect: start on entering Home
  useEffect(() => {
    if (screen !== 'Home') return;
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'Home') return;
    if (timer === 0) {
      (async () => {
        if (inputValue.trim()) await addEntry();
        if (currentTriggerIdx < triggers.length - 1) {
          setCurrentTriggerIdx(idx => idx + 1);
          setInputValue('');
          setTimer(30);
          startTimer();
          setTimerShake(true);
          setTimeout(() => setTimerShake(false), 600);
        } else {
          setScreen('End');
          setTimerShake(true);
          setTimeout(() => setTimerShake(false), 600);
        }
      })();
    }
  }, [timer]);

  // Reset timer and restart interval when an entry is added
  const addEntry = async () => {
    if (inputValue.trim()) {
      const entry = inputValue.trim();
      setEntries([...entries, entry]);
      setInputValue('');
      setTimer(30);
      startTimer();
      setAddPulse(true);
      setTimeout(() => setAddPulse(false), 350);
      setEntryBadgePulse(true);
      setTimeout(() => setEntryBadgePulse(false), 400);

      // --- File creation logic ---
      try {
        // @ts-ignore
        const app = window.app as App || (window as any).app as App || (window as any).App as App;
        if (!app?.vault) return;
        // @ts-ignore
        const defaultFolder = app.vault.getConfig("newFileFolderPath") || '';
        // Sanitize entry for filename
        let fileName = entry.replace(/[/\\?%*:|"<>]/g, '').slice(0, 80) + '.md';
        const filePath = normalizePath(`${defaultFolder}/${fileName}`);
        // Determine category
        let category = '';
        let trigger = triggers[currentTriggerIdx];
        if (selectedCategory === null) {
          // My Entire Brain: get category for current trigger
          category = triggerToCategory[trigger] || 'Unknown';
        } else {
          category = categories[selectedCategory]?.title || 'Unknown';
        }
        const fileContent = `Trigger: ${trigger}\n${entry}`;
        await app.vault.create(filePath, fileContent);
      } catch (error) {
        // Let Obsidian handle duplicate file errors, but log others
        if (!String(error).includes('File already exists')) {
          // @ts-ignore
          if (window?.console) window.console.error('Failed to create MindSweep entry file:', error);
        }
      }
      // --- End file creation logic ---
    }
  };

  const handleCategorySelect = (index: number) => {
    setCurrentTriggerIdx(0);
    setTimer(30);
    setInputValue('');
    if (timerRef.current) clearInterval(timerRef.current);
    const filterValid = (arr: string[]) => arr.filter(t => t && t !== '#' && !t.startsWith('#'));
    if (index === -1) {
      // My Entire Brain: all triggers from all categories
      setSelectedCategory(null);
      setTriggers(filterValid(categories.flatMap(cat => cat.triggers)));
      setScreen('Home');
    } else {
      setSelectedCategory(index);
      setTriggers(filterValid(categories[index].triggers));
      setScreen('Home');
    }
  };

  // Timer color logic (for SVG and text)
  let timerColor = 'var(--text-success)';
  if (timer <= 5) timerColor = 'var(--text-error)';
  else if (timer <= 10) timerColor = 'orange';

  // Timer progress for SVG (0-1)
  const timerProgress = timer / 30;

  // SVG circle constants
  const RADIUS = 32;
  const CIRCUM = 2 * Math.PI * RADIUS;


  // Next icon SVG
  const NextIcon = (
    <svg width="18" height="18" viewBox="0 0 20 20" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
      <polyline points="7,5 13,10 7,15" fill="none" stroke="var(--text-normal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Build a trigger-to-category map for 'My Entire Brain' mode
  const triggerToCategory: Record<string, string> = {};
  categories.forEach(cat => {
    cat.triggers.forEach(trigger => {
      triggerToCategory[trigger] = cat.title;
    });
  });

  // Show Home intro overlay when entering Home
  useEffect(() => {
    if (screen === 'Home') {
      setShowHomeIntro(true);
      setHomeIntroCountdown(7);
    }
  }, [screen]);

  // Countdown for Home intro overlay
  useEffect(() => {
    if (!showHomeIntro) return;
    if (homeIntroCountdown <= 0) {
      setShowHomeIntro(false);
      startTimer(); // Start sweep timer only after overlay
      return;
    }
    const interval = setInterval(() => {
      setHomeIntroCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showHomeIntro, homeIntroCountdown]);

  return (
    <div style={{ textAlign: 'center', padding: '2em' }}>
      {screen === 'Intro' && (
        <>
          <h1 style={{ fontSize: '2.1em', fontWeight: 700, marginBottom: '1.5em', color: 'var(--text-accent)' }}>
            Choose what to sweep
          </h1>
          {isLoading ? (
            <div style={{ fontSize: '1.2em', color: 'var(--text-faint)', margin: '2em 0' }}>Loading categories...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5em', margin: '2em 0', width: '100%' }}>
              {/* My Entire Brain card */}
              <div
                className="mindsweep-full-box"
                style={{
                  width: '100%',
                  maxWidth: 800,
                  background: 'var(--background-secondary)',
                  color: 'var(--text-accent)',
                  fontWeight: 700,
                  padding: '2em 1em',
                  marginBottom: '1.5em',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '2.5px solid var(--interactive-accent)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
                onClick={() => handleCategorySelect(-1)}
              >
                <h1 style={{ fontSize: '2.1em', fontWeight: 800, margin: 0, color: 'var(--text-accent)' }}>
                  My Entire Brain
                </h1>
                <span style={{ fontSize: '1.1em', fontWeight: 400, color: 'var(--text-normal)', marginTop: '0.5em' }}>
                  Complete mind sweep with all categories
                </span>
              </div>
              {/* Category cards */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', justifyContent: 'center', width: '100%' , maxWidth: 800}}>
                {categories.map((cat, idx) => (
                  <div
                    key={cat.title}
                    className="mindsweep-trigger-box"
                    style={{
                      background: 'var(--background-secondary)',
                      color: 'var(--text-normal)',
                      border: '1.5px solid var(--background-modifier-border)',
                      borderRadius: '10px',
                      width: 250,
                      height: 60,
                      fontSize: '1.1em',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      marginBottom: '0.5em',
                      transition: 'box-shadow 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      padding: '0.5em 1em',
                    }}
                    onClick={() => handleCategorySelect(idx)}
                  >
                    <h2 style={{ fontSize: '1.15em', fontWeight: 600, margin: 0, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cat.title}</h2>
                  </div>
                ))}
              </div>
              {/* Countdown deactivation switch */}
              <div style={{ marginTop: '1.5em', textAlign: 'center', fontSize: '1em', color: 'var(--text-faint)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={countdownActive}
                    onChange={e => setCountdownActive(e.currentTarget.checked)}
                    style={{ accentColor: 'var(--interactive-accent)', width: 18, height: 18 }}
                  />
                  Fast mode: Activate countdown
                </label>
              </div>
            </div>
          )}
        </>
      )}
      {screen === 'Home' && (
        <div style={{
          width: '100%',
          background: 'transparent',
          paddingTop: '2.5em',
          paddingBottom: '2em',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 850,
            margin: '0 auto 2em auto',
            background: 'var(--background-primary)',
            borderRadius: 24,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            border: '1.5px solid var(--background-modifier-border)',
            padding: '2.5em 2em 2em 2em',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}>
            {/* Progress bar at top, maxWidth 800px, centered */}
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '0.7em',
            }}>
              <div style={{
                width: '100%',
                maxWidth: 800,
                height: 6,
                background: 'var(--background-modifier-border)',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${((currentTriggerIdx + 1) / triggers.length) * 100}%`,
                  height: '100%',
                  background: 'var(--interactive-accent)',
                  transition: 'width 0.4s cubic-bezier(.4,1.3,.6,1)',
                }} />
              </div>
            </div>
            {/* Prompt card below progress bar */}
            <div style={{ margin: '0.7em auto 0.5em auto', maxWidth: 800, textAlign: 'center' }}>
              <div style={{
                fontSize: '1.25em',
                fontWeight: 600,
                color: 'var(--text-accent)',
                marginBottom: '0.4em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5em',
              }}>
                <span role="img" aria-label="lightbulb">💡</span> Make connections! Ask yourself
              </div>
              <div style={{ fontSize: '1.05em', color: 'var(--text-normal)' }}>
                Is there anything I need to do? Is there any problem? Is there anything I want?
              </div>
            </div>
            {/* Central sweep UI or overlay */}
            {showHomeIntro ? (
              <div style={{
                width: '100%',
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ fontSize: '2em', fontWeight: 700, marginBottom: '0.7em', color: 'var(--text-accent)' }}>
                  Sweep starts in:
                </div>
                <div style={{ fontSize: '3.5em', fontWeight: 800, color: 'var(--text-normal)', letterSpacing: '0.04em' }}>
                  {homeIntroCountdown}
                </div>
              </div>
            ) : (
              <>
                {/* Category badge above trigger */}
                {triggers.length > 0 && (
                  (() => {
                    const computedCategory = selectedCategory === null
                      ? triggerToCategory[triggers[currentTriggerIdx]] || 'Category'
                      : categories[selectedCategory]?.title || 'Category';
                    return (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '1em auto 0.2em auto', maxWidth: 800 }}>
                        <span style={{
                          display: 'inline-block',
                          background: 'var(--background-modifier-active)',
                          color: 'var(--text-accent)',
                          borderRadius: 16,
                          padding: '0.2em 1em',
                          fontSize: '1em',
                          fontWeight: 600,
                          letterSpacing: '0.01em',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }}>
                          {computedCategory}
                        </span>
                      </div>
                    );
                  })()
                )}
                {/* Current trigger card with fade-in animation, normal text color, larger */}
                {triggers.length > 0 && currentTriggerIdx < triggers.length && (
                  (() => {
                    return (
                      <div
                        ref={triggerCardRef}
                        style={{
                          width: '100%',
                          maxWidth: 800,
                          margin: '0.2em auto 0.5em auto',
                          padding: '1.4em 1.2em',
                          background: 'var(--background-secondary)',
                          color: 'var(--text-normal)',
                          fontSize: '2em',
                          fontWeight: 700,
                          borderRadius: 14,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          opacity: triggerFade ? 1 : 0,
                          transform: triggerFade ? 'translateY(0)' : 'translateY(10px)',
                          transition: 'opacity 0.4s, transform 0.4s',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                          alignSelf: 'center',
                        }}
                      >
                        {triggers[currentTriggerIdx]}
                      </div>
                    );
                  })()
                )}
                {/* Input and Add button, constrained to maxWidth 800px */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 800, margin: '0 auto', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5em', width: '100%' }}>
                    <input
                      type="text"
                      value={inputValue}
                      onInput={e => setInputValue((e.target as HTMLInputElement).value)}
                      placeholder="Capture your thought…"
                      style={{
                        fontSize: '1.1em',
                        padding: '0.5em',
                        borderRadius: '6px',
                        border: inputFocused ? '2px solid var(--interactive-accent)' : '1px solid var(--background-modifier-border)',
                        boxShadow: inputFocused ? '0 0 0 2px var(--background-modifier-active)' : 'none',
                        marginBottom: '1em',
                        width: '70%',
                        minWidth: 0,
                        flex: 1,
                        outline: 'none',
                        transition: 'border 0.2s, box-shadow 0.2s',
                      }}
                      onKeyDown={e => {
                        if ((e as KeyboardEvent).key === 'Enter') addEntry();
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      aria-label="Entry input"
                    />
                    <button
                      style={{
                        fontSize: '1em',
                        padding: '0.4em 1.2em',
                        borderRadius: '8px',
                        background: 'var(--interactive-accent)',
                        color: 'var(--text-on-accent)',
                        border: addPulse ? '2px solid var(--interactive-accent)' : 'none',
                        cursor: 'pointer',
                        marginBottom: '1em',
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 600,
                        boxShadow: addPulse ? '0 0 0 4px var(--background-modifier-active)' : 'none',
                        transition: 'box-shadow 0.3s, border 0.2s',
                        outline: 'none',
                      }}
                      onClick={addEntry}
                      aria-label="Add entry"
                      tabIndex={0}
                      onFocus={e => e.currentTarget.style.border = '2px solid var(--interactive-accent)'}
                      onBlur={e => e.currentTarget.style.border = addPulse ? '2px solid var(--interactive-accent)' : 'none'}
                    >
                      + Add
                    </button>
                  </div>
                  {/* Next/Previous Trigger buttons just under the input bar, always visible */}
                  <div style={{ width: '100%', maxWidth: 800, display: 'flex', justifyContent: 'center', gap: '0.5em', margin: '-0.2em auto 0.5em auto' }}>
                    <button
                      style={{
                        fontSize: '1em',
                        padding: '0.4em 1.2em',
                        borderRadius: '8px',
                        background: 'var(--background-modifier-border)',
                        color: 'var(--text-normal)',
                        border: 'none',
                        cursor: currentTriggerIdx === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentTriggerIdx === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 600,
                        transition: 'opacity 0.2s',
                        outline: 'none',
                      }}
                      onClick={handlePrevTrigger}
                      aria-label="Previous trigger"
                      tabIndex={0}
                      disabled={currentTriggerIdx === 0}
                      onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px var(--interactive-accent)'}
                      onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      {/* Left arrow icon */}
                      <svg width="18" height="18" viewBox="0 0 20 20" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                        <polyline points="13,5 7,10 13,15" fill="none" stroke="var(--text-normal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Previous Trigger
                    </button>
                    <button
                      style={{
                        fontSize: '1em',
                        padding: '0.4em 1.2em',
                        borderRadius: '8px',
                        background: 'var(--background-modifier-border)',
                        color: 'var(--text-normal)',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 1,
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 600,
                        transition: 'opacity 0.2s',
                        outline: 'none',
                      }}
                      onClick={handleNextTrigger}
                      aria-label="Next trigger"
                      tabIndex={0}
                      onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px var(--interactive-accent)'}
                      onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      Next Trigger {NextIcon}
                    </button>
                  </div>
                </div>
                {/* Entry count badge and timer side by side, centered below input, timer first. Labels perfectly aligned. */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0.5em auto 0.5em auto', maxWidth: 800 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5em' }}>
                    {/* Timer display (left) */}
                    {countdownActive && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
                          <div
                            style={{
                              position: 'relative',
                              width: 80,
                              height: 80,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: timerShake ? 'shake 0.6s' : 'none',
                            }}
                          >
                            <svg width={80} height={80}>
                              <circle
                                cx={40}
                                cy={40}
                                r={RADIUS}
                                fill="none"
                                stroke="var(--background-modifier-border)"
                                strokeWidth={6}
                              />
                              <circle
                                cx={40}
                                cy={40}
                                r={RADIUS}
                                fill="none"
                                stroke={timerColor}
                                strokeWidth={6}
                                strokeDasharray={CIRCUM}
                                strokeDashoffset={CIRCUM * (1 - timer / 30)}
                                style={{ transition: 'stroke 0.3s, stroke-dashoffset 0.2s' }}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span
                              style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.1em',
                                fontWeight: 700,
                                color: timerColor,
                                letterSpacing: '0.02em',
                                transition: 'color 0.3s',
                                userSelect: 'none',
                              }}
                            >
                              {timer.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Captured count (right) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 80 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--background-modifier-active)',
                          color: 'var(--text-normal)',
                          borderRadius: 16,
                          width: 60,
                          height: 60,
                          fontSize: '2.1em',
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          boxShadow: entryBadgePulse ? '0 0 0 6px var(--background-modifier-border)' : '0 1px 4px rgba(0,0,0,0.04)',
                          transition: 'box-shadow 0.3s',
                          textAlign: 'center',
                        }}
                        aria-live="polite"
                      >
                        {entries.length}
                      </span>
                    </div>
                  </div>
                  {/* Labels row, perfectly aligned under numbers */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5em', marginTop: '-0.2em' }}>
                    {countdownActive && (
                      <span style={{ color: 'var(--text-faint)', fontSize: '1em', minWidth: 80, textAlign: 'center' }}>seconds left</span>
                    )}
                    <span style={{ color: 'var(--text-faint)', fontSize: '1em', minWidth: 60, textAlign: 'center' }}>captured</span>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Bottom buttons always visible */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 800, marginTop: '1.2em' }}>
            <button
              style={{
                fontSize: '1.2em',
                padding: '0.5em 1.5em',
                borderRadius: '8px',
                background: 'var(--interactive-accent)',
                color: 'var(--text-on-accent)',
                border: 'none',
                cursor: 'pointer',
                marginRight: '1em',
                alignSelf: 'flex-start',
              }}
              onClick={() => setScreen('Intro')}
            >
              Back to Intro
            </button>
            <button
              style={{
                fontSize: '1.2em',
                padding: '0.5em 1.5em',
                borderRadius: '8px',
                background: 'var(--interactive-accent)',
                color: 'var(--text-on-accent)',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-end',
              }}
              onClick={async () => { if (inputValue.trim()) await addEntry(); setScreen('End'); }}
              disabled={entries.length === 0}
            >
              Go to End
            </button>
          </div>
        </div>
      )}
      {screen === 'End' && (
        <>
           {/* Confetti celebration */}
           {showConfetti && <Confetti />}
           {/* Animated End screen transition */}
           <div
             style={{
               animation: 'fadein-slideup 0.7s cubic-bezier(.4,1.3,.6,1)',
               background: 'var(--background-secondary)',
               borderRadius: 16,
               boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
               maxWidth: 600,
               margin: '2em auto',
               padding: '2em 1.5em',
               position: 'relative',
             }}
             tabIndex={0}
             aria-label="End screen summary"
           >
           <h2>Mind cleared!</h2>
          <div style={{ margin: '1.5em 0', fontSize: '1.3em', color: 'var(--text-normal)', textAlign: 'center', fontWeight: 700 }}>
            {entries.length} thought{entries.length === 1 ? '' : 's'} collected
          </div>
           {/* Motivational quote */}
           <div style={{
             margin: '2em auto 1em auto',
             fontSize: '1.15em',
             color: 'var(--text-faint)',
             fontStyle: 'italic',
             textAlign: 'center',
             maxWidth: 500,
           }}>
             "Small actions, done consistently, create big change."
           </div>
           <button
             style={{
               fontSize: '1.2em',
               padding: '0.5em 1.5em',
               borderRadius: '8px',
               background: 'var(--interactive-accent)',
               color: 'var(--text-on-accent)',
               border: 'none',
               cursor: 'pointer',
             }}
             onClick={() => {
               resetAllExceptCountdown();
               setScreen('Intro');
             }}
             aria-label="Back to selection"
           >
             Back to selection
           </button>
           </div>
           {/* End screen fade/slide animation keyframes */}
           <style>{`
             @keyframes fadein-slideup {
               0% { opacity: 0; transform: translateY(40px); }
               100% { opacity: 1; transform: translateY(0); }
             }
           `}</style>
           {/* Show confetti for 1.5s on mount */}
           <script dangerouslySetInnerHTML={{__html:`
             setTimeout(() => { document.querySelector('[aria-label="End screen summary"]').focus(); }, 800);
           `}} />
           {/* Show confetti on every End screen mount */}
           {useEffect(() => { setShowConfetti(true); const t = setTimeout(() => setShowConfetti(false), 1000); return () => clearTimeout(t); }, [screen])}
        </>
      )}
    </div>
  );
} 