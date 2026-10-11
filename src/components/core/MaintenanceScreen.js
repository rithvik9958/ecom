'use client';
import { Settings, ShieldAlert, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenanceScreen({ message, isEmergency }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 z-0">
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 ${isEmergency ? 'bg-red-600' : 'bg-blue-600'}`} />
         <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
         <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 0.5, type: 'spring' }}
           className="mx-auto w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl"
         >
           {isEmergency ? (
             <ShieldAlert className="w-12 h-12 text-red-500" />
           ) : (
             <Wrench className="w-12 h-12 text-blue-400" />
           )}
         </motion.div>

         <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ duration: 0.5, delay: 0.1 }}
         >
           <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
             {isEmergency ? 'System Offline' : 'Under Maintenance'}
           </h1>
           <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
             {message || "We are currently undergoing scheduled maintenance to improve our services. Please check back shortly."}
           </p>
         </motion.div>

         <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="pt-8"
         >
           <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300">
             <span className="relative flex h-3 w-3">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isEmergency ? 'bg-red-500' : 'bg-blue-500'}`}></span>
               <span className={`relative inline-flex rounded-full h-3 w-3 ${isEmergency ? 'bg-red-500' : 'bg-blue-500'}`}></span>
             </span>
             Systems are currently paused
           </div>
         </motion.div>
      </div>
    </div>
  );
}
