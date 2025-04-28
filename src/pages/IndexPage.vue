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
    <div class="q-mt-lg row text-h5 items-center">
      <div>Progression:</div>
      <div
        class="q-ml-sm q-pa-sm rounded-borders"
        :class="progressionAsChords.length === 0 ? 'bg-yellow-2' : 'bg-green-2'"
      >
        {{
          progressionAsRomanNumerals.length > 0 ? progressionAsRomanNumerals.join('-') : '&nbsp;'
        }}
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
            <q-select outlined v-model="mode" :options="modeOptions" />
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
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { generateProgression, generateChords } from '../utils/generateProgression.js'
import Soundfont from 'soundfont-player'
import { ref, computed, onMounted } from 'vue'

const allowModalMixture = ref(false)
const allowRepeatChords = ref(false)
const progressionAsRomanNumerals = ref([])
const progressionAsChords = ref([])
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
const key = ref('C')
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

function handleGenerateProgression() {
  stopProgressionLoop()
  progressionAsRomanNumerals.value = generateProgression(
    mode.value,
    numberOfChords.value,
    possibleChords.value,
    allowModalMixture.value,
    allowRepeatChords.value,
  )
  progressionAsChords.value = generateChords(
    key.value,
    mode.value,
    progressionAsRomanNumerals.value,
  )
  console.log('progressionAsChords')
  console.log(progressionAsChords.value)
}

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
</style>
