# Практична робота

class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width
    def square (self, length, width):
        return int(length)*int(width)

new_plane = Rectangle(80, 50)
print(new_plane.square(new_plane.length, new_plane.width))