const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center space-x-2 h-full">
      {/* Changed `animate-bounce` to `animate-bounce-lg` for a bigger bounce */}
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce-lg [animation-delay:-0.4s]"></span>
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce-lg [animation-delay:-0.3s]"></span>
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce-lg [animation-delay:-0.2s]"></span>
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce-lg [animation-delay:-0.1s]"></span>
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce-lg"></span>
    </div>
  );
};

export default LoadingDots;