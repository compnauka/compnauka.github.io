# Матеріали уроку

class Cars: 
    def wheels(self):
        print("Може їхати")

class Passenger_Car(Cars):
    def passengers(self):
        print("Перевозить людей")

class Cabriolet(Passenger_Car):
    def roof(self):
        print("Має відкидний дах")
        
my_car = Cabriolet()
my_car.roof()
my_car.passengers()
my_car.wheels()