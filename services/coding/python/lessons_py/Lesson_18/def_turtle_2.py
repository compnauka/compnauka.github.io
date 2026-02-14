from turtle import *

def my_square(side, fill):
    if fill == True:
        begin_fill()
    for x in range(1,5):
        forward(side)
        left(90)
    if fill == True:
        end_fill()
 
my_square(100, True)
my_square(150, False)
my_square(200, False)
my_square(250, False)
