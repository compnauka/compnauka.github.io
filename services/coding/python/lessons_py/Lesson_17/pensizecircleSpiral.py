from turtle import *

pensize(5)
colors = ["red",
          "yellow",
          "blue",
          "green"]

for x in range(50):
    color(colors[x%4])
    circle(x)
    left(91)