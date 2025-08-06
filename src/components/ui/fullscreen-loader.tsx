// components/ui/fullscreen-loader.tsx
"use client";

const FullscreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="flex flex-col items-center gap-y-4">
        <div className="w-16 h-16 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-orange-600 font-medium text-lg">Setting up your project...</p>
      </div>
    </div>
  );
};


export default FullscreenLoader;
