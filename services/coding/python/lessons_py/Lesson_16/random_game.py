import random

num = random.randint(1,10)
while True:
    print("Вгадай число від 1 до 10")
    guess = int(input())
    if guess == num:
        print("Ти вгадав!")
        break
    elif guess < num:
        print("Бери вище!")
    elif guess > num:
        print("Бери нижче!")