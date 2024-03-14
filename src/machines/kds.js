buildMixer: assign(({ context, spawn }) => {
 start
 const clockMachineRef = spawn(clockMachine, {
   id: "clock-machine",
   input: {
     sourceSong: context.sourceSong,
   },
 });
 let trackMachineRefs = [];
 context.sourceSong.tracks.forEach((track, i) => {
   context.players[i] = new Player(track.path)
     .sync()
     .start(0, context.sourceSong?.startPosition);
   context.channels[i] = new Channel().toDestination();
   context.players[i]?.connect(context.channels[i]);
   trackMachineRefs = [
     ...trackMachineRefs,
     spawn(mixerMachine, {
       id: `track-${i}`,
       input: {
         channel: context.channels[i],
         track: context.sourceSong!.tracks[i],
       },
     }),
   ];
 });
 return {
   trackMachineRefs,
   clockMachineRef,
 };
}
