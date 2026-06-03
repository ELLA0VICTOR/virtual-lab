import { useEffect, useRef } from "react"
import { PHYSICS_DT } from "../physics/constants"
import { useSimulationStore } from "./simulationStore"

const MAX_STEPS_PER_FRAME = 48

export const useSimulationLoop = (): void => {
  const frameRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const accumulatorRef = useRef(0)

  useEffect(() => {
    const tick = (time: number) => {
      const previous = previousTimeRef.current ?? time
      const deltaSeconds = Math.min(0.08, (time - previous) / 1000)
      previousTimeRef.current = time

      const { running, speed, advanceSimulation } = useSimulationStore.getState()
      if (running) {
        accumulatorRef.current += deltaSeconds * speed
        const steps = Math.min(MAX_STEPS_PER_FRAME, Math.floor(accumulatorRef.current / PHYSICS_DT))
        if (steps > 0) {
          accumulatorRef.current -= steps * PHYSICS_DT
          advanceSimulation(steps)
        }
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])
}
