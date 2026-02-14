# Матеріали уроку

# функція для визначення обсягу
def volume (length, width, height):
    print(length * width * height)
# виклик функції з аргументами
volume(5, 7, 9)
# створення змінних
ln, wd, hg = 55, 77, 99
# виклик функції з аргументами
volume(ln, wd, hg)

# Повернення значення функції за допомогою return
def volume (length, width, height):
    return length * width * height

ln = int(input("Довжина: "))
wd = int(input("Ширина: "))
hg = int(input("Висота: "))
vol = volume(ln, wd, hg)
print("Обсяг дорівнює:", vol)