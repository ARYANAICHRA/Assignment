import json
from datetime import datetime

class PersistenceError(Exception):
    pass

class Habit:
    def __init__(self, name, description):
        self.name = name
        self.description = description
        self.history = []

    def mark_done(self, date):
        if date not in self.history:
            self.history.append(date)
            self.history.sort()

    def streak(self):
        if not self.history:
            return 0
        dates = [datetime.strptime(d, "%Y-%m-%d") for d in sorted(self.history)]
        count = 1
        for i in range(len(dates) - 1, 0, -1):
            if (dates[i] - dates[i - 1]).days == 1:
                count += 1
            else:
                break
        return count

    def to_dict(self):
        return {
            "name": self.name,
            "description": self.description,
            "history": self.history
        }

    @classmethod
    def from_dict(cls, data):
        habit = cls(data["name"], data["description"])
        habit.history = data.get("history", [])
        return habit

class HabitTracker:
    DATE_FORMAT = "%Y-%m-%d"

    def __init__(self):
        self.habits = {}

    def add_habit(self, name, desc):
        self.habits[name] = Habit(name, desc)

    def remove_habit(self, name):
        if name in self.habits:
            del self.habits[name]

    def mark_done(self, name, date=None):
        if name in self.habits:
            if date is None:
                date = datetime.now().strftime(self.DATE_FORMAT)
            self.habits[name].mark_done(date)

    def list_habits(self):
        return list(self.habits.values())

    def report(self):
        return {name: habit.streak() for name, habit in self.habits.items()}

    def save(self, filename):
        try:
            with open(filename, "w") as f:
                data = {name: h.to_dict() for name, h in self.habits.items()}
                json.dump(data, f)
        except OSError:
            raise PersistenceError("Could not save data.")

    def load(self, filename):
        try:
            with open(filename, "r") as f:
                data = json.load(f)
                for name, habit_data in data.items():
                    self.habits[name] = Habit.from_dict(habit_data)
        except FileNotFoundError:
            self.habits = {}
        except json.JSONDecodeError:
            raise PersistenceError("Could not load data.")
