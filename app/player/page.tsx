'use client';

import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { VideoTitleBar, VideoDescription } from '@/components/player/VideoMetadata';
import { EpisodeList } from '@/components/player/EpisodeList';
import { PlayerError } from '@/components/player/PlayerError';
import { SourceSelector, SourceInfo } from '@/components/player/SourceSelector';
import { useVideoPlayer } from '@/lib/hooks/useVideoPlayer';
import { useHistory } from '@/lib/store/history-store';
import { FavoritesSidebar } from '@/components/favorites/FavoritesSidebar';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { PlayerNavbar } from '@/components/player/PlayerNavbar';
import { settingsStore } from '@/lib/store/settings-store';

function PlayerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPremium = searchParams.get('premium') === '1';
  const { addToHistory } = useHistory(isPremium);

  const videoId = searchParams.get('id');
  const source = searchParams.get('source');
  const title = searchParams.get('title');
  const episodeParam = searchParams.get('episode');
  const groupedSourcesParam = searchParams.get('groupedSources');

  // Track settings
  const [isReversed, setIsReversed] = useState(() =>
    typeof window !== 'undefined' ? settingsStore.getSettings().episodeReverseOrder : false
  );

  // Sync with store changes if any (though usually it's one-way from UI to store)
  useEffect(() => {
    setIsReversed(settingsStore.getSettings().episodeReverseOrder);
  }, []);

  // Redirect if no video ID or source
  if (!videoId || !source) {
    router.push('/');
    return null;
  }

  const {
    videoData,
    loading,
    videoError,
    currentEpisode,
    playUrl,
    setCurrentEpisode,
    setPlayUrl,
    setVideoError,
    fetchVideoDetails,
  } = useVideoPlayer(videoId, source, episodeParam, isReversed);

  // Parse grouped sources if available
  const groupedSources = useMemo<SourceInfo[]>(() => {
    let sources: SourceInfo[] = [];
    if (groupedSourcesParam) {
      try {
        sources = JSON.parse(groupedSourcesParam);
      } catch {
        sources = [];
      }
    }

    // Always ensure the current source is in the list
    if (source && !sources.find(s => s.source === source)) {
      sources.unshift({
        id: videoId || '',
        source: source,
        sourceName: source,
        pic: videoData?.vod_pic
      });
    }
    return sources;
  }, [groupedSourcesParam, source, videoId, videoData?.vod_pic]);

  // Track current source for switching
  const [currentSourceId, setCurrentSourceId] = useState(source);

  // Add initial history entry when video data is loaded
  useEffect(() => {
    if (videoData && playUrl && videoId) {
      // Map episodes to include index
      const mappedEpisodes = videoData.episodes?.map((ep: any, idx: number) => ({
        name: ep.name || `第${idx + 1}集`,
        url: ep.url,
        index: idx,
      })) || [];

      addToHistory(
        videoId,
        videoData.vod_name || title || '未知视频',
        playUrl,
        currentEpisode,
        source,
        0, // Initial playback position
        0, // Will be updated by VideoPlayer
        videoData.vod_pic,
        mappedEpisodes
      );
    }
  }, [videoData, playUrl, videoId, currentEpisode, source, title, addToHistory]);

  const handleEpisodeClick = useCallback((episode: any, index: number) => {
    setCurrentEpisode(index);
    setPlayUrl(episode.url);
    setVideoError('');

    // Update URL to reflect current episode
    const params = new URLSearchParams(searchParams.toString());
    params.set('episode', index.toString());
    router.replace(`/player?${params.toString()}`, { scroll: false });
  }, [searchParams, router, setCurrentEpisode, setPlayUrl, setVideoError]);

  const handleToggleReverse = (reversed: boolean) => {
    setIsReversed(reversed);
    const settings = settingsStore.getSettings();
    settingsStore.saveSettings({
      ...settings,
      episodeReverseOrder: reversed
    });
  };

  // Handle auto-next episode
  const handleNextEpisode = useCallback(() => {
    const episodes = videoData?.episodes;
    if (!episodes) return;

    let nextIndex;
    if (!isReversed) {
      if (currentEpisode >= episodes.length - 1) return;
      nextIndex = currentEpisode + 1;
    } else {
      if (currentEpisode <= 0) return;
      nextIndex = currentEpisode - 1;
    }

    const nextEpisode = episodes[nextIndex];
    if (nextEpisode) {
      handleEpisodeClick(nextEpisode, nextIndex);
    }
  }, [videoData, currentEpisode, isReversed, handleEpisodeClick]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      {/* Glass Navbar */}
      <PlayerNavbar isPremium={isPremium} />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent-color)] border-t-transparent mb-4"></div>
            <p className="text-[var(--text-color-secondary)]">正在加载视频详情...</p>
          </div>
        ) : videoError && !videoData ? (
          <PlayerError
            error={videoError}
            onBack={() => router.back()}
            onRetry={fetchVideoDetails}
          />
        ) : (
          <div className="space-y-3">
            {/* 1. Video Player - Full Width */}
            <VideoPlayer
              playUrl={playUrl}
              videoId={videoId || undefined}
              currentEpisode={currentEpisode}
              onBack={() => router.back()}
              totalEpisodes={videoData?.episodes?.length || 0}
              onNextEpisode={handleNextEpisode}
              isReversed={isReversed}
              isPremium={isPremium}
            />

            {/* 2. Title Bar + Action Buttons */}
            <VideoTitleBar
              videoData={videoData}
              source={source}
              title={title}
            >
              {/* Favorite Button inline */}
              {videoData && videoId && (
                <FavoriteButton
                  videoId={videoId}
                  source={source}
                  title={videoData.vod_name || title || '未知视频'}
                  poster={videoData.vod_pic}
                  type={videoData.type_name}
                  year={videoData.vod_year}
                  size={20}
                  isPremium={isPremium}
                />
              )}
            </VideoTitleBar>

            {/* 3. Source Selector - Inline pills (only when multiple sources) */}
            {groupedSources.length > 1 && (
              <SourceSelector
                sources={groupedSources}
                currentSource={currentSourceId || source || ''}
                onSourceChange={(newSource) => {
                  const params = new URLSearchParams();
                  params.set('id', String(newSource.id));
                  params.set('source', newSource.source);
                  params.set('title', title || '');
                  if (groupedSourcesParam) {
                    params.set('groupedSources', groupedSourcesParam);
                  }
                  setCurrentSourceId(newSource.source);
                  router.replace(`/player?${params.toString()}`, { scroll: false });
                }}
              />
            )}

            {/* 4. Episode List - Horizontal Grid */}
            <EpisodeList
              episodes={videoData?.episodes || null}
              currentEpisode={currentEpisode}
              isReversed={isReversed}
              onEpisodeClick={handleEpisodeClick}
              onToggleReverse={handleToggleReverse}
            />

            {/* 5. Description - Collapsible */}
            <VideoDescription
              videoData={videoData}
              source={source}
              title={title}
            />
          </div>
        )}
      </main>

      {/* Favorites Sidebar - Left */}
      <FavoritesSidebar isPremium={isPremium} />
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--accent-color)] border-t-transparent"></div>
      </div>
    }>
      <PlayerContent />
    </Suspense>
  );
}
