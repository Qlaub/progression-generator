import {
  minorTriadMap,
  majorTriadMap,
  dimTriadMap,
  harmonicMinorScaleMap,
  majorScaleMap,
  romanNumeralToIndexMap,
  notesOctaveSort,
  majorKeyLowercaseRomanNumeralToChordQualityMap,
  harmonicMinorLowercaseRomanNumeralToChordQualityMap,
} from './chordKeyMapping'

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

function generateProgression(
  mode,
  numberOfChords,
  possibleChords,
  allowModalMixture,
  allowRepeatChords,
) {
  const possibleChordsClone = [...possibleChords]
  const chordI = mode === 'major' ? 'I' : 'i'
  if (!allowRepeatChords) possibleChordsClone.shift() // remove I chord

  const majorMinorMap = {
    0: majorKeyLowercaseRomanNumeralToChordQualityMap,
    1: harmonicMinorLowercaseRomanNumeralToChordQualityMap,
  }

  const indexOfIChord = getRandomInt(4)

  const chordProgression = []

  for (let i = 0; i < numberOfChords; i++) {
    let chord

    if (indexOfIChord === i) {
      chord = chordI
    } else {
      const chordIndexSelection = getRandomInt(possibleChordsClone.length)
      chord = possibleChordsClone[chordIndexSelection]
      if (!allowRepeatChords) possibleChordsClone.splice(chordIndexSelection, 1)

      let quality
      if (allowModalMixture) {
        quality = majorMinorMap[getRandomInt(2)][chord]
      } else if (mode === 'major') {
        quality = majorKeyLowercaseRomanNumeralToChordQualityMap[chord]
      } else if (mode === 'minor') {
        quality = harmonicMinorLowercaseRomanNumeralToChordQualityMap[chord]
      }

      if (chord != 'vii' && chord.toLowerCase() != 'i' && quality === 'major') {
        chord = chord.toUpperCase()
      }

      if (quality.includes('dim')) chord = `${chord} dim`
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

function proximity(note1, note2) {
  const totalNotes = 7
  const upwardDistance = (note2 - note1 + totalNotes) % totalNotes
  const downwardDistance = (note1 - note2 + totalNotes) % totalNotes
  return Math.min(upwardDistance, downwardDistance)
}

// In relation to note1
function signedProximity(note1, note2) {
  const totalNotes = 7
  const upwardDistance = (note2 - note1 + totalNotes) % totalNotes
  const downwardDistance = (note1 - note2 + totalNotes) % totalNotes

  if (upwardDistance === downwardDistance) {
    return 0
  }

  return upwardDistance < downwardDistance ? upwardDistance : -downwardDistance
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
            return proximity(
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
            return proximity(
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
            return proximity(
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

    // generate chord octaves
    let bassWithOctave
    let tenorWithOctave
    let altoWithOctave
    let sopranoWithOctave
    if (chordProgression.length === 0) {
      // first chord
      bassWithOctave = `${voicedChord.bass}2`
      sopranoWithOctave = isWithinXOctaves(2, bassWithOctave, `${voicedChord.soprano}4`)
        ? `${voicedChord.soprano}5` // if within 2 octaves of bass, throw soprano octave up
        : `${voicedChord.soprano}4`
      altoWithOctave = generateClosestNoteBelow(sopranoWithOctave, voicedChord.alto)
      tenorWithOctave = generateClosestNoteBelow(altoWithOctave, voicedChord.tenor)
    } else {
      sopranoWithOctave = generateClosestNote(
        chordProgression[chordProgression.length - 1][3],
        voicedChord.soprano,
      )
      bassWithOctave = generateClosestNote(
        chordProgression[chordProgression.length - 1][0],
        voicedChord.bass,
      )
      const potentialAltoNote = generateClosestNote(
        chordProgression[chordProgression.length - 1][2],
        voicedChord.alto,
      )
      isNoteLower(potentialAltoNote, sopranoWithOctave)
        ? (altoWithOctave = potentialAltoNote)
        : generateClosestNoteBelow(sopranoWithOctave, voicedChord.alto)
      const potentialTenorNote = generateClosestNote(
        chordProgression[chordProgression.length - 1][1],
        voicedChord.tenor,
      )
      isNoteLower(potentialTenorNote, altoWithOctave)
        ? (tenorWithOctave = potentialTenorNote)
        : generateClosestNoteBelow(tenorWithOctave, voicedChord.tenor)
    }

    // assign chord
    chordProgression.push([bassWithOctave, tenorWithOctave, altoWithOctave, sopranoWithOctave])
  })

  return chordProgression
}

function generateClosestNote(startingNote, noteWithoutOctave) {
  const startingNoteOctave = startingNote[startingNote.length - 1]
  const startingNoteWithoutOctave = startingNote.replace(startingNoteOctave, '')

  const startingNoteIndex = notesOctaveSort.indexOf(startingNoteWithoutOctave)
  const noteWithoutOctaveIndex = notesOctaveSort.indexOf(noteWithoutOctave)
  let octaveForResultingNote

  const signedProximityBetween = signedProximity(startingNoteWithoutOctave, noteWithoutOctaveIndex)

  if (startingNoteIndex + signedProximityBetween < 0) {
    octaveForResultingNote = parseInt(startingNoteOctave) - 1
  } else if (startingNoteIndex + signedProximityBetween > 6) {
    octaveForResultingNote = parseInt(startingNoteOctave + 1)
  } else {
    octaveForResultingNote = parseInt(startingNoteOctave)
  }

  return `${noteWithoutOctave}${octaveForResultingNote}`
}

function generateClosestNoteBelow(noteWithOctave, noteWithoutOctave) {
  const higherNoteOctave = noteWithOctave[noteWithOctave.length - 1]
  const higherNoteWithoutOctave = noteWithOctave.replace(higherNoteOctave, '')

  const higherNoteIndex = notesOctaveSort.indexOf(higherNoteWithoutOctave)
  const lowerNoteIndex = notesOctaveSort.indexOf(noteWithoutOctave)

  if (higherNoteIndex > lowerNoteIndex) {
    // within same octave
    return `${noteWithoutOctave}${higherNoteOctave}`
  } else {
    // go to lower octave
    return `${noteWithoutOctave}${parseInt(higherNoteOctave) - 1}`
  }
}

function isWithinXOctaves(numberOfOctaves, lowerNote, higherNote) {
  let lowerNoteOctave = lowerNote[lowerNote.length - 1]
  const lowerNoteWithoutOctave = lowerNote.replace(lowerNoteOctave, '')
  let higherNoteOctave = higherNote[higherNote.length - 1]
  const higherNoteWithoutOctave = higherNote.replace(higherNoteOctave, '')
  const lowerNoteAsNumber = notesOctaveSort[lowerNoteWithoutOctave]
  const higherNoteAsNumber = notesOctaveSort[higherNoteWithoutOctave]

  if (parseInt(lowerNoteOctave) + numberOfOctaves > parseInt(higherNoteOctave)) {
    return true
  } else if (parseInt(lowerNoteOctave) + numberOfOctaves === parseInt(higherNoteOctave)) {
    return lowerNoteAsNumber > higherNoteAsNumber
  } else {
    return false
  }
}

function isNoteLower(possiblyLowerNote, possiblyHigherNote) {
  const possiblyLowerNoteOctave = possiblyLowerNote[possiblyLowerNote.length - 1]
  const possiblyLowerNoteWithoutOctave = possiblyLowerNote.replace(possiblyLowerNoteOctave, '')
  const possiblyHigherNoteOctave = possiblyHigherNote[possiblyHigherNote.length - 1]
  const possiblyHigherNoteWithoutOctave = possiblyHigherNote.replace(possiblyHigherNoteOctave, '')
  if (parseInt(possiblyLowerNoteOctave) > parseInt(possiblyHigherNoteOctave)) return false
  else if (parseInt(possiblyLowerNoteOctave) === parseInt(possiblyHigherNoteOctave)) {
    if (signedProximity(possiblyHigherNoteWithoutOctave, possiblyLowerNoteWithoutOctave) >= 0)
      return false
    else return true
  } else {
    return true
  }
}

function removeRomanNumeralQuality(romanNumeral) {
  return romanNumeral.toLowerCase().replace('dim', '').trim()
}

function generateRootPositionChordNotes(tonic, mode, chordRomanNumeral) {
  const chordQuality = chordQualityFromRomanNumeral(chordRomanNumeral)
  const chordIndex = romanNumeralToIndexMap[removeRomanNumeralQuality(chordRomanNumeral)]
  const modeForChord =
    majorKeyLowercaseRomanNumeralToChordQualityMap[chordRomanNumeral.toLowerCase()] === chordQuality
      ? 'major'
      : 'minor'
  const scale =
    modeForChord === 'minor'
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
