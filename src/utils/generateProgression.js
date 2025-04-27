import {
  minorTriadMap,
  majorTriadMap,
  dimTriadMap,
  harmonicMinorScaleMap,
  majorScaleMap,
  romanNumeralToIndexMap,
  notesOctaveSort,
} from './chordKeyMapping'

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

function generateProgression(mode, numberOfChords, possibleChords) {
  const chordI = mode === 'major' ? 'I' : 'i'

  const majorMinorMap = {
    0: 'major',
    1: 'minor',
  }

  const indexOfIChord = getRandomInt(4)

  const chordProgression = []

  for (let i = 0; i < numberOfChords; i++) {
    const quality = majorMinorMap[getRandomInt(2)]
    let chord

    if (indexOfIChord === i) {
      chord = chordI
    } else {
      const chordIndexSelection = getRandomInt(possibleChords.length)
      chord = possibleChords[chordIndexSelection]
      possibleChords.splice(chordIndexSelection, 1)

      if (chord != 'vii' && chord.toLowerCase() != 'i' && quality === 'major') {
        chord = chord.toUpperCase()
      } else if (chord == 'vii') {
        if (quality === 'major') chord = chord.toUpperCase()
        else chord = `${chord} dim`
      }
    }

    chordProgression.push(chord)
  }

  return chordProgression
}

function removeScaleDegree7(tonic, chord) {
  const scaleDegree7 = removeSharpsAndFlats(majorScaleMap[tonic][majorScaleMap[tonic].length - 1])
  return chord.filter((note) => removeSharpsAndFlats(note) !== scaleDegree7)
}

function removeSharpsAndFlats(noteOrNotes) {
  if (typeof noteOrNotes === 'string') {
    return noteOrNotes[0]
  } else {
    return noteOrNotes.map((note) => {
      return note[0]
    })
  }
}

function chooseRandomNote(noteSelection) {
  return noteSelection[getRandomInt(noteSelection.length)]
}

function distanceBetweenTwoNotes(note1, note2) {
  const totalNotes = 7
  const upwardDistance = (note2 - note1 + totalNotes) % totalNotes
  const downwardDistance = (note1 - note2 + totalNotes) % totalNotes
  return Math.min(upwardDistance, downwardDistance)
}

function generateVoicedChords(tonic, mode, unvoicedChords) {
  // unvoicedChords = array of string arrays
  const voicesByPriority = ['soprano', 'bass', 'tenor', 'alto']
  const chordProgression = []

  unvoicedChords.forEach((chord) => {
    let chordNoteSelection = [...chord]
    const voicedChord = {
      soprano: '',
      bass: '',
      tenor: '',
      alto: '',
    }

    voicesByPriority.forEach((voice) => {
      let voiceNoteSelection = [...chordNoteSelection]
      let selectedNote

      if (voice === 'soprano') {
        if (chordProgression.length === 0) {
          // first chord
          voiceNoteSelection = removeScaleDegree7(tonic, chord)
          selectedNote = chooseRandomNote(voiceNoteSelection)
        } else {
          const previousSopranoNote = chordProgression[chordProgression.length - 1][3]

          // choose note closest to previousSopranoNote
          const noteSelectionByDistance = voiceNoteSelection.map((note) => {
            return distanceBetweenTwoNotes(
              notesOctaveSort.indexOf(note),
              notesOctaveSort.indexOf(previousSopranoNote),
            )
          })

          const indexOfClosestNote = noteSelectionByDistance.indexOf(
            Math.min(...noteSelectionByDistance),
          )
          selectedNote = voiceNoteSelection[indexOfClosestNote]
        }
      } else if (voice === 'bass') {
        if (chordProgression.length === 0) {
          // first chord
          voiceNoteSelection.pop() // remove 5th as choice
          selectedNote = chooseRandomNote(voiceNoteSelection)
        } else {
          // if bass and soprano were previously same note, remove current soprano choice from options
          const currentSopranoNote = voicedChord.soprano
          const previousSopranoNote = chordProgression[chordProgression.length - 1][3]
          const previousBassNote = chordProgression[chordProgression.length - 1][0]
          if (previousSopranoNote === previousBassNote) {
            voiceNoteSelection.splice(voiceNoteSelection.indexOf(currentSopranoNote), 1)
          }

          const noteSelectionByDistance = voiceNoteSelection.map((note) => {
            return distanceBetweenTwoNotes(
              notesOctaveSort.indexOf(note),
              notesOctaveSort.indexOf(previousBassNote),
            )
          })

          const indexOfClosestNote = noteSelectionByDistance.indexOf(
            Math.min(...noteSelectionByDistance),
          )
          selectedNote = voiceNoteSelection[indexOfClosestNote]
        }
      } else if (voice === 'tenor') {
        if (chordProgression.length === 0) {
          // first chord
          selectedNote = chooseRandomNote(voiceNoteSelection)
        } else {
          const previousTenorNote = chordProgression[chordProgression.length - 1][1]

          const noteSelectionByDistance = voiceNoteSelection.map((note) => {
            return distanceBetweenTwoNotes(
              notesOctaveSort.indexOf(note),
              notesOctaveSort.indexOf(previousTenorNote),
            )
          })

          const indexOfClosestNote = noteSelectionByDistance.indexOf(
            Math.min(...noteSelectionByDistance),
          )
          selectedNote = voiceNoteSelection[indexOfClosestNote]
        }
      } else {
        // 'alto'
        const third = chord[1]

        if (!Object.values(voicedChord).includes(third)) {
          // fill in third if not present
          selectedNote = third
        } else if (voiceNoteSelection.length > 1) {
          // remove neighboring octaves if possible
          const currentSopranoNote = voicedChord.soprano
          const currentTenorNote = voicedChord.tenor
          if (voiceNoteSelection.indexOf(currentSopranoNote) !== -1) {
            // soprano has neighboring octave
            voiceNoteSelection = voiceNoteSelection.filter((note) => note !== currentSopranoNote)
          } else if (voiceNoteSelection.indexOf(currentTenorNote) !== -1) {
            // soprano has neighboring octave
            voiceNoteSelection = voiceNoteSelection.filter((note) => note !== currentTenorNote)
          }

          selectedNote = chooseRandomNote(voiceNoteSelection)
        } else {
          selectedNote = chooseRandomNote(voiceNoteSelection)
        }
      }

      if (
        selectedNote === chord[1] || // note is 3rd
        Object.values(voicedChord).includes(selectedNote) // note selected for second time
      ) {
        // remove note from possible choices
        chordNoteSelection = chordNoteSelection.filter((note) => note !== selectedNote)
      }

      voicedChord[voice] = selectedNote // assign note
    })

    // assign chord
    chordProgression.push([
      `${voicedChord.bass}2`,
      `${voicedChord.tenor}3`,
      `${voicedChord.alto}4`,
      `${voicedChord.soprano}5`,
    ])
  })

  return chordProgression
}

function removeRomanNumeralQuality(romanNumeral) {
  return romanNumeral.toLowerCase().replace('dim', '').trim()
}

function generateRootPositionChordNotes(tonic, mode, chordRomanNumeral) {
  const chordQuality = chordQualityFromRomanNumeral(chordRomanNumeral)
  const chordIndex = romanNumeralToIndexMap[removeRomanNumeralQuality(chordRomanNumeral)]
  const scale =
    mode === 'minor'
      ? harmonicMinorScaleMap[tonic.toUpperCase()]
      : majorScaleMap[tonic.toUpperCase()]

  const root = scale[chordIndex]

  let chordArray
  if (chordQuality === 'minor') chordArray = minorTriadMap[root]
  else if (chordQuality === 'major') chordArray = majorTriadMap[root]
  else if (chordQuality === 'dim') chordArray = dimTriadMap[root]

  return chordArray
}

function generateRootPositionChords(tonic, mode, progressionAsRomanNumerals) {
  const progressionAsChords = []

  progressionAsRomanNumerals.forEach((romanNumeral) => {
    progressionAsChords.push(generateRootPositionChordNotes(tonic, mode, romanNumeral))
  })

  return progressionAsChords
}

function generateChords(tonic, mode, progressionAsRomanNumerals) {
  const rootChords = generateRootPositionChords(tonic, mode, progressionAsRomanNumerals)

  return generateVoicedChords(tonic, mode, rootChords)
}

function chordQualityFromRomanNumeral(chordRomanNumeral) {
  let chordQuality

  if (chordRomanNumeral.includes('dim')) {
    chordQuality = 'dim'
  } else if (chordRomanNumeral == chordRomanNumeral.toUpperCase()) {
    chordQuality = 'major'
  } else if (chordRomanNumeral == chordRomanNumeral.toLowerCase()) {
    chordQuality = 'minor'
  }

  return chordQuality
}

export { generateChords, generateProgression }
