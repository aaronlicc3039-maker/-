import { Vector3 } from 'three';

export enum AppState {
  FORMED = 'FORMED', // Tree shape
  CHAOS = 'CHAOS',   // Exploded shape
}

export interface ParticleData {
  chaosPos: Vector3;
  targetPos: Vector3;
  scale: number;
  color: string;
  speed: number;
}

export interface GestureResponse {
  gesture: 'OPEN_PALM' | 'CLOSED_FIST' | 'NONE';
}

export type GestureCallback = (state: AppState) => void;
