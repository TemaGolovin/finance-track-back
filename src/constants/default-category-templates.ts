import { OperationType } from '@prisma/client';

export type DefaultCategoryTemplate = {
  defaultKey: string;
  categoryType: OperationType;
  color: string;
  icon: string;
};

export const DEFAULT_CATEGORY_TEMPLATES: DefaultCategoryTemplate[] = [
  {
    defaultKey: 'supermarket',
    categoryType: 'EXPENSE',
    color: '#4CAF50',
    icon: 'ShoppingCart',
  },
  {
    defaultKey: 'cafe',
    categoryType: 'EXPENSE',
    color: '#FF7043',
    icon: 'Utensils',
  },
  {
    defaultKey: 'transport',
    categoryType: 'EXPENSE',
    color: '#42A5F5',
    icon: 'Bus',
  },
  {
    defaultKey: 'home',
    categoryType: 'EXPENSE',
    color: '#8D6E63',
    icon: 'Home',
  },
  {
    defaultKey: 'health',
    categoryType: 'EXPENSE',
    color: '#EF5350',
    icon: 'HeartPulse',
  },
  {
    defaultKey: 'education',
    categoryType: 'EXPENSE',
    color: '#7E57C2',
    icon: 'GraduationCap',
  },
  {
    defaultKey: 'entertainment',
    categoryType: 'EXPENSE',
    color: '#AB47BC',
    icon: 'Gamepad2',
  },
  {
    defaultKey: 'clothes',
    categoryType: 'EXPENSE',
    color: '#26A69A',
    icon: 'Shirt',
  },
  {
    defaultKey: 'communication',
    categoryType: 'EXPENSE',
    color: '#29B6F6',
    icon: 'Smartphone',
  },
  {
    defaultKey: 'expenseGifts',
    categoryType: 'EXPENSE',
    color: '#EC407A',
    icon: 'Gift',
  },
  {
    defaultKey: 'travel',
    categoryType: 'EXPENSE',
    color: '#26C6DA',
    icon: 'Plane',
  },
  {
    defaultKey: 'auto',
    categoryType: 'EXPENSE',
    color: '#78909C',
    icon: 'Car',
  },
  {
    defaultKey: 'sport',
    categoryType: 'EXPENSE',
    color: '#66BB6A',
    icon: 'Dumbbell',
  },
  {
    defaultKey: 'pets',
    categoryType: 'EXPENSE',
    color: '#FFB300',
    icon: 'PawPrint',
  },
  {
    defaultKey: 'expenseOther',
    categoryType: 'EXPENSE',
    color: '#9E9E9E',
    icon: 'MoreHorizontal',
  },
  {
    defaultKey: 'salary',
    categoryType: 'INCOME',
    color: '#43A047',
    icon: 'Wallet',
  },
  {
    defaultKey: 'part-time',
    categoryType: 'INCOME',
    color: '#66BB6A',
    icon: 'Briefcase',
  },
  {
    defaultKey: 'incomeGifts',
    categoryType: 'INCOME',
    color: '#FFCA28',
    icon: 'Gift',
  },
  {
    defaultKey: 'incomeOther',
    categoryType: 'INCOME',
    color: '#9E9E9E',
    icon: 'MoreHorizontal',
  },
];
