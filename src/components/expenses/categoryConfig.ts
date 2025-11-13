import { Coffee, Car, ShoppingCart, Home, Heart, Gamepad2, Receipt, Plane, GraduationCap, ShoppingBasket, Sparkles, Gift, Briefcase, MoreHorizontal, ArrowRightLeft } from 'lucide-react';
import type { ExpenseCategory, CategoryConfig } from '@/types/expense';

export const categoryConfigs: Record<ExpenseCategory, CategoryConfig> = {
  'Food & Dining': {
    id: 'food',
    name: 'Food & Dining',
    icon: 'Coffee',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500'
  },
  'Transportation': {
    id: 'transport',
    name: 'Transportation',
    icon: 'Car',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500'
  },
  'Shopping': {
    id: 'shopping',
    name: 'Shopping',
    icon: 'ShoppingCart',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500'
  },
  'Housing': {
    id: 'housing',
    name: 'Housing',
    icon: 'Home',
    color: 'text-green-400',
    bgColor: 'bg-green-500'
  },
  'Health & Fitness': {
    id: 'health',
    name: 'Health & Fitness',
    icon: 'Heart',
    color: 'text-red-400',
    bgColor: 'bg-red-500'
  },
  'Entertainment': {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Gamepad2',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500'
  },
  'Bills & Utilities': {
    id: 'bills',
    name: 'Bills & Utilities',
    icon: 'Receipt',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500'
  },
  'Travel': {
    id: 'travel',
    name: 'Travel',
    icon: 'Plane',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500'
  },
  'Education': {
    id: 'education',
    name: 'Education',
    icon: 'GraduationCap',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500'
  },
  'Groceries': {
    id: 'groceries',
    name: 'Groceries',
    icon: 'ShoppingBasket',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500'
  },
  'Personal Care': {
    id: 'personal',
    name: 'Personal Care',
    icon: 'Sparkles',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500'
  },
  'Home & Garden': {
    id: 'home-garden',
    name: 'Home & Garden',
    icon: 'Home',
    color: 'text-lime-400',
    bgColor: 'bg-lime-500'
  },
  'Gifts & Donations': {
    id: 'gifts',
    name: 'Gifts & Donations',
    icon: 'Gift',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500'
  },
  'Business': {
    id: 'business',
    name: 'Business',
    icon: 'Briefcase',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500'
  },
  'settlement': {
    id: 'settlement',
    name: 'Settlement',
    icon: 'ArrowRightLeft',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500'
  },
  'Other': {
    id: 'other',
    name: 'Other',
    icon: 'MoreHorizontal',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500'
  }
};

export const getCategoryConfig = (category: ExpenseCategory): CategoryConfig => {
  return categoryConfigs[category] || categoryConfigs['Other'];
};

export const getCategoryIcon = (category: ExpenseCategory) => {
  const config = getCategoryConfig(category);
  const iconMap: Record<string, any> = {
    Coffee, Car, ShoppingCart, Home, Heart, Gamepad2, Receipt, Plane,
    GraduationCap, ShoppingBasket, Sparkles, Gift, Briefcase, MoreHorizontal, ArrowRightLeft
  };
  return iconMap[config.icon] || MoreHorizontal;
};

export const getAllCategories = (): ExpenseCategory[] => {
  return Object.keys(categoryConfigs) as ExpenseCategory[];
};
