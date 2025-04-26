export default function generateProgression(mode, numberOfChords, possibleChords) {
  const chordI = mode === 'major' ? 'I' : 'i'

  const majorMinorMap = {
    0: 'major',
    1: 'minor',
  }

  const indexOfIChord = getRandomInt(4)

  let chordProgression = ''

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
      }
    }

    chordProgression += `${chord}`
    if (i != numberOfChords - 1) chordProgression += '-'
  }

  function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

  console.log(chordProgression)

  return chordProgression
}
