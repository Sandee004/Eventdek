import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background select-none">
      {/* 1. Base Sharp Structural Grid (Higher Visibility) */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklab, var(--color-foreground) 18%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklab, var(--color-foreground) 18%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* 2. Fast-Moving 45° Diagonal Cyber Stream */}
      <motion.div
        animate={{
          backgroundPosition: ["0px 0px", "128px 128px"],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              color-mix(in oklab, var(--color-going) 25%, transparent) 0,
              color-mix(in oklab, var(--color-going) 25%, transparent) 1px,
              transparent 0,
              transparent 32px
            )
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* 3. High-Contrast Diagonal Accent Rays (-45deg Cross-Hatch) */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              -45deg,
              color-mix(in oklab, var(--color-foreground) 15%, transparent) 0,
              color-mix(in oklab, var(--color-foreground) 15%, transparent) 1px,
              transparent 0,
              transparent 64px
            )
          `,
        }}
      />

      {/* 4. Sweeping Laser Beam Vectors (Traveling Lines) */}
      {/* Horizontal Beam 1 */}
      <motion.div
        animate={{
          top: ["-5%", "105%"],
          opacity: [0, 0.9, 0.9, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-going to-transparent shadow-[0_0_12px_var(--color-going)]"
      />

      {/* Horizontal Beam 2 (Reverse & Delayed) */}
      <motion.div
        animate={{
          top: ["105%", "-5%"],
          opacity: [0, 0.7, 0.7, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3.5,
        }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pass to-transparent shadow-[0_0_10px_var(--color-pass)]"
      />

      {/* Vertical Beam 1 */}
      <motion.div
        animate={{
          left: ["-5%", "105%"],
          opacity: [0, 0.8, 0.8, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-going to-transparent shadow-[0_0_12px_var(--color-going)]"
      />

      {/* Vertical Beam 2 (Right side) */}
      <motion.div
        animate={{
          left: ["105%", "-5%"],
          opacity: [0, 0.6, 0.6, 0],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-going/80 to-transparent shadow-[0_0_8px_var(--color-going)]"
      />

      {/* 5. Animated Vector Circuit Matrix (SVG Dots & Reticles) */}
      <svg
        className="absolute inset-0 size-full stroke-foreground/20 opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="matrix-grid"
            width="128"
            height="128"
            patternUnits="userSpaceOnUse"
          >
            {/* Precise Target Crosshairs */}
            <path
              d="M 0 10 L 0 -10 M -10 0 L 10 0"
              strokeWidth="1"
              stroke="currentColor"
            />
            <path
              d="M 64 74 L 64 54 M 54 64 L 74 64"
              strokeWidth="0.75"
              stroke="currentColor"
              opacity="0.6"
            />
            <circle cx="64" cy="64" r="2" className="fill-going stroke-none" />
            {/* Dashed line accent */}
            <line
              x1="0"
              y1="64"
              x2="128"
              y2="64"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              stroke="currentColor"
              opacity="0.3"
            />
            <line
              x1="64"
              y1="0"
              x2="64"
              y2="128"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              stroke="currentColor"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#matrix-grid)" />
      </svg>

      {/* 6. Deep Atmospheric Kola Glow Accents (Lighting the corners) */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-24 -left-24 size-[34rem] rounded-full bg-going/25 blur-[120px]"
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute -bottom-24 -right-24 size-[36rem] rounded-full bg-pass/20 blur-[130px]"
      />
    </div>
  );
}

// import { motion } from "framer-motion";

// export function AmbientBackground() {
//   return (
//     <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background select-none">
//       {/* 1. Primary 45° Diagonal Grid Lines (Smooth Infinite Drift) */}
//       <motion.div
//         animate={{
//           backgroundPosition: ["0px 0px", "80px 80px"],
//         }}
//         transition={{
//           duration: 12,
//           repeat: Infinity,
//           ease: "linear",
//         }}
//         className="absolute inset-0 opacity-25"
//         style={{
//           backgroundImage: `
//             repeating-linear-gradient(
//               45deg,
//               color-mix(in oklab, var(--color-foreground) 16%, transparent) 0,
//               color-mix(in oklab, var(--color-foreground) 16%, transparent) 1.5px,
//               transparent 1.5px,
//               transparent 40px
//             )
//           `,
//           backgroundSize: "80px 80px",
//         }}
//       />

//       {/* 2. Counter-Angle -45° Diagonal Cross Lines (Slower Drift for Parallax Depth) */}
//       <motion.div
//         animate={{
//           backgroundPosition: ["0px 0px", "-96px 96px"],
//         }}
//         transition={{
//           duration: 18,
//           repeat: Infinity,
//           ease: "linear",
//         }}
//         className="absolute inset-0 opacity-15"
//         style={{
//           backgroundImage: `
//             repeating-linear-gradient(
//               -45deg,
//               color-mix(in oklab, var(--color-going) 20%, transparent) 0,
//               color-mix(in oklab, var(--color-going) 20%, transparent) 1px,
//               transparent 1px,
//               transparent 48px
//             )
//           `,
//           backgroundSize: "96px 96px",
//         }}
//       />

//       {/* 3. Wide Diagonal Accent Bands (Spaced Cyber Ribbons) */}
//       <motion.div
//         animate={{
//           backgroundPosition: ["0px 0px", "240px 240px"],
//         }}
//         transition={{
//           duration: 24,
//           repeat: Infinity,
//           ease: "linear",
//         }}
//         className="absolute inset-0 opacity-10"
//         style={{
//           backgroundImage: `
//             repeating-linear-gradient(
//               45deg,
//               color-mix(in oklab, var(--color-going) 35%, transparent) 0,
//               color-mix(in oklab, var(--color-going) 35%, transparent) 2px,
//               transparent 2px,
//               transparent 120px
//             )
//           `,
//           backgroundSize: "240px 240px",
//         }}
//       />

//       {/* 4. Diagonal SVG Accent Slashes & Nodes */}
//       <svg
//         className="absolute inset-0 size-full stroke-foreground/15 opacity-30"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <defs>
//           <pattern
//             id="diagonal-slash-matrix"
//             width="120"
//             height="120"
//             patternUnits="userSpaceOnUse"
//           >
//             {/* 45-degree angle tick marks */}
//             <line
//               x1="10"
//               y1="20"
//               x2="30"
//               y2="0"
//               strokeWidth="1"
//               stroke="currentColor"
//             />
//             <line
//               x1="70"
//               y1="80"
//               x2="90"
//               y2="60"
//               strokeWidth="1"
//               stroke="currentColor"
//             />
//             <circle
//               cx="20"
//               cy="10"
//               r="1.5"
//               className="fill-going stroke-none"
//             />
//             <circle
//               cx="80"
//               cy="70"
//               r="1.5"
//               className="fill-going stroke-none"
//             />
//           </pattern>
//         </defs>
//         <rect width="100%" height="100%" fill="url(#diagonal-slash-matrix)" />
//       </svg>

//       {/* 5. Static, Soft Atmospheric Corner Gradients (No Pulsing) */}
//       <div className="absolute -top-32 -left-32 size-[32rem] rounded-full bg-going/10 blur-[140px]" />
//       <div className="absolute -bottom-32 -right-32 size-[32rem] rounded-full bg-pass/10 blur-[140px]" />
//     </div>
//   );
// }
