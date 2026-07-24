import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Sequence,
} from "remotion";
import { TutorialData } from "./data";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "900"], subsets: ["latin"] });

const INTRO_DUR = 120; // 4s
const STEP_DUR = 90;   // 3s
const OUTRO_DUR = 60;  // 2s

export const TutorialVideo: React.FC<{ tutorial: TutorialData }> = ({ tutorial }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: "#0A0A0F" }}>
      {/* Animated background */}
      <Background color={tutorial.accentColor} frame={frame} durationInFrames={durationInFrames} />

      {/* Intro */}
      <Sequence durationInFrames={INTRO_DUR}>
        <Intro tutorial={tutorial} />
      </Sequence>

      {/* Steps */}
      {tutorial.steps.map((step, i) => (
        <Sequence key={i} from={INTRO_DUR + i * STEP_DUR} durationInFrames={STEP_DUR}>
          <StepScene step={step} index={i} total={tutorial.steps.length} color={tutorial.accentColor} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={INTRO_DUR + tutorial.steps.length * STEP_DUR} durationInFrames={OUTRO_DUR}>
        <Outro tutorial={tutorial} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Background: React.FC<{ color: string; frame: number; durationInFrames: number }> = ({ color, frame, durationInFrames }) => {
  const progress = frame / durationInFrames;
  const y1 = interpolate(frame, [0, durationInFrames], [0, -400]);
  const y2 = interpolate(frame, [0, durationInFrames], [1920, 1520]);

  return (
    <AbsoluteFill>
      {/* Gradient orbs */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        top: y1, left: -100,
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        top: y2, right: -150,
      }} />
      {/* Grid lines */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />
    </AbsoluteFill>
  );
};

const Intro: React.FC<{ tutorial: TutorialData }> = ({ tutorial }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconScale = spring({ frame, fps, config: { damping: 8 } });
  const titleY = interpolate(spring({ frame: frame - 15, fps, config: { damping: 15 } }), [0, 1], [80, 0]);
  const titleOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subY = interpolate(spring({ frame: frame - 30, fps, config: { damping: 15 } }), [0, 1], [60, 0]);
  const subOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const lineW = interpolate(frame, [40, 70], [0, 300], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const badgeOp = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 120, transform: `scale(${iconScale})`, marginBottom: 30 }}>{tutorial.icon}</div>
        <div style={{
          fontSize: 64, fontWeight: 900, color: "white", lineHeight: 1.1,
          transform: `translateY(${titleY}px)`, opacity: titleOp,
        }}>
          {tutorial.title}
        </div>
        <div style={{
          fontSize: 36, fontWeight: 600, color: tutorial.accentColor, marginTop: 12,
          transform: `translateY(${subY}px)`, opacity: subOp,
        }}>
          {tutorial.subtitle}
        </div>
        <div style={{
          width: lineW, height: 3, background: `linear-gradient(90deg, transparent, ${tutorial.accentColor}, transparent)`,
          margin: "30px auto 0", borderRadius: 2,
        }} />
        <div style={{
          fontSize: 22, color: "#888", marginTop: 25, opacity: badgeOp,
          fontWeight: 600, letterSpacing: 3, textTransform: "uppercase",
        }}>
          Jeux d'Hazard
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StepScene: React.FC<{ step: string; index: number; total: number; color: string }> = ({ step, index, total, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numScale = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
  const textX = interpolate(spring({ frame: frame - 10, fps, config: { damping: 15 } }), [0, 1], [100, 0]);
  const textOp = interpolate(frame, [8, 28], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const barW = interpolate(frame, [20, 55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const exitOp = interpolate(frame, [70, 88], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const progressPct = ((index + 1) / total) * 100;

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 60px", opacity: exitOp }}>
      {/* Step number */}
      <div style={{
        display: "flex", alignItems: "center", gap: 25, marginBottom: 40,
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: 24, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: `linear-gradient(135deg, ${color}, ${color}88)`,
          transform: `scale(${numScale})`,
          boxShadow: `0 15px 40px ${color}44`,
        }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: "white" }}>{index + 1}</span>
        </div>
        <div style={{ color: "#666", fontSize: 22, fontWeight: 600 }}>
          ÉTAPE {index + 1} / {total}
        </div>
      </div>

      {/* Step text */}
      <div style={{
        fontSize: 42, fontWeight: 700, color: "white", lineHeight: 1.4,
        transform: `translateX(${textX}px)`, opacity: textOp,
        maxWidth: 900,
      }}>
        {step}
      </div>

      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 180, left: 60, right: 60,
      }}>
        <div style={{
          height: 6, background: "#1A1A2E", borderRadius: 3, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${progressPct * barW}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ tutorial: TutorialData }> = ({ tutorial }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });
  const op = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: op }}>
      <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
        <div style={{ fontSize: 80 }}>✅</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: "white", marginTop: 20 }}>Tutoriel terminé !</div>
        <div style={{ fontSize: 26, color: tutorial.accentColor, marginTop: 15, fontWeight: 600 }}>
          {tutorial.title} — {tutorial.subtitle}
        </div>
        <div style={{ fontSize: 20, color: "#555", marginTop: 30, fontWeight: 600, letterSpacing: 2 }}>
          JEUX D'HAZARD
        </div>
      </div>
    </AbsoluteFill>
  );
};
