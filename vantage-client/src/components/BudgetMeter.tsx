import { motion } from 'framer-motion';

interface BudgetMeterProps {
  total: number;
  spent: number;
  currency: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
  MMK: 'K', THB: '฿', VND: '₫', IDR: 'Rp', MYR: 'RM', PHP: '₱',
  SGD: 'S$', KRW: '₩', CNY: '¥', INR: '₹',
};

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}

export default function BudgetMeter({ total, spent, currency }: BudgetMeterProps) {
  const percentage = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  
  const getColor = () => {
    if (percentage < 60) return '#00b473';
    if (percentage < 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'var(--color-ring)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base" style={{ color: 'var(--color-primary)' }}>
          Budget
        </h3>
        <span className="text-caption" style={{ color: '#555a6a' }}>
          {percentage.toFixed(0)}% used
        </span>
      </div>
      
      <div className="mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: 8,
            background: getColor(),
            borderRadius: 4,
          }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-caption" style={{ color: '#555a6a' }}>Spent</span>
          <p className="font-semibold" style={{ color: getColor(), fontSize: 18 }}>
            {formatCurrency(spent, currency)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-caption" style={{ color: '#555a6a' }}>Total</span>
          <p className="font-semibold" style={{ color: 'var(--color-primary)', fontSize: 18 }}>
            {formatCurrency(total, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}