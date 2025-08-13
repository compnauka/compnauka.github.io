from turtle import *

bgcolor("black")

colors = ["red",
          "yellow",
          "blue",
          "green"]

for x in range(100):
    color(colors[x%4])
    circle(x)
    left(91)