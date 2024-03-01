import * as Tone from "tone";
// make some effects
const chorus = new Tone.Chorus({
  wet: 1,
})
  .toDestination()
  .start();
const chorusChannel = new Tone.Channel().connect(chorus);
chorusChannel.receive("chorus");

const cheby = new Tone.Chebyshev(50).toDestination();
const chebyChannel = new Tone.Channel().connect(cheby);
chebyChannel.receive("cheby");

const reverb = new Tone.Reverb(3).toDestination();
const reverbChannel = new Tone.Channel().connect(reverb);
reverbChannel.receive("reverb");

export { chorusChannel, chebyChannel, reverbChannel };
