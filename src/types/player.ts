export type YTPlayerState =
  | 'UNSTARTED' // -1
  | 'ENDED'     // 0
  | 'PLAYING'   // 1
  | 'PAUSED'    // 2
  | 'BUFFERING' // 3
  | 'CUED';     // 5

export interface YTPlayerError {
  code: number;
  message: string;
  isFatal: boolean;
}

export interface PlayerControlsState {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isReady: boolean;
  playbackRate: number;
}
