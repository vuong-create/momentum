import { type PillarKey } from "../../../app/theme";
import NavigationIcon, {
  MomentumMark,
  type NavigationIconName,
} from "../../../components/NavigationIcon";

type PillarIconProps = {
  pillar: PillarKey;
};

const pillarIconNames: Partial<Record<PillarKey, NavigationIconName>> = {
  chinese: "chinese",
  athletics: "athletics",
  cooking: "cooking",
  finance: "finance",
  happiness: "journal",
};

export default function PillarIcon({ pillar }: PillarIconProps) {
  const iconName = pillarIconNames[pillar];

  return iconName ? <NavigationIcon name={iconName} /> : <MomentumMark />;
}
