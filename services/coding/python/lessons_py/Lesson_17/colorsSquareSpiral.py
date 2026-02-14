from turtle import *

speed(10)
colors = ["red",
          "yellow",
          "blue",
          "green"]
for x in range(500):
    color(colors[x%4])
    forward(x)
    left(91)