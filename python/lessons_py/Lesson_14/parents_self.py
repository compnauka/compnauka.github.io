# Матеріали уроку

class Cars: 
    def wheels(self):
        print("Може їхати")

class Passenger_Car(Cars):
    def passengers(self):
        print("Перевозить людей")

class Cabriolet(Passenger_Car):
    def roof(self):
        self.passengers()
        self.wheels()
        print("Має відкидний дах")
        
my_car = Cabriolet()
my_car.roof()