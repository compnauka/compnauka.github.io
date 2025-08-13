import time
from tkinter import *
tk = Tk()

canvas = Canvas(tk, width=400, height=200)
canvas.pack()
canvas.create_oval(350, 10, 395, 55,
                   outline="red",
                   fill="orange")
for x in range(0,69):
    canvas.move(1,-5,0)
    tk.update()
    time.sleep(0.05)