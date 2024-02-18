import { songs } from "../../assets/songs";
import { MixerContext } from "../Mixer/mixerMachine";

export function SongSelector() {
  const slug = MixerContext.useSelector(
    (state) => state.context.sourceSong?.slug || ""
  );
  const isLoading = MixerContext.useSelector((s) => s.matches("loading"));
  const { send } = MixerContext.useActorRef();

  function handleSongSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const song = songs.find((song) => song.slug === event.target.value);
    if (song) {
      send({ type: "SONG.LOAD", song });
    }
  }

  return (
    <select
      name="song-select"
      onChange={handleSongSelect}
      value={slug}
      disabled={isLoading}
    >
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
