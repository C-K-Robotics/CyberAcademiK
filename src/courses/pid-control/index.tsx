import type { CourseBundle } from '../../content/types'
import { PidGainsProvider } from './PidGains'
import { BlockDiagram } from './components/BlockDiagram'
import { PlantSchematic } from './components/PlantSchematic'
import { ThreeTerms } from './components/ThreeTerms'
import { PIDSimulator } from './components/PIDSimulator'
import { ZieglerNichols } from './components/ZieglerNichols'
import { ArmSimulator } from './components/ArmSimulator'

/**
 * Course-specific code for the PID Control course. This bundle is auto-discovered
 * by slug — the folder name (`pid-control`) matches the course directory under
 * content/. The MDX content and all metadata live in content/, not here; this
 * file only supplies the interactive widgets the lesson references plus the
 * provider that lets the Ziegler–Nichols calculator push gains into the
 * live simulator.
 */
const bundle: CourseBundle = {
  Wrapper: PidGainsProvider,
  components: {
    BlockDiagram,
    PlantSchematic,
    ThreeTerms,
    PIDSimulator,
    ZieglerNichols,
    ArmSimulator,
  },
}

export default bundle
