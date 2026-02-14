'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation';

interface Episode {
  name?: string;
  url: string;
}

interface EpisodeListProps {
  episodes: Episode[] | null;
  currentEpisode: number;
  isReversed?: boolean;
  onEpisodeClick: (episode: Episode, index: number) => void;
  onToggleReverse?: (reversed: boolean) => void;
}

const INITIAL_VISIBLE_COUNT = 30; // Show first 30 episodes by default

export function EpisodeList({
  episodes,
  currentEpisode,
  isReversed = false,
  onEpisodeClick,
  onToggleReverse
}: EpisodeListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoized display episodes - reversed if toggle is on
  const displayEpisodes = useMemo(() => {
    if (!episodes) return null;
    return isReversed ? [...episodes].reverse() : episodes;
  }, [episodes, isReversed]);

  // Map display index to original index
  const getOriginalIndex = useCallback((displayIndex: number) => {
    if (!episodes || !isReversed) return displayIndex;
    return episodes.length - 1 - displayIndex;
  }, [episodes, isReversed]);

  // Map original index to display index (for highlighting current episode)
  const getDisplayIndex = useCallback((originalIndex: number) => {
    if (!episodes || !isReversed) return originalIndex;
    return episodes.length - 1 - originalIndex;
  }, [episodes, isReversed]);

  // Determine visible episodes
  const visibleEpisodes = useMemo(() => {
    if (!displayEpisodes) return null;
    if (isExpanded || displayEpisodes.length <= INITIAL_VISIBLE_COUNT) {
      return displayEpisodes;
    }
    return displayEpisodes.slice(0, INITIAL_VISIBLE_COUNT);
  }, [displayEpisodes, isExpanded]);

  const hasMore = displayEpisodes && displayEpisodes.length > INITIAL_VISIBLE_COUNT;

  // Keyboard navigation
  useKeyboardNavigation({
    enabled: true,
    containerRef: listRef,
    currentIndex: getDisplayIndex(currentEpisode),
    itemCount: episodes?.length || 0,
    orientation: 'vertical',
    onNavigate: useCallback((index: number) => {
      buttonRefs.current[index]?.focus();
      buttonRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, []),
    onSelect: useCallback((displayIndex: number) => {
      if (episodes) {
        const originalIndex = getOriginalIndex(displayIndex);
        if (episodes[originalIndex]) {
          onEpisodeClick(episodes[originalIndex], originalIndex);
        }
      }
    }, [episodes, onEpisodeClick, getOriginalIndex]),
  });

  const showReverseToggle = episodes && episodes.length > 1;

  return (
    <Card hover={false}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
          <Icons.List size={18} className="sm:w-5 sm:h-5" />
          <span>选集</span>
          {episodes && (
            <Badge variant="primary">{episodes.length}</Badge>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {/* Reverse order toggle button */}
          {showReverseToggle && (
            <button
              onClick={() => onToggleReverse?.(!isReversed)}
              className={`
                p-1.5 rounded-[var(--radius-2xl)] transition-all duration-200
                ${isReversed
                  ? 'bg-[var(--accent-color)] text-white'
                  : 'bg-[var(--glass-bg)] text-[var(--text-color-secondary)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)]'
                }
              `}
              aria-label={isReversed ? '恢复正序' : '倒序排列'}
              title={isReversed ? '恢复正序' : '倒序排列'}
            >
              <Icons.ArrowUpDown size={16} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={listRef}
        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2"
        role="radiogroup"
        aria-label="剧集选择"
      >
        {visibleEpisodes && visibleEpisodes.length > 0 ? (
          visibleEpisodes.map((episode, displayIndex) => {
            const originalIndex = getOriginalIndex(displayIndex);
            const isCurrentEpisode = currentEpisode === originalIndex;
            // Determine display label
            const label = episode.name || `第${originalIndex + 1}集`;
            // Use shorter label for grid buttons
            const shortLabel = label.length > 6 ? label.slice(0, 5) + '…' : label;

            return (
              <button
                key={originalIndex}
                ref={(el) => { buttonRefs.current[displayIndex] = el; }}
                onClick={() => onEpisodeClick(episode, originalIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEpisodeClick(episode, originalIndex);
                  }
                }}
                tabIndex={0}
                role="radio"
                aria-checked={isCurrentEpisode}
                aria-current={isCurrentEpisode ? 'true' : undefined}
                aria-label={`${label}${isCurrentEpisode ? '，当前播放' : ''}`}
                title={label}
                className={`
                  px-2 py-2.5 rounded-xl text-center transition-all duration-200 cursor-pointer
                  text-xs sm:text-sm font-medium truncate
                  ${isCurrentEpisode
                    ? 'bg-[var(--accent-color)] text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--accent-color)_40%,transparent)] ring-1 ring-[var(--accent-color)]'
                    : 'bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] text-[var(--text-color)] border border-[var(--glass-border)] hover:border-[var(--accent-color)]/30'
                  }
                  focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-1
                `}
              >
                {shortLabel}
              </button>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-[var(--text-secondary)]">
            <Icons.Inbox size={40} className="text-[var(--text-color-secondary)] mx-auto mb-2" />
            <p className="text-sm">暂无剧集信息</p>
          </div>
        )}
      </div>

      {/* Expand / Collapse button */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full py-2 text-sm font-medium text-[var(--accent-color)] hover:text-[var(--text-color)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)] rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <Icons.ChevronUp size={16} />
              收起 ({displayEpisodes!.length} 集)
            </>
          ) : (
            <>
              <Icons.ChevronDown size={16} />
              展开全部 ({displayEpisodes!.length} 集)
            </>
          )}
        </button>
      )}
    </Card>
  );
}
