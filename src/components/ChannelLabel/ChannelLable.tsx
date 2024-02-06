type Props = {
  name: string;
};

function ChannelLable({ name }: Props) {
  return <span className="channel-label">{name}</span>;
}

export default ChannelLable;
