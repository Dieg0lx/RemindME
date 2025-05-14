
"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltipRecharts, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale

const APP_EXPENSES_STORAGE_KEY = "remindme_expenses";
const APP_INCOME_STORAGE_KEY = "remindme_income_transactions";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface IncomeTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface MonthlySummary {
  month: string; // e.g., "Julio"
  year: number;
  expenses: number;
  income: number;
}

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--chart-2))",
  },
  expenses: {
    label: "Gastos",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = React.useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = React.useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = React.useState<number>(0);
  const [budgetUtilization, setBudgetUtilization] = React.useState<number>(0);
  const [monthlyChartData, setMonthlyChartData] = React.useState<MonthlySummary[]>([]);

  const fetchDataAndUpdateDashboard = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    const storedExpensesRaw = localStorage.getItem(APP_EXPENSES_STORAGE_KEY);
    const storedIncomeRaw = localStorage.getItem(APP_INCOME_STORAGE_KEY);

    let expenses: Expense[] = [];
    let incomeTransactions: IncomeTransaction[] = [];

    try {
      if (storedExpensesRaw) expenses = JSON.parse(storedExpensesRaw);
    } catch (e) {
      console.error("Failed to parse expenses from localStorage", e);
    }
    try {
      if (storedIncomeRaw) incomeTransactions = JSON.parse(storedIncomeRaw);
    } catch (e) {
      console.error("Failed to parse income from localStorage", e);
    }

    // Calculate Total Balance (All time)
    const totalIncomeAllTime = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpensesAllTime = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    setTotalBalance(totalIncomeAllTime - totalExpensesAllTime);

    // Calculate Current Month's Income and Expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthIncomeTxns = incomeTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
    });
    const currentMonthExpensesTxns = expenses.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
    });

    const currentMonthIncomeTotal = currentMonthIncomeTxns.reduce((sum, tx) => sum + tx.amount, 0);
    const currentMonthExpensesTotal = currentMonthExpensesTxns.reduce((sum, tx) => sum + tx.amount, 0);
    
    setMonthlyIncome(currentMonthIncomeTotal);
    setMonthlyExpenses(currentMonthExpensesTotal);

    // Calculate Budget Utilization
    if (currentMonthIncomeTotal > 0) {
      const utilization = Math.min((currentMonthExpensesTotal / currentMonthIncomeTotal) * 100, 100); // Cap at 100%
      setBudgetUtilization(parseFloat(utilization.toFixed(0)));
    } else if (currentMonthExpensesTotal > 0) {
      setBudgetUtilization(100); // Income is 0 but expenses exist
    }
    else {
      setBudgetUtilization(0);
    }

    // Prepare Chart Data (Last 6 months)
    const chartDataArray: MonthlySummary[] = [];
    for (let i = 5; i >= 0; i--) {
      const dateIterator = new Date(currentDate);
      dateIterator.setMonth(currentDate.getMonth() - i);
      const month = dateIterator.getMonth();
      const year = dateIterator.getFullYear();

      const monthIncome = incomeTransactions
        .filter(tx => {
          const txDate = new Date(tx.date);
          return txDate.getFullYear() === year && txDate.getMonth() === month;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthExpenses = expenses
        .filter(tx => {
          const txDate = new Date(tx.date);
          return txDate.getFullYear() === year && txDate.getMonth() === month;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      chartDataArray.push({
        month: format(dateIterator, 'MMMM', { locale: es }), // Use Spanish locale for month names
        year: year,
        income: monthIncome,
        expenses: monthExpenses,
      });
    }
    setMonthlyChartData(chartDataArray);

  }, []);

  React.useEffect(() => {
    fetchDataAndUpdateDashboard(); // Initial fetch

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === APP_EXPENSES_STORAGE_KEY || event.key === APP_INCOME_STORAGE_KEY) {
        fetchDataAndUpdateDashboard();
      }
    };

    const handleLocalStorageUpdated = (event: CustomEvent) => {
      if (event.detail?.key === APP_EXPENSES_STORAGE_KEY || event.detail?.key === APP_INCOME_STORAGE_KEY) {
        fetchDataAndUpdateDashboard();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);
    };
  }, [fetchDataAndUpdateDashboard]);

  return (
    <AppLayout>
      <PageHeader title="Panel de Control" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
            {/* <p className="text-xs text-muted-foreground">+5.2% del mes pasado</p> */}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Mes actual</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Mensuales</CardTitle>
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyExpenses.toFixed(2)}</div>
            {/* <p className="text-xs text-muted-foreground">-2.1% del mes pasado</p> */}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilización del Presupuesto</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUtilization}% Utilizado</div>
            <Progress value={budgetUtilization} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-1">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Resumen de Ingresos vs Gastos</CardTitle>
            <CardDescription>Rendimiento de los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                   <ChartTooltipRecharts cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Legend formatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} name="Ingresos" />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

