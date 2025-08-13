# Матеріали уроку

class Cube:
    def __init__(self, length):
        self.length = length
    def volume (self, length):
        return length**3

xyz = Cube(6)
print(xyz.length)
print(xyz.volume(xyz.length))

xyz.length = 5
print(xyz.volume(xyz.length))