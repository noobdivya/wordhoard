import { LEVEL_NAMES, type Level } from '../types/entry'

export function LevelChip({ level }: { level: Level | null }) {
  if (!level) {
    return (
      <span className="lv X" title="Not on the core word lists">
        Off-list
      </span>
    )
  }
  return (
    <span className={`lv ${level[0]}`} title={`CEFR level ${level} · ${LEVEL_NAMES[level]}`}>
      {level}
    </span>
  )
}
