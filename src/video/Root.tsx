import { Composition } from "remotion";
import { SesamathApiVideo } from "./SesamathApiVideo";
import "./style.css";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SesamathApiVideo"
      component={SesamathApiVideo}
      durationInFrames={540}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
