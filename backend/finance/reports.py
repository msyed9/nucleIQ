"""
Financial Reports Service
"""

from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Q
from .models import LedgerAccount, JournalEntry, JournalEntryLine


class FinancialReportsService:
    """Service for generating financial reports."""
    
    @staticmethod
    def get_income_statement(tenant, start_date, end_date):
        """
        Generate Income Statement (Profit & Loss).
        Revenue - Expenses = Net Profit/Loss
        """
        # Get all income accounts
        income_accounts = LedgerAccount.objects.filter(
            tenant=tenant,
            account_type='INCOME',
            is_active=True
        )
        
        # Get all expense accounts
        expense_accounts = LedgerAccount.objects.filter(
            tenant=tenant,
            account_type='EXPENSE',
            is_active=True
        )
        
        # Calculate income
        income_data = []
        total_income = Decimal('0.00')
        
        for account in income_accounts:
            credits = JournalEntryLine.objects.filter(
                account=account,
                entry__is_posted=True,
                entry__entry_date__range=[start_date, end_date]
            ).aggregate(Sum('credit_amount'))['credit_amount__sum'] or Decimal('0.00')
            
            debits = JournalEntryLine.objects.filter(
                account=account,
                entry__is_posted=True,
                entry__entry_date__range=[start_date, end_date]
            ).aggregate(Sum('debit_amount'))['debit_amount__sum'] or Decimal('0.00')
            
            balance = credits - debits
            if balance != 0:
                income_data.append({
                    'account': account.name,
                    'amount': balance
                })
                total_income += balance
        
        # Calculate expenses
        expense_data = []
        total_expenses = Decimal('0.00')
        
        for account in expense_accounts:
            debits = JournalEntryLine.objects.filter(
                account=account,
                entry__is_posted=True,
                entry__entry_date__range=[start_date, end_date]
            ).aggregate(Sum('debit_amount'))['debit_amount__sum'] or Decimal('0.00')
            
            credits = JournalEntryLine.objects.filter(
                account=account,
                entry__is_posted=True,
                entry__entry_date__range=[start_date, end_date]
            ).aggregate(Sum('credit_amount'))['credit_amount__sum'] or Decimal('0.00')
            
            balance = debits - credits
            if balance != 0:
                expense_data.append({
                    'account': account.name,
                    'amount': balance
                })
                total_expenses += balance
        
        net_profit = total_income - total_expenses
        
        return {
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'income': {
                'items': income_data,
                'total': total_income
            },
            'expenses': {
                'items': expense_data,
                'total': total_expenses
            },
            'net_profit': net_profit,
            'is_profit': net_profit >= 0
        }
    
    @staticmethod
    def get_balance_sheet(tenant, as_of_date):
        """
        Generate Balance Sheet.
        Assets = Liabilities + Equity
        """
        asset_accounts = LedgerAccount.objects.filter(
            tenant=tenant,
            account_type='ASSET',
            is_active=True
        )
        
        liability_accounts = LedgerAccount.objects.filter(
            tenant=tenant,
            account_type='LIABILITY',
            is_active=True
        )
        
        equity_accounts = LedgerAccount.objects.filter(
            tenant=tenant,
            account_type='EQUITY',
            is_active=True
        )
        
        # Calculate assets
        asset_data = []
        total_assets = Decimal('0.00')
        
        for account in asset_accounts:
            balance = account.get_balance()
            if balance != 0:
                asset_data.append({
                    'account': account.name,
                    'amount': balance
                })
                total_assets += balance
        
        # Calculate liabilities
        liability_data = []
        total_liabilities = Decimal('0.00')
        
        for account in liability_accounts:
            balance = account.get_balance()
            if balance != 0:
                liability_data.append({
                    'account': account.name,
                    'amount': balance
                })
                total_liabilities += balance
        
        # Calculate equity
        equity_data = []
        total_equity = Decimal('0.00')
        
        for account in equity_accounts:
            balance = account.get_balance()
            if balance != 0:
                equity_data.append({
                    'account': account.name,
                    'amount': balance
                })
                total_equity += balance
        
        return {
            'as_of_date': as_of_date,
            'assets': {
                'items': asset_data,
                'total': total_assets
            },
            'liabilities': {
                'items': liability_data,
                'total': total_liabilities
            },
            'equity': {
                'items': equity_data,
                'total': total_equity
            },
            'total_liabilities_equity': total_liabilities + total_equity,
            'is_balanced': total_assets == (total_liabilities + total_equity)
        }
    
    @staticmethod
    def get_day_book(tenant, date_val):
        """
        Generate Day Book - Daily cash in/out summary.
        """
        entries = JournalEntry.objects.filter(
            tenant=tenant,
            entry_date=date_val,
            is_posted=True
        ).prefetch_related('lines', 'lines__account')
        
        cash_in = Decimal('0.00')
        cash_out = Decimal('0.00')
        transactions = []
        
        for entry in entries:
            entry_data = {
                'entry_number': entry.entry_number,
                'description': entry.description,
                'lines': []
            }
            
            for line in entry.lines.all():
                entry_data['lines'].append({
                    'account': line.account.name,
                    'debit': line.debit_amount,
                    'credit': line.credit_amount
                })
                
                # Track cash movements
                if 'cash' in line.account.name.lower():
                    cash_in += line.debit_amount
                    cash_out += line.credit_amount
            
            transactions.append(entry_data)
        
        return {
            'date': date_val,
            'cash_in': cash_in,
            'cash_out': cash_out,
            'net_cash_flow': cash_in - cash_out,
            'transactions': transactions
        }
