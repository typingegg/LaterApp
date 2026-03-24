export interface LifeEvent {
  id: string;
  title: string;
  cost: number;
  monthlyImpact: number;
  type: 'expense' | 'investment' | 'milestone';
  occurrence: 'one-time' | 'monthly';
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Investment {
  id: string;
  name: string;
  initialAmount: number;
  monthlyContribution: number;
  expectedReturn: number; // annual %
  startDate: string;
  endDate?: string;
}

export interface Mortgage {
  id: string;
  name: string;
  type: 'mortgage' | 'rent';
  propertyValue: number;
  balance: number;
  monthlyPayment: number;
  interestRate: number; // annual %
  startDate: string;
  endDate?: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate?: string;
}

export interface UserState {
  events: LifeEvent[];
  investments: Investment[];
  mortgages: Mortgage[];
  income: Income[];
  currency: string;
}

export const INITIAL_STATE: UserState = {
  events: [
    {
      id: '1',
      title: 'Buy a Car',
      cost: 15000,
      monthlyImpact: 0,
      type: 'expense',
      occurrence: 'one-time',
      startDate: `${new Date().getFullYear() + 2}-06-01`,
      description: 'Reliable daily driver'
    }
  ],
  investments: [
    { 
      id: 'inv-1',
      name: 'S&P 500 Index', 
      initialAmount: 5000, 
      monthlyContribution: 500,
      expectedReturn: 8,
      startDate: new Date().toISOString().split('T')[0]
    }
  ],
  mortgages: [
    {
      id: 'mort-1',
      name: 'Primary Residence',
      type: 'mortgage',
      propertyValue: 400000,
      balance: 300000,
      monthlyPayment: 2000,
      interestRate: 4.5,
      startDate: new Date().toISOString().split('T')[0]
    }
  ],
  income: [
    {
      id: 'inc-1',
      name: 'Primary Salary',
      amount: 5000,
      startDate: new Date().toISOString().split('T')[0]
    }
  ],
  currency: '$'
};
