"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, Crown, History, Unlock, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getMembershipByUserId,
  getTransactionsByUserId,
  getAllContactUnlocks,
} from "@/services/monetizationService";
import { MembershipWithId, TransactionWithId, ContactUnlockWithId } from "@/types/monetization";
import TransactionTable from "@/components/monetization/TransactionTable";

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading, role } = useAuth();
  const [membership, setMembership] = useState<MembershipWithId | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithId[]>([]);
  const [unlocks, setUnlocks] = useState<ContactUnlockWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      const [membershipResult, transactionsResult, unlocksResult] = await Promise.all([
        getMembershipByUserId(user.uid),
        getTransactionsByUserId(user.uid),
        getAllContactUnlocks(),
      ]);

      if (membershipResult.membership) {
        setMembership(membershipResult.membership);
      }
      if (transactionsResult.transactions) {
        setTransactions(transactionsResult.transactions);
      }
      if (unlocksResult.unlocks) {
        setUnlocks(unlocksResult.unlocks);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const membershipTransactions = transactions.filter((t) => t.type === "customer_membership");
  const unlockTransactions = transactions.filter((t) => t.type === "customer_contact_unlock");

  if (authLoading || !user) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-3">
              My Billing
            </h1>
            <p className="text-text-secondary">Manage your membership, transactions, and unlocked contacts.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-warning-50 dark:bg-warning-950 rounded-xl flex items-center justify-center text-warning">
                  <Crown className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text">Membership</h3>
              </div>
              {membership ? (
                <div>
                  <Badge variant={membership.status === "active" ? "success" : "warning"} className="mb-2">
                    {membership.planId.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-text-secondary">
                    Status: {membership.status}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No active membership.</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center text-primary">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text">Transactions</h3>
              </div>
              <p className="text-2xl font-bold text-text">{transactions.length}</p>
              <p className="text-sm text-text-secondary">Total transactions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-success-50 dark:bg-success-950 rounded-xl flex items-center justify-center text-success">
                  <Unlock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text">Unlocked Contacts</h3>
              </div>
              <p className="text-2xl font-bold text-text">{unlocks.length}</p>
              <p className="text-sm text-text-secondary">Workers unlocked</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 mb-10"
          >
            <h2 className="text-xl font-bold font-heading text-text mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Transaction History
            </h2>
            <TransactionTable transactions={transactions} loading={loading} />
          </motion.div>

          {unlocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700"
            >
              <h2 className="text-xl font-bold font-heading text-text mb-6 flex items-center gap-2">
                <Unlock className="w-5 h-5 text-success" />
                Unlocked Contacts
              </h2>
              <div className="space-y-3">
                {unlocks.map((unlock) => (
                  <div key={unlock.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-text">Worker ID: {unlock.workerId}</p>
                      <p className="text-sm text-text-secondary">
                        Unlocked on {new Date(unlock.unlockedAt || unlock.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge variant={unlock.status === "success" ? "success" : "warning"}>
                      {unlock.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
