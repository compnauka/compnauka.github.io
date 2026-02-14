# Матеріали уроку

class Empty: # створюємо клас Empty
    pass

class Hello: # створюємо клас Hello
    message = "Hello!"
    
e = Empty() # об'єкт класу Empty 
print(type(e))
m = Hello() # об'єкт класу Hello
print(m.message)