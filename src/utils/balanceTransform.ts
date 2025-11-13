import { GroupBalanceSummary } from '@/lib/types';

interface EnhancedBalanceDetail {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: {
      url?: string;
    };
  };
  netBalance: number;
  totalGetsBack: number;
  totalNeedsToPay: number;
  owesTo: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: {
        url?: string;
      };
    };
    amount: number;
  }>;
  owedBy: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: {
        url?: string;
      };
    };
    amount: number;
  }>;
}

/**
 * Transform member balances data to enhanced balance detail format
 * @param memberBalances Array of member balances from API
 * @param allBalances All individual balance records
 * @returns Enhanced balance details with owes/owed relationships
 */
export const transformMemberBalances = (
  memberBalances: GroupBalanceSummary['memberBalances'],
  allBalances: any[]
): EnhancedBalanceDetail[] => {
  // Create a map of user ID to user details for quick lookup
  const userMap = new Map();
  memberBalances.forEach(member => {
    userMap.set(member.user._id, member.user);
  });

  // Transform each member balance
  return memberBalances.map(member => {
    const userId = member.user._id;
    
    // Find all individual balances involving this user
    const userBalances = allBalances.filter(balance => 
      balance.userA._id === userId || balance.userB._id === userId
    );
    
    // Calculate detailed owes/owed relationships
    const owesTo: EnhancedBalanceDetail['owesTo'] = [];
    const owedBy: EnhancedBalanceDetail['owedBy'] = [];
    
    userBalances.forEach(balance => {
      const isUserA = balance.userA._id === userId;
      const otherUser = isUserA ? balance.userB : balance.userA;
      
      if (balance.amount > 0) {
        // If amount > 0, userA owes userB
        if (isUserA) {
          owesTo.push({
            user: otherUser,
            amount: balance.amount
          });
        } else {
          owedBy.push({
            user: otherUser,
            amount: balance.amount
          });
        }
      } else if (balance.amount < 0) {
        // If amount < 0, userB owes userA
        const absAmount = Math.abs(balance.amount);
        if (isUserA) {
          owedBy.push({
            user: otherUser,
            amount: absAmount
          });
        } else {
          owesTo.push({
            user: otherUser,
            amount: absAmount
          });
        }
      }
    });
    
    return {
      user: member.user,
      netBalance: member.netBalance,
      totalGetsBack: member.totalGetsBack,
      totalNeedsToPay: member.totalNeedsToPay,
      owesTo,
      owedBy
    };
  });
};