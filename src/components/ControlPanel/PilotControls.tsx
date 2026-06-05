import { useEffect, useRef } from "react"
import { FiCrosshair, FiRefreshCw, FiToggleLeft, FiToggleRight } from "react-icons/fi"
import { formatRadiansAsDegrees } from "../../physics/vector"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Panel } from "../ui/Panel"
import type { PointerEvent as ReactPointerEvent } from "react"

const DEAD_ZONE = 0.08
const PILOT_KEY_BY_CODE: Record<string, string> = {
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
}
const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"])
const KEYBOARD_KEYS = new Set(Object.values(PILOT_KEY_BY_CODE))
const GENERIC_USB_GAMEPAD_AXES = {
  leftX: 0,
  leftY: 1,
  rightPitch: 2,
  rightRollFallback: 5,
}
const RIGHT_ROLL_DETECT_THRESHOLD = 0.18

const clampAxis = (value: number): number => Math.max(-1, Math.min(1, value))

const applyDeadZone = (value: number): number => {
  const magnitude = Math.abs(value)
  if (magnitude < DEAD_ZONE) return 0
  return Math.sign(value) * ((magnitude - DEAD_ZONE) / (1 - DEAD_ZONE))
}

const shapeStickAxis = (value: number): number => {
  const centered = applyDeadZone(value)
  return Math.sign(centered) * Math.abs(centered) ** 1.35
}

const normalizeRawAxis = (value: number, neutral: number): number => {
  const delta = value - neutral
  const span = delta >= 0 ? 1 - neutral : neutral + 1
  if (Math.abs(span) < 0.001) return 0
  return clampAxis(delta / span)
}

const axisValue = (axes: readonly number[], neutralAxes: readonly number[], index: number): number =>
  shapeStickAxis(normalizeRawAxis(axes[index] ?? 0, neutralAxes[index] ?? 0))

const detectRightRollAxis = (axes: readonly number[], neutralAxes: readonly number[], currentAxis: number): number => {
  let bestAxis = currentAxis
  let bestMagnitude = Math.abs(normalizeRawAxis(axes[currentAxis] ?? 0, neutralAxes[currentAxis] ?? 0))

  axes.forEach((value, index) => {
    if (index === GENERIC_USB_GAMEPAD_AXES.leftX || index === GENERIC_USB_GAMEPAD_AXES.leftY || index === GENERIC_USB_GAMEPAD_AXES.rightPitch) {
      return
    }

    const magnitude = Math.abs(normalizeRawAxis(value, neutralAxes[index] ?? 0))
    if (magnitude > RIGHT_ROLL_DETECT_THRESHOLD && magnitude > bestMagnitude) {
      bestAxis = index
      bestMagnitude = magnitude
    }
  })

  return bestAxis
}

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable)

const normalizePilotKey = (event: KeyboardEvent): string => {
  const codeKey = PILOT_KEY_BY_CODE[event.code]
  if (codeKey) return codeKey
  return ARROW_KEYS.has(event.key) ? event.key : event.key.toLowerCase()
}

interface StickPadProps {
  label: string
  x: number
  y: number
  horizontalLabel: string
  verticalLabel: string
  onChange: (x: number, y: number) => void
}

function StickPad({ label, x, y, horizontalLabel, verticalLabel, onChange }: StickPadProps) {
  const activePointerRef = useRef<number | null>(null)

  const updateFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nextX = clampAxis(((event.clientX - rect.left) / rect.width - 0.5) * 2)
    const nextY = clampAxis(((event.clientY - rect.top) / rect.height - 0.5) * 2)
    onChange(nextX, nextY)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    activePointerRef.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    updateFromPointer(event)
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    activePointerRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    onChange(0, 0)
  }

  return (
    <div className="stick-card">
      <div className="stick-card-header">
        <span>{label}</span>
        <FiCrosshair aria-hidden="true" size={14} />
      </div>
      <div
        aria-label={label}
        className="stick-pad"
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        role="slider"
        tabIndex={0}
      >
        <span className="stick-axis stick-axis-y">{verticalLabel}</span>
        <span className="stick-axis stick-axis-x">{horizontalLabel}</span>
        <span
          className="stick-knob"
          style={{
            transform: `translate(-50%, -50%) translate(${x * 38}px, ${y * 38}px)`,
          }}
        />
      </div>
    </div>
  )
}

export function PilotControls() {
  const pilotInput = useSimulationStore((state) => state.pilotInput)
  const setpoints = useSimulationStore((state) => state.setpoints)
  const setPilotEnabled = useSimulationStore((state) => state.setPilotEnabled)
  const setPilotInput = useSimulationStore((state) => state.setPilotInput)
  const centerPilotInput = useSimulationStore((state) => state.centerPilotInput)
  const gamepadSeenRef = useRef(false)
  const gamepadActiveRef = useRef(false)
  const keyboardKeysRef = useRef<Set<string>>(new Set())
  const lastGamepadSignatureRef = useRef("")
  const rightRollAxisRef = useRef(GENERIC_USB_GAMEPAD_AXES.rightRollFallback)
  const neutralAxesRef = useRef<number[] | null>(null)

  useEffect(() => {
    let frameId = 0

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads?.() ?? []
      const gamepad = Array.from(gamepads).find((item): item is Gamepad => item !== null)

      if (!gamepad) {
        if (gamepadSeenRef.current) {
          gamepadSeenRef.current = false
          lastGamepadSignatureRef.current = ""
          neutralAxesRef.current = null
          rightRollAxisRef.current = GENERIC_USB_GAMEPAD_AXES.rightRollFallback
          gamepadActiveRef.current = false
          setPilotInput({
            source: "idle",
            gamepadName: null,
            leftX: 0,
            leftY: 0,
            rightX: 0,
            rightY: 0,
          })
        }
        frameId = requestAnimationFrame(pollGamepad)
        return
      }

      gamepadSeenRef.current = true
      if (!neutralAxesRef.current || neutralAxesRef.current.length !== gamepad.axes.length) {
        neutralAxesRef.current = Array.from(gamepad.axes)
        lastGamepadSignatureRef.current = ""
        gamepadActiveRef.current = false
      }

      if (keyboardKeysRef.current.size > 0) {
        frameId = requestAnimationFrame(pollGamepad)
        return
      }

      const neutralAxes = neutralAxesRef.current
      rightRollAxisRef.current = detectRightRollAxis(gamepad.axes, neutralAxes, rightRollAxisRef.current)
      const nextInput = {
        source: "gamepad" as const,
        gamepadName: gamepad.id,
        leftX: axisValue(gamepad.axes, neutralAxes, GENERIC_USB_GAMEPAD_AXES.leftX),
        leftY: axisValue(gamepad.axes, neutralAxes, GENERIC_USB_GAMEPAD_AXES.leftY),
        rightX: axisValue(gamepad.axes, neutralAxes, rightRollAxisRef.current),
        rightY: axisValue(gamepad.axes, neutralAxes, GENERIC_USB_GAMEPAD_AXES.rightPitch),
      }
      const hasGamepadInput =
        nextInput.leftX !== 0 || nextInput.leftY !== 0 || nextInput.rightX !== 0 || nextInput.rightY !== 0

      if (!hasGamepadInput && !gamepadActiveRef.current) {
        frameId = requestAnimationFrame(pollGamepad)
        return
      }

      if (hasGamepadInput && !useSimulationStore.getState().pilotInput.enabled) {
        setPilotEnabled(true)
      }

      gamepadActiveRef.current = hasGamepadInput
      const signature = `${nextInput.gamepadName}:${nextInput.leftX.toFixed(3)}:${nextInput.leftY.toFixed(3)}:${nextInput.rightX.toFixed(3)}:${nextInput.rightY.toFixed(3)}`

      if (signature !== lastGamepadSignatureRef.current) {
        lastGamepadSignatureRef.current = signature
        setPilotInput(nextInput)
      }

      frameId = requestAnimationFrame(pollGamepad)
    }

    frameId = requestAnimationFrame(pollGamepad)
    return () => cancelAnimationFrame(frameId)
  }, [setPilotEnabled, setPilotInput])

  useEffect(() => {
    const activeKeys = keyboardKeysRef.current

    const updateKeyboardInput = () => {
      const hasKey = (...keys: string[]) => keys.some((key) => activeKeys.has(key))
      const rightX = Number(hasKey("ArrowRight")) - Number(hasKey("ArrowLeft"))
      const rightY = Number(hasKey("ArrowDown")) - Number(hasKey("ArrowUp"))
      const hasInput = rightX !== 0 || rightY !== 0

      setPilotInput({
        source: hasInput ? "keyboard" : "idle",
        leftX: 0,
        leftY: 0,
        rightX,
        rightY,
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = normalizePilotKey(event)
      if (!KEYBOARD_KEYS.has(key) || isTypingTarget(event.target)) return
      event.preventDefault()
      activeKeys.add(key)
      activeKeys.add(event.code)
      setPilotEnabled(true)
      updateKeyboardInput()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = normalizePilotKey(event)
      if (!KEYBOARD_KEYS.has(key)) return
      event.preventDefault()
      activeKeys.delete(key)
      activeKeys.delete(event.code)
      updateKeyboardInput()
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true })
    window.addEventListener("keyup", handleKeyUp, { capture: true })

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
      window.removeEventListener("keyup", handleKeyUp, { capture: true })
    }
  }, [setPilotEnabled, setPilotInput])

  const setLeftStick = (x: number, y: number) =>
    setPilotInput({
      source: "virtual",
      leftX: x,
      leftY: y,
    })

  const setRightStick = (x: number, y: number) =>
    setPilotInput({
      source: "virtual",
      rightX: x,
      rightY: y,
    })

  const handleCenter = () => {
    const gamepads = navigator.getGamepads?.() ?? []
    const gamepad = Array.from(gamepads).find((item): item is Gamepad => item !== null)
    if (gamepad) {
      neutralAxesRef.current = Array.from(gamepad.axes)
      rightRollAxisRef.current = GENERIC_USB_GAMEPAD_AXES.rightRollFallback
      gamepadActiveRef.current = false
      lastGamepadSignatureRef.current = ""
    }
    centerPilotInput()
  }

  const sourceLabel =
    pilotInput.source === "keyboard"
      ? "Keyboard"
      : pilotInput.source === "virtual"
        ? "Virtual"
        : pilotInput.source === "gamepad"
          ? "Gamepad"
          : "Standby"

  return (
    <Panel data-guide="pilot" title="Pilot Controls" action={<Badge tone={pilotInput.enabled ? "live" : "warn"}>{sourceLabel}</Badge>}>
      <div className="pilot-grid">
        <StickPad
          horizontalLabel="Yaw"
          label="Left Stick"
          onChange={setLeftStick}
          verticalLabel="Lift"
          x={pilotInput.leftX}
          y={pilotInput.leftY}
        />
        <StickPad
          horizontalLabel="Roll"
          label="Right Stick"
          onChange={setRightStick}
          verticalLabel="Pitch"
          x={pilotInput.rightX}
          y={pilotInput.rightY}
        />
      </div>

      <div className="pilot-readouts">
        <div>
          <span>Alt</span>
          <strong>{setpoints.altitude.toFixed(2)} m</strong>
        </div>
        <div>
          <span>Yaw</span>
          <strong>{formatRadiansAsDegrees(setpoints.yaw).toFixed(0)} deg</strong>
        </div>
        <div>
          <span>Roll</span>
          <strong>{formatRadiansAsDegrees(setpoints.roll).toFixed(0)} deg</strong>
        </div>
        <div>
          <span>Pitch</span>
          <strong>{formatRadiansAsDegrees(setpoints.pitch).toFixed(0)} deg</strong>
        </div>
      </div>

      <div className="pilot-guide">
        <div>
          <span>Keyboard</span>
          <strong>Arrows: move</strong>
        </div>
        <div>
          <span>Gamepad</span>
          <strong>USB auto | Center trims</strong>
        </div>
      </div>

      <div className="toolbar-row" style={{ marginTop: 12 }}>
        <Button
          icon={pilotInput.enabled ? FiToggleRight : FiToggleLeft}
          onClick={() => setPilotEnabled(!pilotInput.enabled)}
          variant={pilotInput.enabled ? "primary" : "default"}
        >
          {pilotInput.enabled ? "Pilot On" : "Pilot Off"}
        </Button>
        <Button icon={FiRefreshCw} onClick={handleCenter}>
          Center
        </Button>
      </div>
    </Panel>
  )
}
