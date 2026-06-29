<template>
  <q-page class="flex column flex-center full-width bg-blue-4">
    <div class="q-mt-lg">
      <q-btn color="primary" size="xl" class="q-mr-sm" @click="handleGenerateProgression"
        >Generate</q-btn
      >
      <q-btn
        color="primary"
        size="xl"
        @click="playProgression"
        :disable="progressionAsChords.length == 0"
        >{{ isPlaying ? 'Stop playing' : 'Play progression' }}</q-btn
      >
    </div>
    <div class="q-mt-lg column text-h4 items-center justify-center bg-blue-1 q-pa-md">
      <div class="q-mb-md">Progression:</div>
      <div class="row items-start justify-center q-gutter-sm">
        <div v-for="(slot, i) in progression" :key="i" class="column items-center">
          <div class="chord-notes-hint text-caption text-grey-8">
            {{ hoveredChord === i ? chordNotes(key, slot.roman).join(' ') : '' }}
          </div>
          <q-select
            outlined
            dense
            emit-value
            map-options
            bg-color="green-2"
            :model-value="slot.roman"
            :options="optionsForSlot(slot.roman)"
            @update:model-value="(value) => onChordChange(i, value)"
            @mouseenter="hoveredChord = i"
            @mouseleave="hoveredChord = null"
            style="min-width: 120px"
          />
          <q-btn
            flat
            round
            dense
            class="q-mt-xs"
            :icon="slot.locked ? 'lock' : 'lock_open'"
            :color="slot.locked ? 'primary' : 'grey-6'"
            @click="toggleLock(i)"
          >
            <q-tooltip>{{ slot.locked ? 'Locked' : 'Unlocked' }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="q-mt-xl rounded-borders options-border bg-blue-1">
      <div class="text-h4 bg-blue-1 q-py-sm row justify-center options-header-border">Options</div>

      <div class="q-pa-md">
        <div class="row items-center options-width">
          <div class="q-mr-sm text-h6 col">Key:</div>
          <div class="col-5">
            <q-select outlined v-model="key" :options="keyOptions" />
          </div>
          <div class="col-5">
            <q-select outlined emit-value map-options v-model="mode" :options="modeOptions" />
          </div>
        </div>
        <q-separator class="q-my-md"></q-separator>

        <div class="row options-width">
          <div class="text-h6 col items-center row">Number of chords:</div>
          <div class="col">
            <q-slider
              v-model="numberOfChords"
              color="green"
              markers
              snap
              marker-labels
              :min="3"
              :max="8"
            />
          </div>
        </div>
        <q-separator class="q-my-md"></q-separator>

        <div class="row items-center text-h6 options-width">
          <div class="col">Chords included in progression:</div>
          <div class="col text-subtitle1">
            <q-option-group
              v-model="possibleChords"
              :options="possibleChordOptions"
              inline
              color="green"
              type="checkbox"
            />
          </div>
        </div>
        <q-separator class="q-my-md"></q-separator>

        <div class="row items-center text-h6 options-width">
          <div class="col">Allow modal mixture:</div>
          <q-checkbox class="col" color="green" v-model="allowModalMixture" />
        </div>
        <q-separator class="q-my-md"></q-separator>

        <div class="row items-center text-h6 options-width">
          <div class="col">Allow repeat chords:</div>
          <q-checkbox class="col" color="green" v-model="allowRepeatChords" />
        </div>
        <q-separator class="q-my-md"></q-separator>

        <div class="row items-center text-h6 options-width">
          <div class="col">Re-voice whole progression on chord change:</div>
          <q-checkbox class="col" color="green" v-model="reVoiceWhole" />
        </div>
        <q-separator class="q-my-md"></q-separator>

        <div class="row items-center text-h6 options-width">
          <div class="col">Locked chords keep their voicing:</div>
          <q-checkbox class="col" color="green" v-model="lockVoicingToo" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import {
  generateProgression,
  generateChords,
  getAvailableChords,
  setRomanToMode,
  chordName,
  chordNotes,
} from '../utils/generateProgression.js'
import Soundfont from 'soundfont-player'
import { ref, computed, watch, onMounted } from 'vue'

const allowModalMixture = ref(false)
const allowRepeatChords = ref(false)
// Re-voice the whole progression (vs. just the changed chord) when a chord is edited.
const reVoiceWhole = ref(false)
// Locked chords also keep their exact voicing (vs. only their Roman-numeral identity).
const lockVoicingToo = ref(false)
// Index of the chord slot currently hovered, for showing its notes as a hint.
const hoveredChord = ref(null)
const defaultKey = 'C'
const defaultProgression = ['I', 'vi', 'IV', 'V']
// Each slot: { roman, locked, voicing: [bass, tenor, alto, soprano] }
const progression = ref(
  generateChords(defaultKey, 'major', defaultProgression).map((voicing, i) => ({
    roman: defaultProgression[i],
    locked: false,
    voicing,
  })),
)
const mode = ref('major')
const modeOptions = ref([
  {
    label: 'Minor',
    value: 'minor',
  },
  {
    label: 'Major',
    value: 'major',
  },
])
const numberOfChords = ref(4)
const key = ref(defaultKey)
const keyOptions = ref(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
const possibleChordOptions = computed(() => [
  {
    label: 'I',
    value: 'i',
  },
  {
    label: 'II',
    value: 'ii',
  },
  {
    label: 'III',
    value: 'iii',
  },
  {
    label: 'IV',
    value: 'iv',
  },
  {
    label: 'V',
    value: 'v',
  },
  {
    label: 'VI',
    value: 'vi',
  },
  {
    label: 'VII',
    value: 'vii',
  },
])

const possibleChords = ref([...possibleChordOptions.value.map((chord) => chord.value)])

// Roman numerals offered in each chord dropdown, derived from the current options.
const availableChords = computed(() =>
  getAvailableChords(mode.value, possibleChords.value, allowModalMixture.value),
)

// Options for one dropdown: the available Romans (plus the slot's own value so a selected
// chord stays visible even if its degree is later unchecked), each labelled with the chord
// name spelled in the current key. Referencing key.value keeps labels reactive to key changes.
function optionsForSlot(roman) {
  const romans = availableChords.value.includes(roman)
    ? availableChords.value
    : [...availableChords.value, roman]
  return romans.map((value) => ({ label: `${value} ( ${chordName(key.value, value)} )`, value }))
}

// Voicings drive playback; expose them in the shape the audio player already expects.
const progressionAsChords = computed(() => progression.value.map((slot) => slot.voicing))

// Voice `slots` (optionally keeping `fixedVoicings` per index) and commit to state.
function applyVoicings(slots, fixedVoicings = []) {
  const voicings = generateChords(
    key.value,
    mode.value,
    slots.map((slot) => slot.roman),
    fixedVoicings,
  )
  progression.value = slots.map((slot, i) => ({ ...slot, voicing: voicings[i] }))
}

function handleGenerateProgression() {
  stopProgressionLoop()
  const romans = generateProgression(
    mode.value,
    numberOfChords.value,
    possibleChords.value,
    allowModalMixture.value,
    allowRepeatChords.value,
  )
  // Keep locked chords (by index); take a fresh Roman for the rest.
  const slots = romans.map((roman, i) => {
    const existing = progression.value[i]
    return existing && existing.locked
      ? { roman: existing.roman, locked: true, voicing: existing.voicing }
      : { roman, locked: false, voicing: null }
  })
  const fixed = slots.map((slot) => (slot.locked && lockVoicingToo.value ? slot.voicing : null))
  applyVoicings(slots, fixed)
}

function onChordChange(index, newRoman) {
  stopProgressionLoop()
  const slots = progression.value.map((slot, i) =>
    i === index ? { ...slot, roman: newRoman } : { ...slot },
  )
  const fixed = reVoiceWhole.value
    ? slots.map((slot, i) => (i !== index && slot.locked && lockVoicingToo.value ? slot.voicing : null))
    : slots.map((slot, i) => (i === index ? null : slot.voicing))
  applyVoicings(slots, fixed)
}

function toggleLock(index) {
  progression.value = progression.value.map((slot, i) =>
    i === index ? { ...slot, locked: !slot.locked } : slot,
  )
}

// Changing the tonic transposes every chord (Romans unchanged); pitches change, so re-voice fully.
watch(key, () => {
  stopProgressionLoop()
  applyVoicings(progression.value.map((slot) => ({ ...slot })))
})

// Mode change: without modal mixture each chord adopts the new mode's quality for its degree;
// with modal mixture every chord retains its own mode.
watch(mode, (newMode) => {
  stopProgressionLoop()
  const slots = progression.value.map((slot) => ({
    ...slot,
    roman: allowModalMixture.value ? slot.roman : setRomanToMode(slot.roman, newMode),
  }))
  applyVoicings(slots)
})

// Turning modal mixture off: convert any borrowed chord back to the current mode so every
// value remains a valid dropdown option.
watch(allowModalMixture, (on) => {
  if (on) return
  const primary = getAvailableChords(mode.value, possibleChords.value, false)
  const slots = progression.value.map((slot) => ({
    ...slot,
    roman: primary.includes(slot.roman) ? slot.roman : setRomanToMode(slot.roman, mode.value),
  }))
  applyVoicings(slots)
})

// Audio player:
const isPlaying = ref(false)
let loopTimeout = null
const piano = ref(null)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

onMounted(async () => {
  piano.value = await Soundfont.instrument(audioCtx, 'electric_piano_2')
})

function playChord(notes, startTime) {
  notes.forEach((note) => {
    piano.value.play(note, startTime)
  })
}

function stopProgressionLoop() {
  clearTimeout(loopTimeout)
  isPlaying.value = false
}

function playProgression() {
  if (!piano.value) return

  if (isPlaying.value) {
    stopProgressionLoop()
    return
  }

  isPlaying.value = true

  let currentChordIndex = 0
  const intervalBetweenChords = 2500 // ms

  function playNextChord() {
    if (!isPlaying.value) {
      currentChordIndex = 0
      return
    }

    const chord = progressionAsChords.value[currentChordIndex]
    playChord(chord, audioCtx.currentTime)

    currentChordIndex++

    if (currentChordIndex >= progressionAsChords.value.length) {
      // Finished progression — reset immediately and start again after delay
      currentChordIndex = 0
      loopTimeout = setTimeout(playNextChord, intervalBetweenChords)
    } else {
      // Still inside the progression — continue as normal
      loopTimeout = setTimeout(playNextChord, intervalBetweenChords)
    }
  }

  playNextChord()
}
</script>
<style scoped>
.options-width {
  width: 400px;
}
.options-border {
  border: 1px solid rgba(0, 0, 0, 0.48);
}

.options-header-border {
  border-bottom: 1px solid rgba(0, 0, 0, 0.48);
}

/* Reserve space above each dropdown so the hovered-chord notes hint doesn't shift layout */
.chord-notes-hint {
  min-height: 1.5em;
  line-height: 1.5em;
}
</style>
