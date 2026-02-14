# Практична робота

import turtle

a = turtle.Pen()
b = turtle.Pen()
c = turtle.Pen()
d = turtle.Pen()

b.left(180)
c.left (90)
d.left(270)

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
    
path = 100    
for i in range(10):
    c.forward(path)
    c.right(90)
    path -= 10
    
path = 100    
for i in range(10):
    d.forward(path)
    d.right(90)
    path -= 10