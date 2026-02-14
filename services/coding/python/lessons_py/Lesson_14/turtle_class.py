# Матеріали уроку

import turtle

a = turtle.Pen()
b = turtle.Pen()
b.left(180)

path = 100
for i in range(10):
    a.forward(path)
    a.right(90)
    path -= 10
    
path = 100    
for i in range(10):
    b.forward(path)
    b.right(90)
    path -= 10