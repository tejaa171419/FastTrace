// Balance Debugging Utility
// This helps debug balance calculation issues

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  payerName: string;
  splits: Array<{
    memberId: string;
    memberName: string;
    amount: number;
  }>;
  date: Date;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = gets money, negative = owes money
  transactions: Array<{
    expenseId: string;
    expenseTitle: string;
    paid: number;
    owed: number;
    net: number;
  }>;
}

export class BalanceDebugger {
  private expenses: ExpenseRecord[] = [];

  addExpense(expense: ExpenseRecord) {
    this.expenses.push(expense);
    console.log('🧮 Added expense for debugging:', expense);
    this.debugBalances();
  }

  calculateMemberBalances(memberIds: string[]): MemberBalance[] {
    const balances: { [memberId: string]: MemberBalance } = {};

    // Initialize balances for all members
    memberIds.forEach(memberId => {
      const memberName = this.getMemberName(memberId);
      balances[memberId] = {
        memberId,
        memberName,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
        transactions: []
      };
    });

    // Process each expense
    this.expenses.forEach(expense => {
      // Add payment amount to payer
      if (balances[expense.payerId]) {
        balances[expense.payerId].totalPaid += expense.amount;
        balances[expense.payerId].transactions.push({
          expenseId: expense.id,
          expenseTitle: expense.title,
          paid: expense.amount,
          owed: 0,
          net: expense.amount
        });
      }

      // Add owed amounts to each member in the split
      expense.splits.forEach(split => {
        if (balances[split.memberId]) {
          balances[split.memberId].totalOwed += split.amount;
          
          // Update or add transaction record
          const existingTransaction = balances[split.memberId].transactions
            .find(t => t.expenseId === expense.id);
          
          if (existingTransaction) {
            existingTransaction.owed = split.amount;
            existingTransaction.net = existingTransaction.paid - split.amount;
          } else {
            balances[split.memberId].transactions.push({
              expenseId: expense.id,
              expenseTitle: expense.title,
              paid: 0,
              owed: split.amount,
              net: -split.amount
            });
          }
        }
      });
    });

    // Calculate net balances
    Object.values(balances).forEach(balance => {
      balance.netBalance = balance.totalPaid - balance.totalOwed;
    });

    return Object.values(balances);
  }

  debugBalances() {
    console.log('\n🔍 BALANCE DEBUG REPORT');
    console.log('='.repeat(50));
    
    const memberIds = [...new Set([
      ...this.expenses.map(e => e.payerId),
      ...this.expenses.flatMap(e => e.splits.map(s => s.memberId))
    ])];

    const balances = this.calculateMemberBalances(memberIds);

    balances.forEach(balance => {
      console.log(`\n👤 ${balance.memberName} (${balance.memberId}):`);
      console.log(`  💰 Total Paid: ₹${balance.totalPaid.toFixed(2)}`);
      console.log(`  💸 Total Owed: ₹${balance.totalOwed.toFixed(2)}`);
      console.log(`  📊 Net Balance: ₹${balance.netBalance.toFixed(2)} ${
        balance.netBalance > 0 ? '(gets back)' : 
        balance.netBalance < 0 ? '(owes)' : '(settled)'
      }`);
      
      console.log(`  📋 Transactions:`);
      balance.transactions.forEach(transaction => {
        console.log(`    - ${transaction.expenseTitle}: ` +
          `Paid ₹${transaction.paid.toFixed(2)}, ` +
          `Owed ₹${transaction.owed.toFixed(2)}, ` +
          `Net ${transaction.net >= 0 ? '+' : ''}₹${transaction.net.toFixed(2)}`
        );
      });
    });

    console.log('\n🎯 WHO OWES WHOM:');
    this.calculateOwesRelationships(balances).forEach(relationship => {
      console.log(`  ${relationship.debtor} owes ${relationship.creditor} ₹${relationship.amount.toFixed(2)}`);
    });

    console.log('='.repeat(50));
  }

  private calculateOwesRelationships(balances: MemberBalance[]) {
    const creditors = balances.filter(b => b.netBalance > 0);
    const debtors = balances.filter(b => b.netBalance < 0);
    const relationships: Array<{
      debtor: string;
      creditor: string;
      amount: number;
    }> = [];

    // Simple algorithm: each debtor owes money to creditors
    debtors.forEach(debtor => {
      let remainingDebt = Math.abs(debtor.netBalance);
      
      creditors.forEach(creditor => {
        if (remainingDebt > 0 && creditor.netBalance > 0) {
          const amount = Math.min(remainingDebt, creditor.netBalance);
          relationships.push({
            debtor: debtor.memberName,
            creditor: creditor.memberName,
            amount
          });
          remainingDebt -= amount;
          creditor.netBalance -= amount;
        }
      });
    });

    return relationships;
  }

  private getMemberName(memberId: string): string {
    // Try to get name from existing expenses
    for (const expense of this.expenses) {
      if (expense.payerId === memberId) return expense.payerName;
      const split = expense.splits.find(s => s.memberId === memberId);
      if (split) return split.memberName;
    }
    return `Member ${memberId}`;
  }

  // Simulate your example
  static simulateYourExample() {
    console.log('🔬 SIMULATING YOUR EXAMPLE');
    console.log('Mauli adds ₹500 expense, split equally among 3 people');
    
    const balanceDebugger = new BalanceDebugger();
    
    balanceDebugger.addExpense({
      id: 'exp_001',
      title: 'Mauli\'s expense',
      amount: 500,
      payerId: 'mauli',
      payerName: 'Mauli',
      splits: [
        { memberId: 'deva', memberName: 'Deva', amount: 166.67 },
        { memberId: 'tejas', memberName: 'Tejas', amount: 166.67 },
        { memberId: 'mauli', memberName: 'Mauli', amount: 166.66 } // Last person gets the remainder
      ],
      date: new Date()
    });

    return balanceDebugger;
  }
}

// Usage example for your case
export const debugYourBalanceIssue = () => {
  console.log('\n🚨 DEBUGGING YOUR BALANCE ISSUE');
  BalanceDebugger.simulateYourExample();
};