# Матеріали уроку

class Cube:
    def volume (self, length, width, height):
        return int(length)*int(width)*int(height)

xyz = Cube() # створюємо екземпляр класу Cube
print(xyz.volume(4,4,4)) # икористовуємо метод volume для розрахунку обсягу 