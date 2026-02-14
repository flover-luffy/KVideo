'use client';

/**
 * SourceSelector - Inline button group for selecting video source
 * Redesigned from card-based layout to compact inline pills
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import { LatencyBadge } from '@/components/ui/LatencyBadge';

export interface SourceInfo {
    id: string | number;
    source: string;
    sourceName?: string;
    latency?: number;
    pic?: string;
}

interface SourceSelectorProps {
    sources: SourceInfo[];
    currentSource: string;
    onSourceChange: (source: SourceInfo) => void;
    className?: string;
}

export function SourceSelector({
    sources,
    currentSource,
    onSourceChange,
    className = '',
}: SourceSelectorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [latencies, setLatencies] = useState<Record<string, number>>({});

    // Sort sources by latency
    const sortedSources = useMemo(() => {
        return [...sources].sort((a, b) => {
            const latA = latencies[a.source] ?? a.latency ?? Infinity;
            const latB = latencies[b.source] ?? b.latency ?? Infinity;
            return latA - latB;
        });
    }, [sources, latencies]);

    // Refresh latency for all sources
    const refreshLatencies = useCallback(async () => {
        setIsLoading(true);

        const results = await Promise.all(
            sources.map(async (source) => {
                try {
                    const response = await fetch('/api/ping', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: source.source,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        return { source: source.source, latency: data.latency };
                    }
                } catch {
                    // Ignore errors
                }
                return { source: source.source, latency: undefined };
            })
        );

        const newLatencies: Record<string, number> = {};
        results.forEach(({ source, latency }) => {
            if (latency !== undefined) {
                newLatencies[source] = latency;
            }
        });

        setLatencies(newLatencies);
        setIsLoading(false);
    }, [sources]);

    // Initialize latencies from sources
    useEffect(() => {
        const initial: Record<string, number> = {};
        sources.forEach(s => {
            if (s.latency !== undefined) {
                initial[s.source] = s.latency;
            }
        });
        setLatencies(initial);
    }, [sources]);

    if (sources.length <= 1) {
        return null;
    }

    return (
        <div className={`${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-1.5">
                    <Icons.Layers size={16} />
                    <span>视频来源</span>
                    <Badge variant="primary" className="text-xs">{sources.length}</Badge>
                </h3>
                <button
                    onClick={refreshLatencies}
                    disabled={isLoading}
                    className="ml-auto flex items-center gap-1 text-xs text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] transition-colors cursor-pointer disabled:opacity-50"
                >
                    <Icons.RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    测速
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {sortedSources.map((source, index) => {
                    const isCurrent = source.source === currentSource;
                    const latency = latencies[source.source] ?? source.latency;

                    return (
                        <button
                            key={`${source.source}-${index}`}
                            onClick={() => !isCurrent && onSourceChange(source)}
                            className={`
                                inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                                transition-all duration-200
                                ${isCurrent
                                    ? 'bg-[var(--accent-color)] text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--accent-color)_40%,transparent)]'
                                    : 'bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] text-[var(--text-color)] border border-[var(--glass-border)] hover:border-[var(--accent-color)]/30 cursor-pointer'
                                }
                            `}
                            aria-current={isCurrent ? 'true' : undefined}
                        >
                            {source.sourceName || source.source}
                            {latency !== undefined && (
                                <LatencyBadge latency={latency} />
                            )}
                            {isCurrent && <Icons.Play size={12} />}
                            {!isCurrent && index < 3 && (
                                <span className={`text-[10px] font-bold ${index === 0 ? 'text-yellow-500' :
                                        index === 1 ? 'text-gray-400' :
                                            'text-orange-400'
                                    }`}>
                                    #{index + 1}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
