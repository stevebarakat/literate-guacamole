import { MixerContext } from "../../machines/mixerMachine";

function Error() {
  const isError = MixerContext.useSelector((state) => state.matches("error"));
  if (!isError) return null;

  return <p>There was an error loading this Please try another one.</p>;
}

export default Error;
