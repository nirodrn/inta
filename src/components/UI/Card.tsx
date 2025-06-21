import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = true }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, shadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)' } : {}}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}