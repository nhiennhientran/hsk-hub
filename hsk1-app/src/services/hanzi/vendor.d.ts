export interface HanziData {
  strokes: string[];
  medians: [number, number][][];
  radStrokes?: number[];
}

export interface WriterOptions {
  width: number;
  height: number;
  padding: number;
  showCharacter?: boolean;
  showOutline?: boolean;
  strokeColor?: string;
  radicalColor?: string;
  outlineColor?: string;
  highlightColor?: string;
  delayBetweenStrokes?: number;
  strokeAnimationSpeed?: number;
  charDataLoader: () => HanziData;
}

export class ManagedHanziWriter {
  constructor(target: HTMLElement, options: WriterOptions);
  setCharacter(character: string): Promise<void>;
  animateCharacter(): Promise<unknown>;
  pauseAnimation(): Promise<unknown>;
  showCharacter(options?: {duration?: number}): Promise<unknown>;
  quiz(options?: {showHintAfterMisses?: number; onMistake?: (event: {strokeNum: number; totalMistakes: number}) => void; onCorrectStroke?: (event: {strokeNum: number; strokesRemaining: number}) => void; onComplete?: (event: {totalMistakes: number}) => void}): Promise<unknown>;
  cancelQuiz(): void;
  updateDimensions(options: {width: number; height: number}): void;
  dispose(): void;
}
