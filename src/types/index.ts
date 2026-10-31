export interface SongMetadata {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  duration?: number;
}

export type PlayerState = 
  | 'UNSTARTED'
  | 'ENDED'
  | 'PLAYING'
  | 'PAUSED'
  | 'BUFFERING'
  | 'CUED';

export interface DemoSong {
  title: string;
  artist: string;
  videoId: string;
  defaultOffset?: number;
  category?: string;
  duration?: string;
}

import type { Station, CarriageBerth, TrainJourneyState } from '../data/trainStations';
export type TrainStation = Station;
export type { Station, CarriageBerth, TrainJourneyState };
export type { TaskItem } from '../components/TaskManager';
export type { FocusMode } from '../hooks/useFocusTimer';

export * from './player';
