from turtle import *
speed(1000)
shape("classic")
color("Dark Orchid")

for x in range(100):
    circle(x)
    left(91)


getscreen().getcanvas().postscript(file='outputname.ps')