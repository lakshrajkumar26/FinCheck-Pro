import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { 
  Plus, Users as UsersIcon, Mail, Shield, 
  ArrowUpRight, ArrowDownRight, Calendar, Tag, FileText,
  IndianRupee, X, Receipt, TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/formatNumber';

async function fetchUsers(companyId = 1) {
  const res = await api.get('/users', { params: { companyId } });
  return res.data;
}

async function fetchUserTransactions(userId) {
  const res = await api.get('/transactions', { params: { userId, limit: 1000 } });
  return res.data;
}

export default function Users() {
  const companyId = 1;
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userTransactionsModal, setUserTransactionsModal] = useState({ open: false, userId: null });
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => fetchUsers(companyId)
  });

  // Fetch transactions for selected user
  const { data: userTransactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['userTransactions', userTransactionsModal.userId],
    queryFn: () => fetchUserTransactions(userTransactionsModal.userId),
    enabled: !!userTransactionsModal.userId && userTransactionsModal.open
  });

  const createMut = useMutation({
    mutationFn: payload => api.post('/users', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', companyId] });
      toast.success('User created successfully');
    },
    onError: () => toast.error('Failed to create user')
  });

  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  async function onSubmit(values) {
    try {
      await createMut.mutateAsync({ ...values, companyId });
      setOpen(false);
      reset();
    } catch (err) {
      console.error(err);
    }
  }

  function handleUserClick(userId) {
    setUserTransactionsModal({ open: true, userId });
  }

  function closeTransactionsModal() {
    setUserTransactionsModal({ open: false, userId: null });
  }

  // Calculate totals for selected user
  const transactions = userTransactionsData?.transactions || [];
  const totalCredits = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalDebits = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const balance = totalCredits - totalDebits;
  const selectedUser = data?.find(u => u.id === userTransactionsModal.userId);

  if (error) console.error('Users fetch error', error);

  const getRoleBadgeColor = (role) => {
    const colors = {
      founder: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      accountant: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      hr: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    };
    return colors[role] || colors.employee;
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-teal-500 text-white shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UsersIcon className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">Users</CardTitle>
                {/* <p className="text-blue-100 text-sm mt-1">Manage team members and view their transactions</p> */}
              </div>
            </div>
            <Button 
              onClick={() => { reset(); setOpen(true); }} 
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New User
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Manage team members and view their transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-4">Loading users...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No users found. Create your first user!
                </div>
              ) : (
                data?.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md">
                        <UsersIcon className="h-6 w-6 text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="pt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Click to view transactions →
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Transactions Modal */}
      <Modal 
        open={userTransactionsModal.open} 
        onClose={closeTransactionsModal}
        title={selectedUser ? `${selectedUser.name}'s Transactions` : 'User Transactions'}
        size="large"
      >
        {isLoadingTransactions ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Loading transactions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Credits</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(totalCredits)}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Debits</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(totalDebits)}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Balance</p>
                      <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balance)}
                      </p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      balance >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      <IndianRupee className={`h-5 w-5 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
                      <p className="text-xl font-bold">
                        {transactions.length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found for this user.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Subcategory</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Invoice</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{dayjs(tx.date).format('MMM DD, YYYY')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {tx.type === 'CREDIT' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.type === 'CREDIT' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {tx.type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-bold">
                              {formatCurrency(tx.amount)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>{tx.category?.name || 'Uncategorized'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-muted-foreground">
                            {tx.subcategory?.name || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {tx.invoice ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">{tx.invoice.invoiceNumber}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {tx.note || tx.reconciliationNote || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create User Modal */}
      <Modal open={open} onClose={() => { setOpen(false); reset(); }} title="New User">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register('name')} placeholder="Full name" required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email')} placeholder="email@example.com" required />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select {...register('role')} className="w-full h-10 px-3 rounded-md border border-input bg-background" required>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="accountant">Accountant</option>
              <option value="founder">Founder</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-primary text-white" disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating...' : 'Create User'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
