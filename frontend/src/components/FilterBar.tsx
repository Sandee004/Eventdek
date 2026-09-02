// import { useMemo, useState } from "react";
// import { Check, MapPin, Search, SlidersHorizontal } from "lucide-react";
// import { AnimatePresence, motion } from "motion/react";
// import { CATEGORIES, NG_STATES, stateName, useEventDek } from "../App";

// export function FilterBar({ remaining }: { remaining: number }) {
//   const { stateId, setStateId, categories, toggleCategory, clearCategories } =
//     useEventDek();
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");

//   const results = useMemo(
//     () =>
//       NG_STATES.filter((s) =>
//         s.name.toLowerCase().includes(query.trim().toLowerCase()),
//       ),
//     [query],
//   );

//   return (
//     <div className="mx-auto max-w-3xl px-4 pt-4">
//       <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
//         <button
//           onClick={() => setOpen((v) => !v)}
//           className="tactile flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left hover:bg-accent"
//         >
//           <MapPin className="size-4 shrink-0 text-going" />
//           <span className="min-w-0">
//             <span className="label-caps block text-muted-foreground">
//               Current state
//             </span>
//             <span className="display block truncate text-sm font-bold leading-tight">
//               {stateName(stateId)}
//             </span>
//           </span>
//         </button>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setOpen((v) => !v)}
//             className={`tactile flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
//               categories.length > 0
//                 ? "border-going bg-going/10 text-going"
//                 : "border-border bg-surface hover:bg-accent"
//             }`}
//           >
//             <SlidersHorizontal className="size-4" />
//             <span className="hidden sm:inline">Filter</span>
//             {categories.length > 0 && (
//               <span className="grid size-5 place-items-center rounded-full bg-going text-[11px] font-bold text-going-foreground">
//                 {categories.length}
//               </span>
//             )}
//           </button>
//           <span className="rounded-md border border-border bg-surface-2 px-2.5 py-2 font-mono text-xs text-muted-foreground">
//             {remaining} left
//           </span>
//         </div>
//       </div>

//       <AnimatePresence>
//         {open && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }}
//             className="overflow-hidden"
//           >
//             <div className="card-frame mt-3 space-y-4 rounded-lg p-4">
//               <div>
//                 <p className="label-caps mb-2 text-muted-foreground">
//                   Select State / Region
//                 </p>
//                 <div className="relative">
//                   <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
//                   <input
//                     type="text"
//                     value={query}
//                     onChange={(e) => setQuery(e.target.value)}
//                     placeholder="Search Nigerian states..."
//                     className="w-full rounded-md border border-border bg-surface py-2 pr-3 pl-8 text-sm outline-none focus:border-going"
//                   />
//                 </div>
//                 <div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pt-1">
//                   {results.map((s) => (
//                     <button
//                       key={s.id}
//                       onClick={() => {
//                         setStateId(s.id);
//                         setOpen(false);
//                       }}
//                       className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
//                         stateId === s.id
//                           ? "bg-going text-going-foreground"
//                           : "bg-surface-2 text-foreground hover:bg-accent"
//                       }`}
//                     >
//                       {s.name}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="border-t border-border pt-3">
//                 <div className="flex items-center justify-between">
//                   <p className="label-caps text-muted-foreground">Categories</p>
//                   {categories.length > 0 && (
//                     <button
//                       onClick={clearCategories}
//                       className="text-xs text-muted-foreground hover:text-foreground"
//                     >
//                       Clear all
//                     </button>
//                   )}
//                 </div>
//                 <div className="mt-2 flex flex-wrap gap-1.5">
//                   {CATEGORIES.map((c) => {
//                     const active = categories.includes(c.id);
//                     return (
//                       <button
//                         key={c.id}
//                         onClick={() => toggleCategory(c.id)}
//                         className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
//                           active
//                             ? "border-going bg-going text-going-foreground"
//                             : "border-border bg-surface hover:bg-accent"
//                         }`}
//                       >
//                         {active && <Check className="size-3" />}
//                         {c.name}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
