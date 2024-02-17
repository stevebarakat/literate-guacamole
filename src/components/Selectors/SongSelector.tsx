import { songs } from "../../assets/songs";
import { MixerContext } from "../Mixer/mixerMachine";

export function SongSelector() {
  const value = MixerContext.useSelector(
    (state) => state.context.sourceSong?.slug || ""
  );
  const { send } = MixerContext.useActorRef();

  function handleSongSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const song = songs.find((song) => song.slug === event.target.value);
    if (song) {
      send({ type: "SONG.LOAD", song });
      send({ type: "INITIALIZE.AUDIO" });
    }
  }

  return (
    <select name="song-select" onChange={handleSongSelect} value={value}>
      <option value="" disabled>
        Choose a song :
      </option>
      {songs.map((song) => (
        <option key={song.id} value={song.slug}>
          {song.artist} - {song.title}
        </option>
      ))}
    </select>
  );
}
