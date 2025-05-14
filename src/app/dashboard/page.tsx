
"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, TrendingDown, Wallet, CalendarClock } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltipRecharts, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { format, parseISO, addMonths, addQuarters, addYears, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { APP_LOGGED_IN_USER_KEY, getUserSpecificKey } from "@/lib/storageKeys";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

const APP_EXPENSES_STORAGE_KEY_BASE = "remindme_expenses";
const APP_INCOME_STORAGE_KEY_BASE = "remindme_income_transactions";
const APP_SUBSCRIPTIONS_STORAGE_KEY_BASE = "remindme_subscriptions";
const SUBSCRIPTION_EXPENSE_CATEGORY = "Suscripciones";

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

interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: "Mensual" | "Anual" | "Trimestral";
  nextDueDate: string; 
  status: "Activa" | "Pausada" | "Cancelada";
}

interface MonthlySummary {
  month: string; 
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

const MAX_UPCOMING_SUBSCRIPTIONS = 5;

export default function DashboardPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);

  const [totalBalance, setTotalBalance] = React.useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = React.useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = React.useState<number>(0);
  const [budgetUtilization, setBudgetUtilization] = React.useState<number>(0);
  const [monthlyChartData, setMonthlyChartData] = React.useState<MonthlySummary[]>([]);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = React.useState<Subscription[]>([]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInUserRaw = localStorage.getItem(APP_LOGGED_IN_USER_KEY);
      if (loggedInUserRaw) {
        try {
          const loggedInUser = JSON.parse(loggedInUserRaw);
          setCurrentUserEmail(loggedInUser.email);
        } catch (e) {
          console.error("Failed to parse logged in user", e);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  const fetchDataAndUpdateDashboard = React.useCallback(() => {
    if (typeof window === 'undefined' || !currentUserEmail) return;

    const userExpensesKey = getUserSpecificKey(APP_EXPENSES_STORAGE_KEY_BASE, currentUserEmail);
    const userIncomeKey = getUserSpecificKey(APP_INCOME_STORAGE_KEY_BASE, currentUserEmail);
    const userSubscriptionsKey = getUserSpecificKey(APP_SUBSCRIPTIONS_STORAGE_KEY_BASE, currentUserEmail);

    const storedExpensesRaw = localStorage.getItem(userExpensesKey);
    const storedIncomeRaw = localStorage.getItem(userIncomeKey);
    const storedSubscriptionsRaw = localStorage.getItem(userSubscriptionsKey);

    let currentExpenses: Expense[] = [];
    let incomeTransactions: IncomeTransaction[] = [];
    let rawSubscriptions: Subscription[] = [];

    try {
      if (storedExpensesRaw) currentExpenses = JSON.parse(storedExpensesRaw);
    } catch (e) { console.error("Failed to parse expenses from localStorage", e); }
    try {
      if (storedIncomeRaw) incomeTransactions = JSON.parse(storedIncomeRaw);
    } catch (e) { console.error("Failed to parse income from localStorage", e); }
    try {
      if (storedSubscriptionsRaw) rawSubscriptions = JSON.parse(storedSubscriptionsRaw);
    } catch (e) { console.error("Failed to parse subscriptions from localStorage", e); }

    const today = startOfDay(new Date());
    const newlyGeneratedSubscriptionExpenses: Expense[] = [];

    const updatedSubscriptions = rawSubscriptions.map(sub => {
      let currentSub = { ...sub };
      if (currentSub.status === "Activa") {
        let paymentDate = parseISO(currentSub.nextDueDate);
        
        while (isBefore(paymentDate, today)) {
          const expenseIdForSubscriptionPayment = `sub_${currentSub.id}_${format(paymentDate, 'yyyy-MM-dd')}`;
          const expenseExists = currentExpenses.some(exp => exp.id === expenseIdForSubscriptionPayment) || 
                                newlyGeneratedSubscriptionExpenses.some(exp => exp.id === expenseIdForSubscriptionPayment);

          if (!expenseExists) {
            newlyGeneratedSubscriptionExpenses.push({
              id: expenseIdForSubscriptionPayment,
              date: format(paymentDate, 'yyyy-MM-dd'),
              category: SUBSCRIPTION_EXPENSE_CATEGORY,
              description: `Pago de suscripción: ${currentSub.name}`,
              amount: currentSub.amount,
            });
          }

          switch (currentSub.cycle) {
            case "Mensual":
              paymentDate = addMonths(paymentDate, 1);
              break;
            case "Trimestral":
              paymentDate = addQuarters(paymentDate, 1);
              break;
            case "Anual":
              paymentDate = addYears(paymentDate, 1);
              break;
          }
        }
        currentSub.nextDueDate = format(paymentDate, 'yyyy-MM-dd');
      }
      return currentSub;
    });
    
    const finalExpenses = [...currentExpenses, ...newlyGeneratedSubscriptionExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (currentUserEmail) {
      if (newlyGeneratedSubscriptionExpenses.length > 0) {
        localStorage.setItem(userExpensesKey, JSON.stringify(finalExpenses));
        window.dispatchEvent(new CustomEvent('localStorageUpdated', { detail: { key: userExpensesKey } }));
      }
      localStorage.setItem(userSubscriptionsKey, JSON.stringify(updatedSubscriptions));
      window.dispatchEvent(new CustomEvent('localStorageUpdated', { detail: { key: userSubscriptionsKey } }));
    }
    
    const totalIncomeAllTime = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpensesAllTime = finalExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    setTotalBalance(totalIncomeAllTime - totalExpensesAllTime);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthIncomeTxns = incomeTransactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
    });
    const currentMonthExpensesTxns = finalExpenses.filter(tx => {
      const txDate = parseISO(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
    });

    const currentMonthIncomeTotal = currentMonthIncomeTxns.reduce((sum, tx) => sum + tx.amount, 0);
    const currentMonthExpensesTotal = currentMonthExpensesTxns.reduce((sum, tx) => sum + tx.amount, 0);
    
    setMonthlyIncome(currentMonthIncomeTotal);
    setMonthlyExpenses(currentMonthExpensesTotal);

    if (currentMonthIncomeTotal > 0) {
      const utilization = Math.min((currentMonthExpensesTotal / currentMonthIncomeTotal) * 100, 100);
      setBudgetUtilization(parseFloat(utilization.toFixed(0)));
    } else if (currentMonthExpensesTotal > 0) {
      setBudgetUtilization(100); 
    } else {
      setBudgetUtilization(0);
    }

    const chartDataArray: MonthlySummary[] = [];
    for (let i = 5; i >= 0; i--) {
      const dateIterator = new Date(currentDate);
      dateIterator.setMonth(currentDate.getMonth() - i);
      const month = dateIterator.getMonth();
      const year = dateIterator.getFullYear();

      const monthIncome = incomeTransactions
        .filter(tx => {
          const txDate = parseISO(tx.date);
          return txDate.getFullYear() === year && txDate.getMonth() === month;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthExpenses = finalExpenses
        .filter(tx => {
          const txDate = parseISO(tx.date);
          return txDate.getFullYear() === year && txDate.getMonth() === month;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      chartDataArray.push({
        month: format(dateIterator, 'MMMM', { locale: es }), 
        year: year,
        income: monthIncome,
        expenses: monthExpenses,
      });
    }
    setMonthlyChartData(chartDataArray);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcoming = updatedSubscriptions
      .filter(sub => {
        const dueDate = parseISO(sub.nextDueDate);
        return sub.status === "Activa" && dueDate >= today && dueDate <= sevenDaysFromNow;
      })
      .sort((a, b) => parseISO(a.nextDueDate).getTime() - parseISO(b.nextDueDate).getTime())
      .slice(0, MAX_UPCOMING_SUBSCRIPTIONS);
    setUpcomingSubscriptions(upcoming);

  }, [currentUserEmail, router]); // Added router to dependency array as it's used inside

  React.useEffect(() => {
    if (currentUserEmail) {
        fetchDataAndUpdateDashboard();
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (currentUserEmail) {
        const userExpensesKey = getUserSpecificKey(APP_EXPENSES_STORAGE_KEY_BASE, currentUserEmail);
        const userIncomeKey = getUserSpecificKey(APP_INCOME_STORAGE_KEY_BASE, currentUserEmail);
        const userSubscriptionsKey = getUserSpecificKey(APP_SUBSCRIPTIONS_STORAGE_KEY_BASE, currentUserEmail);
        if (event.key === userExpensesKey || event.key === userIncomeKey || event.key === userSubscriptionsKey) {
          fetchDataAndUpdateDashboard();
        }
      }
    };

    const handleLocalStorageUpdated = (event: CustomEvent) => {
      if (currentUserEmail) {
        const userExpensesKey = getUserSpecificKey(APP_EXPENSES_STORAGE_KEY_BASE, currentUserEmail);
        const userIncomeKey = getUserSpecificKey(APP_INCOME_STORAGE_KEY_BASE, currentUserEmail);
        const userSubscriptionsKey = getUserSpecificKey(APP_SUBSCRIPTIONS_STORAGE_KEY_BASE, currentUserEmail);
        if (event.detail?.key === userExpensesKey || event.detail?.key === userIncomeKey || event.detail?.key === userSubscriptionsKey) {
          fetchDataAndUpdateDashboard();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);
    };
  }, [fetchDataAndUpdateDashboard, currentUserEmail]);


  const getBudgetIndicatorColor = (utilization: number): string => {
    if (utilization >= 100) { // Changed to >= 100 for red
      return "bg-destructive"; // Red
    }
    if (utilization >= 60 && utilization < 90) { // Changed to < 90 for yellow
      return "bg-[hsl(var(--chart-4))]"; // Yellow (using chart-4 for yellow-ish color)
    }
    return "bg-primary"; // Default blue (primary color)
  };
  
  const budgetIndicatorClassName = getBudgetIndicatorColor(budgetUtilization);

  if (!currentUserEmail) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <p>Cargando datos del usuario...</p>
        </div>
      </AppLayout>
    );
  }

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
             <p className="text-xs text-muted-foreground">Mes actual</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilización del Presupuesto</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUtilization}% Utilizado</div>
            <Progress value={budgetUtilization} className="mt-2 h-2" indicatorClassName={budgetIndicatorClassName} />
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
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

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarClock className="mr-2 h-5 w-5 text-muted-foreground" />
              Próximas Suscripciones (7 días)
            </CardTitle>
            <CardDescription>Pagos recurrentes que se acercan en la próxima semana.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSubscriptions.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <ul className="space-y-3 pr-3">
                  {upcomingSubscriptions.map(sub => (
                    <li key={sub.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {format(parseISO(sub.nextDueDate), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-base">${sub.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{sub.cycle}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No tienes suscripciones activas próximas a vencer en los siguientes 7 días.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

