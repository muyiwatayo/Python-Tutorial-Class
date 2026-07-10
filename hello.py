class coffee:
    def __init__(self, name, price):
        self.price = price 

class Order:
    def __init__(self):
        self.items = []

    def add_item(self, coffe):
        self.items.append(coffee)

        print(f"Added {coffee.name} to your order")

    def total(self):
        return sum(item.price for item in self.items)
    

    def show_order(self):

        if not self.items:

            print("No items in order.")

            return
        
        print("\nYour Order:")

        for i, items in enumerate(self.items, 1):

            print(f"{i}. {item.name} - ${item.price}")

        print(f"Total: ${self.total()}\n")

    def checkout():
        print("Hello")