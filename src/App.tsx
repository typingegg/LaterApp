import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Activity, 
  Trash2,
  Sparkles,
  TrendingUp,
  X,
  ShieldCheck,
  Edit2,
  Download
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Label,
  Legend
} from 'recharts';
import { INITIAL_STATE, UserState, LifeEvent, Investment, Mortgage, Income } from './types';
import { getVibeCheck } from './services/geminiService';
import { cn } from './lib/utils';

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-zinc-800/50 p-2 md:p-3 rounded-lg shadow-xl backdrop-blur-xl max-w-[200px] md:max-w-none">
        <p className="text-zinc-400 font-mono text-[9px] md:text-xs mb-1 md:mb-2">{label}</p>
        <p className="text-white font-mono text-xs md:text-sm font-medium mb-1">
          Net Worth: {currency}{data.netWorth.toLocaleString()}
        </p>
        <div className="space-y-0.5 mb-1 md:mb-2 border-b border-zinc-800/50 pb-1 md:pb-2">
          <p className="text-zinc-400 font-mono text-[8px] md:text-[10px] flex justify-between gap-2 md:gap-4">
            <span>Cash:</span>
            <span>{currency}{data.cash.toLocaleString()}</span>
          </p>
        </div>
        {data.eventsThisMonth && data.eventsThisMonth.length > 0 && (
          <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t border-zinc-800/50">
            <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase tracking-wider mb-1">Events</p>
            {data.eventsThisMonth.map((e: any) => (
              <p key={e.id} className="text-zinc-300 text-[8px] md:text-[10px] font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                {e.title}
              </p>
            ))}
          </div>
        )}
        {data.investmentsThisMonth && data.investmentsThisMonth.length > 0 && (
          <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t border-zinc-800/50">
            <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase tracking-wider mb-1">Assets</p>
            {data.investmentsThisMonth.map((inv: any) => (
              <p key={inv.id} className="text-zinc-300 text-[8px] md:text-[10px] font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                {inv.name}
              </p>
            ))}
          </div>
        )}
        {data.mortgagesThisMonth && data.mortgagesThisMonth.length > 0 && (
          <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t border-zinc-800/50">
            <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase tracking-wider mb-1">Real Estate</p>
            {data.mortgagesThisMonth.map((mort: any) => (
              <p key={mort.id} className="text-zinc-300 text-[8px] md:text-[10px] font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                {mort.name}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [state, setState] = useState<UserState>(INITIAL_STATE);
  const [vibeData, setVibeData] = useState<{score: number, analysis: string, advice: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showMortgageModal, setShowMortgageModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);
  const [editingInvest, setEditingInvest] = useState<Investment | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editingMortgage, setEditingMortgage] = useState<Mortgage | null>(null);
  const [mortgageType, setMortgageType] = useState<'mortgage' | 'rent'>('mortgage');
  const [eventOccurrence, setEventOccurrence] = useState<'one-time' | 'monthly'>('one-time');
  const [timeRange, setTimeRange] = useState<'YTD' | '1Y' | '5Y' | '10Y' | '15Y' | '20Y' | '25Y' | '30Y'>('30Y');
  const [theme, setTheme] = useState<'dark' | 'light' | 'neon'>('dark');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install the app, look for the 'Add to Home Screen' option in your browser menu. (Note: PWA installation may not be supported in this preview window).");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const totalMonths = 30 * 12;
  
  const allProjectionData = Array.from({ length: totalMonths + 1 }, (_, i) => {
    const date = new Date(currentYear, currentMonth + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const label = `${date.toLocaleString('default', { month: 'short' })} ${year}`;
    
    let totalInvestmentContributions = 0;
    let investmentBalance = 0;
    let monthlyIncome = 0;
    const investmentsThisMonth: Investment[] = [];
    const mortgagesThisMonth: Mortgage[] = [];
    const incomeThisMonth: Income[] = [];

    state.income.forEach(inc => {
      const [y, m] = inc.startDate.split('-');
      const incYear = parseInt(y, 10);
      const incMonth = parseInt(m, 10) - 1;
      const monthsSinceInc = (year - incYear) * 12 + (month - incMonth);

      if (monthsSinceInc >= 0) {
        let maxMonths = Infinity;
        if (inc.endDate) {
          const [ey, em] = inc.endDate.split('-');
          const endYear = parseInt(ey, 10);
          const endMonth = parseInt(em, 10) - 1;
          maxMonths = (endYear - incYear) * 12 + (endMonth - incMonth);
        }

        if (monthsSinceInc <= maxMonths) {
          monthlyIncome += inc.amount;
          if (monthsSinceInc === 0) {
            incomeThisMonth.push(inc);
          }
        }
      }
    });

    state.investments.forEach(inv => {
      const [y, m] = inv.startDate.split('-');
      const invYear = parseInt(y, 10);
      const invMonth = parseInt(m, 10) - 1;
      const monthsSinceInv = (year - invYear) * 12 + (month - invMonth);

      if (monthsSinceInv >= 0) {
        if (monthsSinceInv === 0) {
          investmentsThisMonth.push(inv);
        }
        
        const r = inv.expectedReturn / 100 / 12;
        const p = inv.initialAmount;
        const c = inv.monthlyContribution;

        let activeMonths = monthsSinceInv;
        let postContributionMonths = 0;

        if (inv.endDate) {
          const [ey, em] = inv.endDate.split('-');
          const endYear = parseInt(ey, 10);
          const endMonth = parseInt(em, 10) - 1;
          const maxMonths = (endYear - invYear) * 12 + (endMonth - invMonth);
          if (monthsSinceInv > maxMonths) {
            activeMonths = Math.max(0, maxMonths);
            postContributionMonths = monthsSinceInv - activeMonths;
          }
        }

        if (monthsSinceInv <= activeMonths) {
          totalInvestmentContributions += c;
        }

        let balanceAtEnd = 0;
        if (r === 0) {
          balanceAtEnd = p + (c * activeMonths);
          investmentBalance += balanceAtEnd;
        } else {
          balanceAtEnd = p * Math.pow(1 + r, activeMonths) + c * ((Math.pow(1 + r, activeMonths) - 1) / r);
          investmentBalance += balanceAtEnd * Math.pow(1 + r, postContributionMonths);
        }
      }
    });

    let cashBalance = 0;
    let realEstateEquity = 0;
    
    state.mortgages.forEach(mort => {
      const [y, m_str] = mort.startDate.split('-');
      const mortYear = parseInt(y, 10);
      const mortMonth = parseInt(m_str, 10) - 1;
      const startOffset = (mortYear - currentYear) * 12 + (mortMonth - currentMonth);
      const monthsSinceStart = (year - mortYear) * 12 + (month - mortMonth);

      if (monthsSinceStart >= 0) {
        if (monthsSinceStart === 0) {
          mortgagesThisMonth.push(mort);
        }

        if (mort.type === 'rent') {
          for (let m = 0; m <= monthsSinceStart; m++) {
            if (mort.endDate) {
              const [ey, em] = mort.endDate.split('-');
              const endYear = parseInt(ey, 10);
              const endMonth = parseInt(em, 10) - 1;
              const maxMonths = (endYear - mortYear) * 12 + (endMonth - mortMonth);
              if (m > maxMonths) continue;
            }
            if (startOffset + m >= 0) {
              cashBalance -= mort.monthlyPayment;
            }
          }
          return;
        }

        let activeMonths = monthsSinceStart;
        let isSold = false;

        if (mort.endDate) {
          const [ey, em] = mort.endDate.split('-');
          const endYear = parseInt(ey, 10);
          const endMonth = parseInt(em, 10) - 1;
          const maxMonths = (endYear - mortYear) * 12 + (endMonth - mortMonth);
          if (monthsSinceStart >= maxMonths) {
            activeMonths = maxMonths;
            isSold = true;
          }
        }

        let currentBalance = mort.balance;
        const r = mort.interestRate / 100 / 12;
        
        for (let m = 0; m < activeMonths; m++) {
          if (currentBalance > 0) {
            const interest = currentBalance * r;
            const principal = mort.monthlyPayment - interest;
            currentBalance = Math.max(0, currentBalance - principal);
            
            if (startOffset + m >= 0) {
              cashBalance -= mort.monthlyPayment;
            }
          }
        }

        if (isSold) {
          if (startOffset + activeMonths >= 0) {
            cashBalance += (mort.propertyValue - currentBalance);
          }
        } else {
          realEstateEquity += (mort.propertyValue - currentBalance);
        }
      }
    });

    const eventsThisMonth: LifeEvent[] = [];
    state.events.forEach(event => {
      const [y, m] = event.startDate.split('-');
      const eventYear = parseInt(y, 10);
      const eventMonth = parseInt(m, 10) - 1;
      const monthsSinceEvent = (year - eventYear) * 12 + (month - eventMonth);

      if (monthsSinceEvent >= 0) {
        if (event.occurrence === 'one-time') {
          cashBalance -= event.cost;
          if (monthsSinceEvent === 0) {
            eventsThisMonth.push(event);
          }
        } else {
          // Monthly
          let maxMonths = Infinity;
          if (event.endDate) {
            const [ey, em] = event.endDate.split('-');
            const endYear = parseInt(ey, 10);
            const endMonth = parseInt(em, 10) - 1;
            maxMonths = (endYear - eventYear) * 12 + (endMonth - eventMonth);
          }
          
          const activeMonths = Math.min(monthsSinceEvent, maxMonths);
          cashBalance += event.monthlyImpact * (activeMonths + 1);
          
          if (monthsSinceEvent <= maxMonths) {
            eventsThisMonth.push(event);
          }
        }
      }
    });

    // Add monthly income to cash balance
    // This is a cumulative calculation so we need to add the income for all months up to now
    let cumulativeIncome = 0;
    for (let m = 0; m <= i; m++) {
      const d = new Date(currentYear, currentMonth + m, 1);
      const y = d.getFullYear();
      const mon = d.getMonth();
      
      state.income.forEach(inc => {
        const [iy, im] = inc.startDate.split('-');
        const incYear = parseInt(iy, 10);
        const incMonth = parseInt(im, 10) - 1;
        const monthsSinceInc = (y - incYear) * 12 + (mon - incMonth);

        if (monthsSinceInc >= 0) {
          let maxMonths = Infinity;
          if (inc.endDate) {
            const [ey, em] = inc.endDate.split('-');
            const endYear = parseInt(ey, 10);
            const endMonth = parseInt(em, 10) - 1;
            maxMonths = (endYear - incYear) * 12 + (endMonth - incMonth);
          }
          if (monthsSinceInc <= maxMonths) {
            cumulativeIncome += inc.amount;
          }
        }
      });
    }
    cashBalance += cumulativeIncome;

    return {
      monthIndex: i,
      label,
      year,
      month,
      netWorth: Math.round(cashBalance + investmentBalance + realEstateEquity),
      cash: Math.round(cashBalance),
      investments: Math.round(investmentBalance),
      realEstate: Math.round(realEstateEquity),
      eventsThisMonth,
      investmentsThisMonth,
      mortgagesThisMonth
    };
  });

  const projection = (() => {
    switch (timeRange) {
      case 'YTD':
        return allProjectionData.filter(d => d.year === currentYear);
      case '1Y':
        return allProjectionData.slice(0, 13);
      case '5Y':
        return allProjectionData.slice(0, 61);
      case '10Y':
        return allProjectionData.slice(0, 121);
      case '15Y':
        return allProjectionData.slice(0, 181);
      case '20Y':
        return allProjectionData.slice(0, 241);
      case '25Y':
        return allProjectionData.slice(0, 301);
      case '30Y':
      default:
        return allProjectionData;
    }
  })();

  const milestones = [
    ...state.events.flatMap(e => [
      { id: `${e.id}-start`, date: e.startDate, label: `Start of ${e.title}`, color: 'text-zinc-400', dotColor: 'bg-zinc-400' },
      ...(e.endDate ? [{ id: `${e.id}-end`, date: e.endDate, label: `End of ${e.title}`, color: 'text-zinc-400', dotColor: 'bg-zinc-400' }] : [])
    ]),
    ...state.investments.flatMap(i => [
      { id: `${i.id}-start`, date: i.startDate, label: `Start of ${i.name}`, color: 'text-blue-400', dotColor: 'bg-blue-500' },
      ...(i.endDate ? [{ id: `${i.id}-end`, date: i.endDate, label: `End of ${i.name}`, color: 'text-blue-400', dotColor: 'bg-blue-500' }] : [])
    ]),
    ...state.income.flatMap(inc => [
      { id: `${inc.id}-start`, date: inc.startDate, label: `Start of ${inc.name}`, color: 'text-emerald-400', dotColor: 'bg-emerald-500' },
      ...(inc.endDate ? [{ id: `${inc.id}-end`, date: inc.endDate, label: `End of ${inc.name}`, color: 'text-emerald-400', dotColor: 'bg-emerald-500' }] : [])
    ]),
    ...state.mortgages.flatMap(m => [
      { id: `${m.id}-start`, date: m.startDate, label: `Start of ${m.name}`, color: 'text-emerald-400', dotColor: 'bg-emerald-500' },
      ...(m.endDate ? [{ id: `${m.id}-end`, date: m.endDate, label: `End of ${m.name}`, color: 'text-emerald-400', dotColor: 'bg-emerald-500' }] : [])
    ])
  ].filter(m => {
    const [y, mon] = m.date.split('-');
    const year = parseInt(y);
    const month = parseInt(mon) - 1;
    return projection.some(p => p.year === year && p.month === month);
  }).sort((a, b) => a.date.localeCompare(b.date));

  const triggerVibeCheck = async () => {
    setLoading(true);
    const result = await getVibeCheck(state);
    setVibeData(result);
    setLoading(false);
  };

  useEffect(() => {
    triggerVibeCheck();
  }, []);

  const addEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const occurrence = formData.get('occurrence') as 'one-time' | 'monthly';
    const cost = occurrence === 'one-time' ? Number(formData.get('cost')) : 0;
    const monthlyImpact = occurrence === 'monthly' ? -Number(formData.get('monthlyImpact')) : 0;

    const newEvent: LifeEvent = {
      id: editingEvent ? editingEvent.id : Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      cost,
      monthlyImpact,
      type: formData.get('type') as any,
      occurrence,
      startDate: formData.get('startDate') as string,
      endDate: occurrence === 'monthly' ? formData.get('endDate') as string : undefined,
      description: '',
    };
    if (editingEvent) {
      setState(prev => ({ ...prev, events: prev.events.map(ev => ev.id === editingEvent.id ? newEvent : ev) }));
    } else {
      setState(prev => ({ ...prev, events: [...prev.events, newEvent] }));
    }
    closeEventModal();
  };

  const addInvestment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newInvestment: Investment = {
      id: editingInvest ? editingInvest.id : Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      initialAmount: Number(formData.get('initialAmount')),
      monthlyContribution: Number(formData.get('monthlyContribution')),
      expectedReturn: Number(formData.get('expectedReturn')),
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
    };
    if (editingInvest) {
      setState(prev => ({ ...prev, investments: prev.investments.map(inv => inv.id === editingInvest.id ? newInvestment : inv) }));
    } else {
      setState(prev => ({ ...prev, investments: [...prev.investments, newInvestment] }));
    }
    closeInvestModal();
  };

  const addIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newIncome: Income = {
      id: editingIncome ? editingIncome.id : Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      amount: Number(formData.get('amount')),
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
    };
    if (editingIncome) {
      setState(prev => ({ ...prev, income: prev.income.map(inc => inc.id === editingIncome.id ? newIncome : inc) }));
    } else {
      setState(prev => ({ ...prev, income: [...prev.income, newIncome] }));
    }
    closeIncomeModal();
  };

  const addMortgage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMortgage: Mortgage = {
      id: editingMortgage ? editingMortgage.id : Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      type: mortgageType,
      propertyValue: mortgageType === 'mortgage' ? Number(formData.get('propertyValue')) : 0,
      balance: mortgageType === 'mortgage' ? Number(formData.get('balance')) : 0,
      monthlyPayment: Number(formData.get('monthlyPayment')),
      interestRate: mortgageType === 'mortgage' ? Number(formData.get('interestRate')) : 0,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
    };
    if (editingMortgage) {
      setState(prev => ({ ...prev, mortgages: prev.mortgages.map(m => m.id === editingMortgage.id ? newMortgage : m) }));
    } else {
      setState(prev => ({ ...prev, mortgages: [...prev.mortgages, newMortgage] }));
    }
    closeMortgageModal();
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventOccurrence('one-time');
  };

  const closeInvestModal = () => {
    setShowInvestModal(false);
    setEditingInvest(null);
  };

  const closeIncomeModal = () => {
    setShowIncomeModal(false);
    setEditingIncome(null);
  };

  const closeMortgageModal = () => {
    setShowMortgageModal(false);
    setEditingMortgage(null);
    setMortgageType('mortgage');
  };

  const removeEvent = (id: string) => {
    setState(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
  };

  const removeInvestment = (id: string) => {
    setState(prev => ({ ...prev, investments: prev.investments.filter(i => i.id !== id) }));
  };

  const removeIncome = (id: string) => {
    setState(prev => ({ ...prev, income: prev.income.filter(inc => inc.id !== id) }));
  };

  const removeMortgage = (id: string) => {
    setState(prev => ({ ...prev, mortgages: prev.mortgages.filter(m => m.id !== id) }));
  };

  const totalMonthlyContributions = state.investments.reduce((acc, i) => acc + i.monthlyContribution, 0);
  const totalMonthlyIncome = state.income.reduce((acc, inc) => acc + inc.amount, 0);
  const totalMonthlyImpacts = state.events.reduce((acc, e) => acc + e.monthlyImpact, 0);
  const totalMortgagePayments = state.mortgages.reduce((acc, m) => acc - m.monthlyPayment, 0);
  const totalMonthlyDelta = totalMonthlyIncome - totalMonthlyContributions + totalMonthlyImpacts + totalMortgagePayments;
  const totalMonthlyCashFlow = totalMonthlyIncome - totalMonthlyContributions + totalMonthlyImpacts + totalMortgagePayments;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white pb-20">
      <nav className="border-b border-zinc-800/50 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-zinc-100" />
            <span className="font-mono font-medium tracking-tight text-sm md:text-base">Later</span>
            <button 
              onClick={handleInstallClick}
              className="ml-2 bg-zinc-100 text-black hover:bg-white text-[10px] md:text-xs font-mono px-2 py-1 rounded-md transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <select 
              value={state.currency}
              onChange={(e) => setState(prev => ({ ...prev, currency: e.target.value }))}
              className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-[10px] md:text-xs font-mono rounded-md px-1.5 md:px-2 py-1 focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
              <option value="₹">₹ (INR)</option>
              <option value="₪">₪ (ILS)</option>
              <option value="">None (Units)</option>
            </select>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-[10px] md:text-xs font-mono rounded-md px-1.5 md:px-2 py-1 focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="neon">Neon</option>
            </select>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-panel p-5 md:p-6">
            <span className="label-micro text-[10px] md:text-xs">Projected Net Worth ({timeRange})</span>
            <div className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight mt-2">
              {state.currency}{projection[projection.length - 1]?.netWorth.toLocaleString() || 0}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-zinc-500 font-mono">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-zinc-400" />
              <span>Based on current trajectory</span>
            </div>
          </div>
          
          <div className="glass-panel p-5 md:p-6">
            <span className="label-micro text-[10px] md:text-xs">Total Monthly Delta</span>
            <div className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight mt-2">
              {state.currency}{totalMonthlyDelta.toLocaleString()}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] md:text-xs font-mono">
              <span className="text-blue-400">+{state.currency}{totalMonthlyContributions.toLocaleString()} ASSETS</span>
              <span className={totalMonthlyImpacts >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {totalMonthlyImpacts >= 0 ? '+' : ''}{state.currency}{totalMonthlyImpacts.toLocaleString()} EVENTS
              </span>
              {totalMortgagePayments < 0 && (
                <span className="text-rose-400">
                  -{state.currency}{Math.abs(totalMortgagePayments).toLocaleString()} MORTGAGE
                </span>
              )}
            </div>
          </div>

          <div className="glass-panel p-5 md:p-6">
            <div className="flex justify-between items-start">
              <span className="label-micro text-[10px] md:text-xs text-zinc-400">Monthly Take Home Pay</span>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight mt-2 flex items-center gap-2">
              <span>{state.currency}{totalMonthlyIncome.toLocaleString()}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-zinc-500 font-mono">
              <span className={totalMonthlyCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {totalMonthlyCashFlow >= 0 ? '+' : ''}{state.currency}{totalMonthlyCashFlow.toLocaleString()} {totalMonthlyCashFlow >= 0 ? 'SURPLUS' : 'DEFICIT'}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="glass-panel p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <span className="label-micro text-[10px] md:text-xs">Wealth Trajectory</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] md:text-[10px] font-mono uppercase tracking-wider mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                  <span className="text-zinc-500">Events</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span className="text-blue-500">Assets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-emerald-500">Real Estate</span>
                </div>
              </div>
            </div>
            <div className="flex bg-zinc-900/50 rounded-lg p-1 border border-zinc-800/50 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {(['YTD', '1Y', '5Y', '10Y', '15Y', '20Y', '25Y', '30Y'] as const).map(range => (
                <button 
                  key={range} 
                  onClick={() => setTimeRange(range)} 
                  className={cn(
                    "flex-1 sm:flex-none px-2 md:px-3 py-1 text-[9px] md:text-xs font-mono rounded-md transition-colors whitespace-nowrap",
                    timeRange === range ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#52525b" 
                  fontFamily="JetBrains Mono" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontFamily="JetBrains Mono" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${state.currency}${value/1000}k`}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip currency={state.currency} />} />
                <Area 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorNetWorth)" 
                />
                {state.events.map(event => {
                  const startPoint = projection.find(p => {
                    const [y, m] = event.startDate.split('-');
                    return p.year === parseInt(y) && p.month === (parseInt(m) - 1);
                  });
                  const endPoint = event.endDate ? projection.find(p => {
                    const [y, m] = event.endDate!.split('-');
                    return p.year === parseInt(y) && p.month === (parseInt(m) - 1);
                  }) : null;

                  return (
                    <React.Fragment key={event.id}>
                      {startPoint && (
                        <ReferenceDot 
                          x={startPoint.label} 
                          y={startPoint.netWorth} 
                          r={3} 
                          fill="#a1a1aa" 
                          stroke="#000" 
                          strokeWidth={1}
                        />
                      )}
                      {endPoint && (
                        <ReferenceDot 
                          x={endPoint.label} 
                          y={endPoint.netWorth} 
                          r={3} 
                          fill="#a1a1aa" 
                          stroke="#000" 
                          strokeWidth={1}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
                {state.investments.map(inv => {
                  const startPoint = projection.find(p => {
                    const [y, m] = inv.startDate.split('-');
                    return p.year === parseInt(y) && p.month === (parseInt(m) - 1);
                  });
                  const endPoint = inv.endDate ? projection.find(p => {
                    const [y, m] = inv.endDate!.split('-');
                    return p.year === parseInt(y) && p.month === (parseInt(m) - 1);
                  }) : null;

                  return (
                    <React.Fragment key={inv.id}>
                      {startPoint && (
                        <ReferenceDot 
                          x={startPoint.label} 
                          y={startPoint.netWorth} 
                          r={3} 
                          fill="#3b82f6" 
                          stroke="#000" 
                          strokeWidth={1}
                        />
                      )}
                      {endPoint && (
                        <ReferenceDot 
                          x={endPoint.label} 
                          y={endPoint.netWorth} 
                          r={3} 
                          fill="#3b82f6" 
                          stroke="#000" 
                          strokeWidth={1}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
                {state.mortgages.map(mort => {
                  const startPoint = projection.find(p => {
                    const [y, m] = mort.startDate.split('-');
                    return p.year === parseInt(y) && p.month === (parseInt(m) - 1);
                  });
                  const endPoint = mort.endDate ? projection.find(p => {
                    const [y, m] = mort.endDate!.split('-');
                    return p.year === parseInt(y) && p.month === (parseInt(m) - 1);
                  }) : null;

                  return (
                    <React.Fragment key={mort.id}>
                      {startPoint && (
                        <ReferenceDot 
                          x={startPoint.label} 
                          y={startPoint.netWorth} 
                          r={3} 
                          fill="#10b981" 
                          stroke="#000" 
                          strokeWidth={1}
                        />
                      )}
                      {endPoint && (
                        <ReferenceDot 
                          x={endPoint.label} 
                          y={endPoint.netWorth} 
                          r={3} 
                          fill="#10b981" 
                          stroke="#000" 
                          strokeWidth={1}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Milestones Timeline */}
          {milestones.length > 0 && (
            <div className="mt-8 pt-6 border-t border-zinc-800/50">
              <span className="label-micro mb-4 block">Timeline Milestones</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {milestones.map(m => (
                  <div key={m.id} className="flex flex-col gap-1 p-2 rounded-md hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", m.dotColor)}></div>
                      <span className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase">{m.date}</span>
                    </div>
                    <span className={cn("text-[11px] md:text-xs font-medium truncate", m.color)} title={m.label}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Section */}
        <div className="glass-panel p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Sparkles className="w-12 md:w-24 h-12 md:h-24" />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 relative z-10">
            <span className="label-micro flex items-center gap-2 text-[10px] md:text-xs">
              <Activity className="w-3 h-3" /> AI Analysis
            </span>
            <button onClick={triggerVibeCheck} disabled={loading} className="btn-minimal text-[10px] md:text-xs py-1.5 w-full sm:w-auto">
              {loading ? "Processing..." : "Refresh Analysis"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 relative z-10">
            <div className="md:col-span-3">
              <div className="flex items-end gap-2">
                <span className="text-3xl md:text-5xl font-light">{loading ? "--" : vibeData?.score}</span>
                <span className="text-[10px] md:text-sm text-zinc-500 mb-1 md:mb-1.5 font-mono">/ 100</span>
              </div>
              <div className="text-[9px] md:text-xs text-zinc-500 font-mono mt-1">Vibe Score</div>
            </div>
            <div className="md:col-span-9 space-y-3 md:space-y-4">
              <p className="text-[11px] md:text-sm text-zinc-300 leading-relaxed">
                {loading ? "Analyzing trajectory..." : vibeData?.analysis}
              </p>
              {vibeData?.advice && !loading && (
                <div className="p-2 md:p-3 rounded bg-zinc-900/50 border border-zinc-800/50 text-[9px] md:text-xs text-zinc-400 font-mono">
                  {">"} {vibeData.advice}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Income Section */}
        <div className="glass-panel p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="label-micro">Income Streams</span>
            <button onClick={() => { setEditingIncome(null); setShowIncomeModal(true); }} className="btn-minimal text-[10px] md:text-xs py-1.5">
              <Plus className="w-3 h-3" /> Add Income
            </button>
          </div>
          <div className="space-y-3">
            {state.income.map(inc => (
              <div key={inc.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors gap-3">
                <div className="w-full sm:w-auto">
                  <div className="font-medium text-[11px] md:text-sm">{inc.name}</div>
                  <div className="text-[9px] md:text-xs text-zinc-500 font-mono mt-1">
                    {state.currency}{inc.amount.toLocaleString()}/mo • {inc.startDate}{inc.endDate ? ` to ${inc.endDate}` : ''}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                  <div className="text-left sm:text-right mr-2">
                    <div className="text-[11px] md:text-sm font-mono text-emerald-400">+{state.currency}{inc.amount.toLocaleString()}/mo</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingIncome(inc); setShowIncomeModal(true); }} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-zinc-300 transition-all">
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => removeIncome(inc.id)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {state.income.length === 0 && (
              <div className="text-center py-6 text-[10px] md:text-sm text-zinc-500 font-mono">
                No income streams added yet.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Grid: Investments & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investments */}
          <div className="glass-panel p-5 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="label-micro">Active Investments</span>
              <button onClick={() => { setEditingInvest(null); setShowInvestModal(true); }} className="btn-minimal text-[10px] md:text-xs py-1.5">
                <Plus className="w-3 h-3" /> Add Asset
              </button>
            </div>
            <div className="space-y-3">
              {state.investments.map(inv => (
                <div key={inv.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors gap-3">
                  <div className="w-full sm:w-auto">
                    <div className="font-medium text-[11px] md:text-sm">{inv.name}</div>
                    <div className="text-[9px] md:text-xs text-zinc-500 font-mono mt-1">
                      {state.currency}{inv.initialAmount.toLocaleString()} + {state.currency}{inv.monthlyContribution.toLocaleString()}/mo • {inv.startDate}{inv.endDate ? ` to ${inv.endDate}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                    <div className="text-left sm:text-right mr-2">
                      <div className="text-[11px] md:text-sm font-mono text-emerald-400">{inv.expectedReturn}% APY</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingInvest(inv); setShowInvestModal(true); }} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-zinc-300 transition-all">
                        <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button onClick={() => removeInvestment(inv.id)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 transition-all">
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Life Events */}
          <div className="glass-panel p-5 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="label-micro">Life Events</span>
              <button onClick={() => { setEditingEvent(null); setEventOccurrence('one-time'); setShowEventModal(true); }} className="btn-minimal text-[10px] md:text-xs py-1.5">
                <Plus className="w-3 h-3" /> Add Event
              </button>
            </div>
            <div className="space-y-3">
              {state.events.map(event => (
                <div key={event.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors gap-3">
                  <div className="w-full sm:w-auto">
                    <div className="font-medium text-[11px] md:text-sm">{event.title}</div>
                    <div className="text-[9px] md:text-xs text-zinc-500 font-mono mt-1">
                      {event.occurrence === 'one-time' ? 'Amount: ' : 'Monthly: '}{state.currency}{event.occurrence === 'one-time' ? event.cost.toLocaleString() : Math.abs(event.monthlyImpact).toLocaleString()} • {event.startDate}{event.endDate ? ` to ${event.endDate}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                    {event.occurrence === 'monthly' && (
                      <div className="text-left sm:text-right mr-2">
                        <div className={cn("text-[11px] md:text-sm font-mono", event.monthlyImpact >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {event.monthlyImpact >= 0 ? "+" : "-"}{state.currency}{Math.abs(event.monthlyImpact).toLocaleString()}/mo
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingEvent(event); setEventOccurrence(event.occurrence); setShowEventModal(true); }} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-zinc-300 transition-all">
                        <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button onClick={() => removeEvent(event.id)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 transition-all">
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real Estate & Mortgages */}
        <div className="glass-panel p-5 md:p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="label-micro">Real Estate & Mortgages</span>
            <button onClick={() => { setEditingMortgage(null); setShowMortgageModal(true); }} className="btn-minimal text-[10px] md:text-xs py-1.5">
              <Plus className="w-3 h-3" /> Add Property
            </button>
          </div>
          <div className="space-y-3">
            {state.mortgages.map(mort => (
              <div key={mort.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors gap-3">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-[11px] md:text-sm">{mort.name}</div>
                    <span className={cn(
                      "text-[8px] md:text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono",
                      mort.type === 'mortgage' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                      {mort.type}
                    </span>
                  </div>
                  <div className="text-[9px] md:text-xs text-zinc-500 font-mono mt-1">
                    {mort.type === 'mortgage' ? (
                      <>Value: {state.currency}{mort.propertyValue.toLocaleString()} • Balance: {state.currency}{mort.balance.toLocaleString()} • </>
                    ) : null}
                    {mort.startDate}{mort.endDate ? ` to ${mort.endDate}` : ''}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                  <div className="text-left sm:text-right mr-2">
                    <div className="text-[11px] md:text-sm font-mono text-rose-400">-{state.currency}{mort.monthlyPayment.toLocaleString()}/mo</div>
                    {mort.type === 'mortgage' && (
                      <div className="text-[9px] md:text-xs text-zinc-500 font-mono">{mort.interestRate}% APY</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingMortgage(mort); setMortgageType(mort.type); setShowMortgageModal(true); }} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-zinc-300 transition-all">
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => removeMortgage(mort.id)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {state.mortgages.length === 0 && (
              <div className="text-center py-6 text-[10px] md:text-sm text-zinc-500 font-mono">
                No properties added yet.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Investment Modal */}
      <AnimatePresence>
        {showInvestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeInvestModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative glass-panel p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base md:text-lg font-medium">{editingInvest ? 'Edit Asset' : 'Configure Asset'}</h2>
                <button onClick={closeInvestModal} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={addInvestment} className="space-y-4 md:space-y-5">
                <div>
                  <span className="label-micro text-[10px] md:text-xs">Asset Name</span>
                  <input name="name" defaultValue={editingInvest?.name || ''} required className="input-minimal text-sm md:text-base" placeholder="e.g. S&P 500 ETF" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Initial Capital ({state.currency || 'Units'})</span>
                    <input name="initialAmount" type="number" defaultValue={editingInvest?.initialAmount} placeholder="0" required className="input-minimal text-sm md:text-base" />
                  </div>
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Interest Rate (%)</span>
                    <input name="expectedReturn" type="number" step="0.1" defaultValue={editingInvest?.expectedReturn} placeholder="8" required className="input-minimal text-sm md:text-base" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Monthly Contrib. ({state.currency || 'Units'})</span>
                    <input name="monthlyContribution" type="number" defaultValue={editingInvest?.monthlyContribution} placeholder="0" required className="input-minimal text-sm md:text-base" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Start Date</span>
                    <input name="startDate" type="date" defaultValue={editingInvest?.startDate || new Date().toISOString().split('T')[0]} required className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">End Date (Optional)</span>
                    <input name="endDate" type="date" defaultValue={editingInvest?.endDate || ''} className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeInvestModal} className="flex-1 btn-minimal text-xs md:text-sm py-2">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary text-xs md:text-sm py-2">{editingInvest ? 'Save Changes' : 'Deploy Asset'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeEventModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative glass-panel p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base md:text-lg font-medium">{editingEvent ? 'Edit Event' : 'Schedule Event'}</h2>
                <button onClick={closeEventModal} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={addEvent} className="space-y-4 md:space-y-5">
                <div>
                  <span className="label-micro text-[10px] md:text-xs">Event Description</span>
                  <input name="title" defaultValue={editingEvent?.title || ''} required className="input-minimal text-sm md:text-base" placeholder="e.g. Down Payment" />
                </div>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Occurrence</span>
                    <select 
                      name="occurrence" 
                      value={eventOccurrence} 
                      onChange={(e) => setEventOccurrence(e.target.value as 'one-time' | 'monthly')} 
                      className="input-minimal text-sm md:text-base [&>option]:bg-zinc-900"
                    >
                      <option value="one-time">One-time</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {eventOccurrence === 'one-time' ? (
                    <div>
                      <span className="label-micro text-[10px] md:text-xs">Amount ({state.currency || 'Units'})</span>
                      <input name="cost" type="number" defaultValue={editingEvent?.cost} placeholder="0" required className="input-minimal text-sm md:text-base" />
                    </div>
                  ) : (
                    <div>
                      <span className="label-micro text-[10px] md:text-xs">Monthly Payment ({state.currency || 'Units'})</span>
                      <input name="monthlyImpact" type="number" defaultValue={editingEvent ? Math.abs(editingEvent.monthlyImpact) : undefined} placeholder="0" required className="input-minimal text-sm md:text-base" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Start Date</span>
                    <input name="startDate" type="date" defaultValue={editingEvent?.startDate || new Date().toISOString().split('T')[0]} required className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  {eventOccurrence === 'monthly' && (
                    <div>
                      <span className="label-micro text-[10px] md:text-xs">End Date</span>
                      <input name="endDate" type="date" defaultValue={editingEvent?.endDate || ''} required className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                  )}
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeEventModal} className="flex-1 btn-minimal text-xs md:text-sm py-2">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary text-xs md:text-sm py-2">{editingEvent ? 'Save Changes' : 'Commit Event'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Income Modal */}
      <AnimatePresence>
        {showIncomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeIncomeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative glass-panel p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base md:text-lg font-medium">{editingIncome ? 'Edit Income' : 'Configure Income'}</h2>
                <button onClick={closeIncomeModal} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={addIncome} className="space-y-4 md:space-y-5">
                <div>
                  <span className="label-micro text-[10px] md:text-xs">Income Name</span>
                  <input name="name" defaultValue={editingIncome?.name || ''} required className="input-minimal text-sm md:text-base" placeholder="e.g. Primary Salary" />
                </div>
                <div>
                  <span className="label-micro text-[10px] md:text-xs">Monthly Amount ({state.currency || 'Units'})</span>
                  <input name="amount" type="number" defaultValue={editingIncome?.amount} placeholder="0" required className="input-minimal text-sm md:text-base" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Start Date</span>
                    <input name="startDate" type="date" defaultValue={editingIncome?.startDate || new Date().toISOString().split('T')[0]} required className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">End Date (Optional)</span>
                    <input name="endDate" type="date" defaultValue={editingIncome?.endDate || ''} className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeIncomeModal} className="flex-1 btn-minimal text-xs md:text-sm py-2">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary text-xs md:text-sm py-2">{editingIncome ? 'Save Changes' : 'Add Income'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mortgage Modal */}
      <AnimatePresence>
        {showMortgageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeMortgageModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative glass-panel p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base md:text-lg font-medium">{editingMortgage ? 'Edit Entry' : 'Add Real Estate / Rent'}</h2>
                <button onClick={closeMortgageModal} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={addMortgage} className="space-y-4 md:space-y-5">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Type</span>
                    <select 
                      value={mortgageType} 
                      onChange={(e) => setMortgageType(e.target.value as 'mortgage' | 'rent')}
                      className="input-minimal text-sm md:text-base [&>option]:bg-zinc-900"
                    >
                      <option value="mortgage">Mortgage</option>
                      <option value="rent">Rent</option>
                    </select>
                  </div>
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Entry Name</span>
                    <input name="name" defaultValue={editingMortgage?.name || ''} required className="input-minimal text-sm md:text-base" placeholder="e.g. Primary Residence" />
                  </div>
                </div>
                {mortgageType === 'mortgage' && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <span className="label-micro text-[10px] md:text-xs">Property Value ({state.currency || 'Units'})</span>
                      <input name="propertyValue" type="number" defaultValue={editingMortgage?.propertyValue} placeholder="0" required className="input-minimal text-sm md:text-base" />
                    </div>
                    <div>
                      <span className="label-micro text-[10px] md:text-xs">Current Balance ({state.currency || 'Units'})</span>
                      <input name="balance" type="number" defaultValue={editingMortgage?.balance} placeholder="0" required className="input-minimal text-sm md:text-base" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Monthly Payment ({state.currency || 'Units'})</span>
                    <input name="monthlyPayment" type="number" defaultValue={editingMortgage?.monthlyPayment} placeholder="0" required className="input-minimal text-sm md:text-base" />
                  </div>
                  {mortgageType === 'mortgage' && (
                    <div>
                      <span className="label-micro text-[10px] md:text-xs">Interest Rate (%)</span>
                      <input name="interestRate" type="number" step="0.01" defaultValue={editingMortgage?.interestRate} placeholder="0" required className="input-minimal text-sm md:text-base" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">Start Date</span>
                    <input name="startDate" type="date" defaultValue={editingMortgage?.startDate || new Date().toISOString().split('T')[0]} required className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  <div>
                    <span className="label-micro text-[10px] md:text-xs">End Date (Optional)</span>
                    <input name="endDate" type="date" defaultValue={editingMortgage?.endDate || ''} className="input-minimal text-sm md:text-base [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeMortgageModal} className="flex-1 btn-minimal text-xs md:text-sm py-2">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary text-xs md:text-sm py-2">{editingMortgage ? 'Save Changes' : 'Add Entry'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
