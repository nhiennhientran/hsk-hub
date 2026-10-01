import type { PracticeState } from '../types.ts';
declare const engine: {
  APP: 'hsk1-stage3'; KEY: string; SCHEMA: 1; MAX_BACKUP_BYTES: number;
  blank(): PracticeState;
  importBackup(input: unknown, catalog: unknown): PracticeState;
  exportBackup(input: unknown, catalog: unknown): PracticeState;
  backupByteLength(input: unknown): number;
};
export default engine;
