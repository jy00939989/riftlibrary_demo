// 氛围系统模块
import { state, saveState } from './state.js';
import { getAtmosphereStage, getRandomDescription } from '../data/atmosphere.js';

export function getCurrentAtmosphereText() {
  const stage = getAtmosphereStage(state.library.atmosphere);
  return getRandomDescription(stage);
}

export function getStageInfo() {
  const stage = getAtmosphereStage(state.library.atmosphere);
  return {
    level: stage.level,
    name: stage.name,
    value: state.library.atmosphere,
    next: stage.max - state.library.atmosphere
  };
}
