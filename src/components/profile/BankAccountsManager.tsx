import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Plus, Trash2, CheckCircle, AlertTriangle, CreditCard, Landmark } from "lucide-react";
import { toast } from "sonner";
const bankAccountSchema = z.object({
  accountNumber: z.string().min(9, "Account number must be at least 9 digits").max(18, "Account number must be at most 18 digits").regex(/^[0-9]+$/, "Account number must contain only digits"),
  confirmAccountNumber: z.string(),
  ifscCode: z.string().min(11, "IFSC code must be 11 characters").max(11, "IFSC code must be 11 characters").regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Please enter a valid IFSC code"),
  bankName: z.string().min(1, "Bank name is required"),
  branchName: z.string().min(1, "Branch name is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  accountType: z.enum(["savings", "current", "salary", "other"]),
  nickname: z.string().optional()
}).refine(data => data.accountNumber === data.confirmAccountNumber, {
  message: "Account numbers don't match",
  path: ["confirmAccountNumber"]
});
type BankAccountFormData = z.infer<typeof bankAccountSchema>;
interface BankAccount {
  id: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountHolderName: string;
  accountType: string;
  nickname?: string;
  isVerified: boolean;
  isPrimary: boolean;
  maskedAccountNumber: string;
}
const BankAccountsManager = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([{
    id: "1",
    accountNumber: "1234567890123456",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    branchName: "Main Branch",
    accountHolderName: "Current User",
    accountType: "savings",
    nickname: "Primary SBI",
    isVerified: true,
    isPrimary: true,
    maskedAccountNumber: "****-****-****-3456"
  }]);
  const [showAddForm, setShowAddForm] = useState(false);
  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountHolderName: "",
      accountType: "savings",
      nickname: ""
    }
  });
  const onSubmit = (data: BankAccountFormData) => {
    const maskedAccountNumber = `****-****-****-${data.accountNumber.slice(-4)}`;
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode.toUpperCase(),
      bankName: data.bankName,
      branchName: data.branchName,
      accountHolderName: data.accountHolderName,
      accountType: data.accountType,
      nickname: data.nickname,
      isVerified: false,
      isPrimary: bankAccounts.length === 0,
      maskedAccountNumber
    };
    setBankAccounts([...bankAccounts, newAccount]);
    setShowAddForm(false);
    form.reset();
    toast.success("Bank account added successfully!");
  };
  const deleteAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter(account => account.id !== id));
    toast.success("Bank account removed successfully!");
  };
  const setPrimary = (id: string) => {
    setBankAccounts(bankAccounts.map(account => ({
      ...account,
      isPrimary: account.id === id
    })));
    toast.success("Primary bank account updated!");
  };
  const verifyAccount = (id: string) => {
    // Simulate verification process
    setBankAccounts(bankAccounts.map(account => account.id === id ? {
      ...account,
      isVerified: true
    } : account));
    toast.success("Bank account verified successfully!");
  };
  const getBankIcon = (bankName: string) => {
    // You can add specific icons for different banks
    if (bankName.toLowerCase().includes('sbi')) {
      return <Landmark className="w-6 h-6 text-blue-600" />;
    } else if (bankName.toLowerCase().includes('hdfc')) {
      return <Building2 className="w-6 h-6 text-red-600" />;
    } else if (bankName.toLowerCase().includes('icici')) {
      return <CreditCard className="w-6 h-6 text-orange-600" />;
    }
    return <Building2 className="w-6 h-6 text-gray-600" />;
  };
  return <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Building2 className="w-5 h-5" />
            Bank Accounts
          </CardTitle>
          <CardDescription>
            Manage your bank accounts for direct transfers and automated payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-accent/10 border-accent/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your bank account information is encrypted and secure. Only you can view the full details.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Bank Accounts List */}
      <div className="space-y-4">
        {bankAccounts.map(account => <Card key={account.id} className="glass-card">
            <CardContent className="p-6 bg-card/90 backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                    {getBankIcon(account.bankName)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-card-foreground">
                        {account.nickname || account.bankName}
                      </h3>
                      {account.isPrimary && <Badge variant="default">Primary</Badge>}
                      {account.isVerified ? <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge> : <Badge variant="outline">Unverified</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {account.maskedAccountNumber}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{account.bankName}</span>
                      <span>•</span>
                      <span>{account.ifscCode}</span>
                      <span>•</span>
                      <span className="capitalize">{account.accountType} Account</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {account.branchName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!account.isVerified && <Button variant="outline" size="sm" onClick={() => verifyAccount(account.id)}>
                      Verify
                    </Button>}
                  {!account.isPrimary && <Button variant="outline" size="sm" onClick={() => setPrimary(account.id)}>
                      Set Primary
                    </Button>}
                  <Button variant="outline" size="sm" onClick={() => deleteAccount(account.id)} className="text-gray-950 bg-gray-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Add New Bank Account Form */}
      {showAddForm ? <Card className="glass-card">
          <CardHeader>
            <CardTitle>Add New Bank Account</CardTitle>
            <CardDescription>
              Please enter your bank account details carefully. All information is encrypted and secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Account Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-card-foreground">Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="accountNumber" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Account Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter account number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="confirmAccountNumber" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Confirm Account Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Re-enter account number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="ifscCode" render={({
                  field
                }) => <FormItem>
                          <FormLabel>IFSC Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="ABCD0123456" style={{
                      textTransform: 'uppercase'
                    }} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="accountType" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Account Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="savings">Savings Account</SelectItem>
                              <SelectItem value="current">Current Account</SelectItem>
                              <SelectItem value="salary">Salary Account</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-card-foreground">Bank Details</h3>
                  <FormField control={form.control} name="accountHolderName" render={({
                field
              }) => <FormItem>
                        <FormLabel>Account Holder Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name as per bank records" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="bankName" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Bank Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="State Bank of India" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="branchName" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Branch Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Main Branch, City Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <FormField control={form.control} name="nickname" render={({
                field
              }) => <FormItem>
                        <FormLabel>Nickname (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="My SBI Account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="bg-primary hover:bg-primary-dark">
                    Add Bank Account
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                setShowAddForm(false);
                form.reset();
              }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card> : <Button onClick={() => setShowAddForm(true)} className="w-full bg-primary hover:bg-primary-dark" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Add New Bank Account
        </Button>}
    </div>;
};
export default BankAccountsManager;