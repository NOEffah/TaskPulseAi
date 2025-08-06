const LoadingDots = () => {
  return (
    <div className="flex items-center justify-center space-x-2 h-full">
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-4 h-4 bg-orange-500 rounded-full animate-bounce"></span>
    </div>
  );
};

export default LoadingDots;
