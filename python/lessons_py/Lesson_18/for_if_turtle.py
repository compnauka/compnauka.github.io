from turtle import *

for x in range(18):
    forward(200)
    if x % 2 == 0:
        left(175)
    else:
        left(225)
hideturtle()