import { Composition } from "remotion";
import { TutorialVideo } from "./TutorialVideo";
import { tutorials } from "./data";

export const RemotionRoot = () => (
  <>
    {tutorials.map((tut, i) => (
      <Composition
        key={tut.id}
        id={tut.id}
        component={TutorialVideo}
        durationInFrames={30 * (4 + tut.steps.length * 3 + 2)} // 4s intro + 3s/step + 2s outro
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ tutorial: tut }}
      />
    ))}
  </>
);
