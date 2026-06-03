import type { GainSet } from "../physics/types"

export interface GainPreset {
  id: string
  name: string
  description: string
  gains: GainSet
}

export const gainPresets: GainPreset[] = [
  {
    id: "well-tuned",
    name: "Well Tuned",
    description: "Fast altitude capture with damping and low steady-state error.",
    gains: {
      altitude: { kp: 5.8, ki: 1.4, kd: 3.2 },
      roll: { kp: 6.2, ki: 0.35, kd: 2.15 },
      pitch: { kp: 6.2, ki: 0.35, kd: 2.15 },
      yaw: { kp: 2.5, ki: 0.22, kd: 0.82 },
    },
  },
  {
    id: "overdamped",
    name: "Sluggish",
    description: "Low proportional action and heavier derivative damping.",
    gains: {
      altitude: { kp: 2.1, ki: 0.35, kd: 4.4 },
      roll: { kp: 2.2, ki: 0.08, kd: 2.8 },
      pitch: { kp: 2.2, ki: 0.08, kd: 2.8 },
      yaw: { kp: 0.9, ki: 0.05, kd: 1.25 },
    },
  },
  {
    id: "underdamped",
    name: "Oscillatory",
    description: "Aggressive P with too little damping, useful for seeing overshoot.",
    gains: {
      altitude: { kp: 9.2, ki: 0.25, kd: 0.75 },
      roll: { kp: 10.4, ki: 0.08, kd: 0.7 },
      pitch: { kp: 10.4, ki: 0.08, kd: 0.7 },
      yaw: { kp: 4.7, ki: 0.02, kd: 0.16 },
    },
  },
  {
    id: "unstable",
    name: "Unstable",
    description: "High gain with integral buildup; expect saturation and attitude loss.",
    gains: {
      altitude: { kp: 13.5, ki: 5.2, kd: 0.15 },
      roll: { kp: 15.5, ki: 1.8, kd: 0.12 },
      pitch: { kp: 15.5, ki: 1.8, kd: 0.12 },
      yaw: { kp: 7.2, ki: 1.2, kd: 0.08 },
    },
  },
]

export const defaultPreset = gainPresets[0]
