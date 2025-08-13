import time
from tkinter import *
tk = Tk()

canvas = Canvas(tk, width=400, height=400)
canvas.pack()

canvas.create_oval(5, 5, 205, 205,
                   outline="red",
                   fill="orange")
canvas.create_oval(20, 250, 380, 380,
                   outline="blue",
                   fill="yellow")