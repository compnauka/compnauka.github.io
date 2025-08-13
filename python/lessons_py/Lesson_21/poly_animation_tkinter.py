import time
from tkinter import *
tk = Tk()

canvas = Canvas(tk, width=400, height=300)
canvas.pack()
canvas.create_polygon(5,5,45,45,5,85)
canvas.create_polygon(5,100,45,140,5,180)
canvas.create_polygon(5,200,45,240,5,280)
for x in range(0,40):
    canvas.move(1,5,0)
    canvas.move(2,3,0)
    canvas.move(3,8,0)
    tk.update()
    time.sleep(0.05)