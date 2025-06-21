class BankAccount:
    total_accounts = 0
    def __init__(self, owner: str, balance: float = 0.0):
        self.owner = owner
        self.__balance = balance
        BankAccount.total_accounts += 1

    @property
    def balance(self):
        return self.__balance

    @balance.setter
    def balance(self, value):
        if value >= 0:
            self.__balance = value
        else:
            print("Balance cannot be negative")

    def deposit(self, amt: float):
        if amt > 0:
            self.__balance += amt
        else:
            print("Invalid amount for deposit")

    def withdraw(self, amt: float):
        if 0 < amt <= self.__balance:
            self.__balance -= amt
        else:
            print("Invalid amount for withdrawal")

    def __str__(self):
        return f"BankAccount(owner={self.owner}, balance={self.__balance:.2f})"

    def __repr__(self):
        return f"BankAccount(owner={self.owner!r}, balance={self.__balance!r})"

    def __add__(self, other):
        if isinstance(other, BankAccount):
            new_owner = f"{self.owner} & {other.owner}"
            new_balance = self.__balance + other.__balance
            return BankAccount(new_owner, new_balance)
        return NotImplemented

class SavingsAccount(BankAccount):
    def __init__(self, owner: str, balance: float = 0.0, interest_rate: float = 0.03):
        super().__init__(owner, balance)
        self.interest_rate = interest_rate

    def apply_interest(self):
        self.balance += self.balance * self.interest_rate

class CheckingAccount(BankAccount):
    def __init__(self, owner: str, balance: float = 0.0, overdraft_limit: float = 0.0):
        super().__init__(owner, balance)
        self._overdraft_limit = overdraft_limit

    @property
    def overdraft_limit(self):
        return self._overdraft_limit

    @overdraft_limit.setter
    def overdraft_limit(self, limit):
        if limit >= 0:
            self._overdraft_limit = limit
        else:
            print("Overdraft limit must be non-negative")

    def withdraw(self, amt: float):
        if 0 < amt <= self.balance + self._overdraft_limit:
            self.balance -= amt
        else:
            print("Amount exceeds overdraft limit")

class Customer:
    def __init__(self, name: str):
        self.name = name
        self.accounts = []

    def add_account(self, account: BankAccount):
        self.accounts.append(account)

    def total_balance(self):
        return sum(account.balance for account in self.accounts)

    def transfer(self, from_acc: BankAccount, to_acc: BankAccount, amt: float):
        if from_acc.balance >= amt:
            from_acc.withdraw(amt)
            to_acc.deposit(amt)
        else:
            print("Transfer failed: Insufficient funds")

def print_account_summary(obj):
    try:
        print(f"Owner: {obj.owner}, Balance: {obj.balance}")
    except AttributeError:
        print("Invalid object passed")

class DummyAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance
