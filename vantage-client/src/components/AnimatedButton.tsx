import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

function AnimatedButton({ variant = 'primary', children, className = '', ...props }: AnimatedButtonProps) {
  const baseStyles = variant === 'primary' 
    ? 'bg-interactive text-white' 
    : 'bg-transparent text-primary border border-border';

  return (
    <motion.button
      className={`px-4 py-2 rounded-button font-bold text-button transition-colors duration-200 cursor-pointer ${baseStyles} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default AnimatedButton;