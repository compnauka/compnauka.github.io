import time
from tkinter import *
tk = Tk()

canvas = Canvas(tk, width=400, height=300)
canvas.pack()
canvas.create_polygon(5,5,35,35,5,60)
for x in range(0,70):
    canvas.move(1,5,0)
    tk.update()
    time.sleep(0.05)