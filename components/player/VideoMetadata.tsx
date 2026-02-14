'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import { getSourceName } from '@/lib/utils/source-names';

interface VideoMetadataProps {
  videoData: any;
  source: string | null;
  title?: string | null;
}

/**
 * VideoTitleBar - Always visible title row below the player
 * Shows title, badges, and action buttons inline
 */
export function VideoTitleBar({ videoData, source, title, children }: VideoMetadataProps & { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-color)] leading-tight mb-2">
          {videoData?.vod_name || title}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {source && (
            <Badge variant="primary" className="backdrop-blur-md">
              <Icons.Check size={12} className="mr-1" />
              {getSourceName(source)}
            </Badge>
          )}
          {videoData?.type_name && (
            <Badge variant="secondary">{videoData.type_name}</Badge>
          )}
          {videoData?.vod_year && (
            <Badge variant="secondary">
              <Icons.Calendar size={12} className="mr-1" />
              {videoData.vod_year}
            </Badge>
          )}
          {videoData?.vod_area && (
            <Badge variant="secondary">
              <Icons.Globe size={12} className="mr-1" />
              {videoData.vod_area}
            </Badge>
          )}
        </div>
      </div>
      {/* Action buttons slot (Favorite, etc.) */}
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * VideoDescription - Collapsible description section
 * Shows poster, synopsis, cast, director info
 */
export function VideoDescription({ videoData, source, title }: VideoMetadataProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDescription = videoData?.vod_content || videoData?.vod_actor || videoData?.vod_director;

  if (!hasDescription && !videoData?.vod_pic) {
    return null;
  }

  return (
    <Card hover={false} className="p-3 sm:p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left cursor-pointer group"
      >
        <h3 className="text-sm sm:text-base font-semibold text-[var(--text-color)] flex items-center gap-2">
          <Icons.Info size={16} />
          简介
        </h3>
        <span className={`text-[var(--text-color-secondary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown size={18} />
        </span>
      </button>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {videoData?.vod_pic && (
            <img
              src={videoData.vod_pic}
              alt={videoData.vod_name}
              className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-xl border border-[var(--glass-border)] flex-shrink-0"
            />
          )}
          <div className="flex-1 space-y-2">
            {videoData?.vod_content && (
              <p className="text-sm text-[var(--text-color-secondary)] leading-relaxed">
                {videoData.vod_content.replace(/<[^>]*>/g, '')}
              </p>
            )}
            {videoData?.vod_actor && (
              <p className="text-xs text-[var(--text-color-secondary)]">
                <span className="font-semibold text-[var(--text-color)]">主演：</span>
                {videoData.vod_actor}
              </p>
            )}
            {videoData?.vod_director && (
              <p className="text-xs text-[var(--text-color-secondary)]">
                <span className="font-semibold text-[var(--text-color)]">导演：</span>
                {videoData.vod_director}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * VideoMetadata - Legacy combined component (kept for backward compatibility)
 */
export function VideoMetadata({ videoData, source, title }: VideoMetadataProps) {
  return (
    <Card hover={false}>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {videoData?.vod_pic && (
          <img
            src={videoData.vod_pic}
            alt={videoData.vod_name}
            className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-[var(--radius-2xl)] border border-[var(--glass-border)]"
          />
        )}
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-color)] mb-3">
            {videoData?.vod_name || title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {source && (
              <Badge variant="primary" className="backdrop-blur-md">
                <Icons.Check size={14} className="mr-1" />
                {getSourceName(source)}
              </Badge>
            )}
            {videoData?.type_name && (
              <Badge variant="secondary">{videoData.type_name}</Badge>
            )}
            {videoData?.vod_year && (
              <Badge variant="secondary">
                <Icons.Calendar size={14} className="mr-1" />
                {videoData.vod_year}
              </Badge>
            )}
            {videoData?.vod_area && (
              <Badge variant="secondary">
                <Icons.Globe size={14} className="mr-1" />
                {videoData.vod_area}
              </Badge>
            )}
          </div>
          {videoData?.vod_content && (
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              {videoData.vod_content.replace(/<[^>]*>/g, '')}
            </p>
          )}
          {videoData?.vod_actor && (
            <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mt-2">
              <span className="font-semibold">主演：</span>
              {videoData.vod_actor}
            </p>
          )}
          {videoData?.vod_director && (
            <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mt-1">
              <span className="font-semibold">导演：</span>
              {videoData.vod_director}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
