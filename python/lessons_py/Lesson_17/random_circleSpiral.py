from turtle import *
import random

colors = ["red",
          "yellow",
          "blue",
          "green"]

for x in range(500):
    color(colors[x%4])
    circle(x)
    left(random.randint(85,100))