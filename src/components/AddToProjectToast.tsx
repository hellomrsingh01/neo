"use client";
 
 import { useEffect, useRef, useState } from "react";
 
 export default function AddToProjectToast({
   open,
   projectName,
   onChange,
   onClose,
 }: {
   open: boolean;
   projectName: string;
   onChange: () => void;
   onClose: () => void;
 }) {
   const [hovered, setHovered] = useState(false);
   const timeoutRef = useRef<number | null>(null);
 
   useEffect(() => {
     if (!open) return;
     if (timeoutRef.current) {
       window.clearTimeout(timeoutRef.current);
       timeoutRef.current = null;
     }
 
     if (!hovered) {
       timeoutRef.current = window.setTimeout(() => {
         onClose();
       }, 4000);
     }
 
     return () => {
       if (timeoutRef.current) {
         window.clearTimeout(timeoutRef.current);
         timeoutRef.current = null;
       }
     };
   }, [open, hovered, onClose]);
 
   if (!open) return null;
 
   return (
     <div
       className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6"
       role="status"
       aria-live="polite"
       onMouseEnter={() => setHovered(true)}
       onMouseLeave={() => setHovered(false)}
       onFocus={() => setHovered(true)}
       onBlur={() => setHovered(false)}
     >
       <div className="mx-auto flex w-full max-w-xl items-start justify-between gap-3 rounded-[18px] bg-emerald-950 px-4 py-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
         <div className="min-w-0">
           <div className="text-sm font-semibold">
             Added to{" "}
             <span className="font-bold text-emerald-200">{projectName}</span>
           </div>
           <div className="mt-0.5 text-xs font-medium text-emerald-100/80">
             You can change the project/section if needed.
           </div>
         </div>
 
         <div className="flex shrink-0 items-center gap-2">
           <button
             type="button"
             onClick={onChange}
             className="inline-flex h-9 items-center justify-center rounded-full bg-white/10 px-4 text-xs font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
           >
             Change
           </button>
           <button
             type="button"
             onClick={onClose}
             aria-label="Close"
             className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
           >
             <span className="text-lg leading-none">×</span>
           </button>
         </div>
       </div>
     </div>
   );
 }

