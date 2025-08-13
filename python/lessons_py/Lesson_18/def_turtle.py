from turtle import *

def my_circle(clr):
    color(str(clr))
    begin_fill()
    circle(50)
    end_fill()

goto(-100, 0)
my_circle("red")
goto(100, 0)
my_circle("green")
goto(0, 100)
my_circle("yellow")