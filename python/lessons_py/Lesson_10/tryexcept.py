# Матеріали уроку

user_input = input("Введи число: ")
try:
    number = int(user_input)
except:
    number = -1
if number > 0:
    print("Чудово!")
else:
    print("Це не число!")