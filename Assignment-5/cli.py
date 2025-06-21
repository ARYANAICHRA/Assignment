from habits import HabitTracker, PersistenceError
from datetime import datetime

FILENAME = "habits.json"

def show_menu():
    print("\nHabit Tracker Menu")
    print("1. Add new habit")
    print("2. Remove habit")
    print("3. Mark habit done")
    print("4. List all habits")
    print("5. Show streak report")
    print("6. Save and Exit")

def main():
    tracker = HabitTracker()

    try:
        tracker.load(FILENAME)
    except PersistenceError as e:
        print("Warning:", e)

    while True:
        show_menu()
        try:
            choice = int(input("Choose an option: "))
            if choice == 1:
                name = input("Enter habit name: ")
                desc = input("Enter description: ")
                tracker.add_habit(name, desc)

            elif choice == 2:
                name = input("Enter habit name to remove: ")
                tracker.remove_habit(name)

            elif choice == 3:
                name = input("Enter habit name: ")
                date = input("Date (YYYY-MM-DD) [leave blank for today]: ")
                if date == "":
                    tracker.mark_done(name)
                else:
                    try:
                        datetime.strptime(date, "%Y-%m-%d")
                        tracker.mark_done(name, date)
                    except ValueError:
                        print("Invalid date format.")

            elif choice == 4:
                for habit in tracker.list_habits():
                    print(f"{habit.name} - {habit.description}")

            elif choice == 5:
                for name, streak in tracker.report().items():
                    print(f"{name}: {streak} day(s)")

            elif choice == 6:
                try:
                    tracker.save(FILENAME)
                    print("Saved successfully. Goodbye!")
                except PersistenceError:
                    print("Error saving data.")
                break

            else:
                print("Choose a number between 1 and 6.")

        except ValueError:
            print("Invalid input. Enter a number.")

if __name__ == "__main__":
    main()
